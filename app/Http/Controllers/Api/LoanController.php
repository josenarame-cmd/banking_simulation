<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\Loan;
use App\Models\LoanDocument;
use App\Services\LoanService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class LoanController extends Controller
{
    /**
     * Submit a loan application with optional supporting documents.
     */
    public function apply(Request $request): JsonResponse
    {
        $request->validate([
            'account_id'      => 'required|exists:bank_accounts,id',
            'principal_amount' => 'required|numeric|min:100',
            'term_months'     => 'required|integer|min:1|max:60',
            'purpose'         => 'required|string|max:500',
            // Single legacy field (kept for backwards compat)
            'document'        => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            // Multiple documents
            'documents'           => 'nullable|array|max:10',
            'documents.*'         => 'file|mimes:pdf,jpg,jpeg,png|max:5120',
            'document_types'      => 'nullable|array',
            'document_types.*'    => 'nullable|string|max:60',
        ]);

        $account = BankAccount::findOrFail($request->account_id);
        $user    = $request->user();

        // Handle legacy single-document field (backward compat)
        $documentPath = null;
        if ($request->hasFile('document')) {
            $documentPath = $request->file('document')->store('loan_documents', 'public');
        }

        try {
            $loan = LoanService::apply(
                $user,
                $account,
                (float) $request->principal_amount,
                (int) $request->term_months,
                $request->purpose,
                $documentPath
            );

            // Handle multiple new-style document uploads
            if ($request->hasFile('documents')) {
                foreach ($request->file('documents') as $index => $file) {
                    $docType  = $request->input("document_types.$index", 'other');
                    $path     = $file->store("loan_docs/{$loan->id}", 'public');
                    LoanDocument::create([
                        'loan_id'       => $loan->id,
                        'document_type' => $docType,
                        'file_path'     => $path,
                        'original_name' => $file->getClientOriginalName(),
                        'file_size'     => $file->getSize(),
                        'mime_type'     => $file->getMimeType(),
                    ]);
                }
            }

            // Also store the legacy single doc as a LoanDocument record
            if ($documentPath) {
                LoanDocument::create([
                    'loan_id'       => $loan->id,
                    'document_type' => 'other',
                    'file_path'     => $documentPath,
                    'original_name' => $request->file('document')->getClientOriginalName(),
                    'file_size'     => $request->file('document')->getSize(),
                    'mime_type'     => $request->file('document')->getMimeType(),
                ]);
            }

            return response()->json([
                'status'  => 'success',
                'message' => 'Loan application submitted successfully. It is now awaiting administrative review.',
                'loan'    => $loan->load(['account', 'loanDocuments']),
            ], 201);
        } catch (Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * Get loans belonging to the authenticated user.
     */
    public function myLoans(Request $request): JsonResponse
    {
        $loans = Loan::with(['account', 'schedules', 'repayments', 'loanDocuments'])
            ->where('user_id', $request->user()->id)
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data'   => $loans,
        ]);
    }

    /**
     * List all loans (admin & officer).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Loan::with(['user', 'account', 'approver', 'schedules', 'loanDocuments']);

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        $loans = $query->orderBy('id', 'desc')->paginate($request->get('per_page', 15));

        return response()->json($loans);
    }

    /**
     * Show single loan details with complete installment schedule and documents.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $loan = Loan::with(['user', 'account', 'approver', 'schedules', 'repayments.transaction', 'loanDocuments'])
            ->findOrFail($id);

        $user = $request->user();
        if (!$user->isAdmin() && !$user->isOfficer() && $loan->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        return response()->json([
            'status' => 'success',
            'loan'   => $loan,
        ]);
    }

    /**
     * Approve and disburse loan — ADMIN ONLY (enforced by route middleware).
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'approved_principal' => 'nullable|numeric|min:100',
            'approved_rate'      => 'nullable|numeric|min:0',
            'approved_term'      => 'nullable|integer|min:1|max:60',
            'notes'              => 'nullable|string|max:1000',
        ]);

        $loan = Loan::findOrFail($id);

        try {
            $approvedLoan = LoanService::approveAndDisburse(
                $loan,
                $request->user(),
                $request->approved_principal ? (float) $request->approved_principal : null,
                $request->approved_rate ? (float) $request->approved_rate : null,
                $request->approved_term ? (int) $request->approved_term : null
            );

            return response()->json([
                'status'  => 'success',
                'message' => "Loan #{$loan->id} approved and \${$approvedLoan->principal_amount} disbursed successfully.",
                'loan'    => $approvedLoan,
            ]);
        } catch (Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * Reject loan application — ADMIN ONLY (enforced by route middleware).
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        $request->validate(['reason' => 'required|string|max:500']);
        $loan = Loan::findOrFail($id);

        try {
            $rejectedLoan = LoanService::reject($loan, $request->user(), $request->reason);
            return response()->json([
                'status'  => 'success',
                'message' => "Loan #{$loan->id} has been rejected.",
                'loan'    => $rejectedLoan,
            ]);
        } catch (Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * Stream or download supporting document (Admin, Officer, or Applicant).
     * Accepts authentication via Sanctum Bearer header OR ?token= query parameter.
     */
    public function viewDocument(Request $request, int $id)
    {
        // Resolve user via Bearer token or ?token= query parameter
        $tokenString = $request->bearerToken() ?: $request->query('token');
        $user = null;
        if ($tokenString) {
            $tokenModel = \Laravel\Sanctum\PersonalAccessToken::findToken($tokenString);
            if ($tokenModel) {
                $user = $tokenModel->tokenable;
            }
        }
        if (!$user) {
            $user = $request->user();
        }

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $doc = LoanDocument::with('loan')->findOrFail($id);

        if (!$user->isAdmin() && !$user->isOfficer() && $doc->loan->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $filePath = storage_path('app/public/' . $doc->file_path);
        if (!file_exists($filePath)) {
            if (Storage::disk('public')->exists($doc->file_path)) {
                $filePath = Storage::disk('public')->path($doc->file_path);
            } else {
                return response()->json(['message' => 'Document file not found on disk.'], 404);
            }
        }

        $mimeType = $doc->mime_type ?: (str_ends_with(strtolower($doc->original_name), '.pdf') ? 'application/pdf' : 'application/octet-stream');

        return response()->file($filePath, [
            'Content-Type'        => $mimeType,
            'Content-Disposition' => 'inline; filename="' . $doc->original_name . '"',
            'Cache-Control'       => 'no-store, no-cache, must-revalidate',
        ]);
    }
}
