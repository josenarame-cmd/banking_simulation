<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\Loan;
use App\Services\LoanService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LoanController extends Controller
{
    /**
     * Submit a loan application.
     */
    public function apply(Request $request): JsonResponse
    {
        $request->validate([
            'account_id' => 'required|exists:bank_accounts,id',
            'principal_amount' => 'required|numeric|min:100',
            'term_months' => 'required|integer|min:1|max:60',
            'purpose' => 'required|string|max:500',
            'document' => 'nullable|file|mimes:pdf,jpg,png,jpeg|max:5120', // 5MB max
        ]);

        $account = BankAccount::findOrFail($request->account_id);
        $user = $request->user();

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

            return response()->json([
                'status' => 'success',
                'message' => 'Loan application submitted successfully. It is now awaiting administrative review.',
                'loan' => $loan->load('account'),
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
        $loans = Loan::with(['account', 'schedules', 'repayments'])
            ->where('user_id', $request->user()->id)
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $loans,
        ]);
    }

    /**
     * List all loans (admin & instructor).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Loan::with(['user', 'account', 'approver', 'schedules']);

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        $loans = $query->orderBy('id', 'desc')->paginate($request->get('per_page', 15));

        return response()->json($loans);
    }

    /**
     * Show single loan details with complete installment schedule.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $loan = Loan::with(['user', 'account', 'approver', 'schedules', 'repayments.transaction'])
            ->findOrFail($id);

        $user = $request->user();
        if (!$user->isAdmin() && !$user->isInstructor() && $loan->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        return response()->json([
            'status' => 'success',
            'loan' => $loan,
        ]);
    }

    /**
     * Approve and disburse loan (Admin / Instructor).
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'approved_principal' => 'nullable|numeric|min:100',
            'approved_rate' => 'nullable|numeric|min:0',
            'approved_term' => 'nullable|integer|min:1|max:60',
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
                'status' => 'success',
                'message' => "Loan #{$loan->id} approved and \${$approvedLoan->principal_amount} disbursed successfully.",
                'loan' => $approvedLoan,
            ]);
        } catch (Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * Reject loan application.
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        $request->validate(['reason' => 'required|string|max:500']);
        $loan = Loan::findOrFail($id);

        try {
            $rejectedLoan = LoanService::reject($loan, $request->user(), $request->reason);
            return response()->json([
                'status' => 'success',
                'message' => "Loan #{$loan->id} has been rejected.",
                'loan' => $rejectedLoan,
            ]);
        } catch (Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }
    }
}

