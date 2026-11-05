<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use App\Models\LoanRepayment;
use App\Services\LoanService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LoanRepaymentController extends Controller
{
    /**
     * Process simulated repayment for an active loan.
     */
    public function repay(Request $request, int $loanId): JsonResponse
    {
        $request->validate(['amount' => 'required|numeric|min:0.01']);

        $loan = Loan::with('account')->findOrFail($loanId);
        $user = $request->user();

        if (!$user->isAdmin() && !$user->isInstructor() && $loan->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized to repay this loan.'], 403);
        }

        try {
            $repayment = LoanService::processRepayment($loan, (float) $request->amount, $user);

            return response()->json([
                'status' => 'success',
                'message' => "Repayment of \${$request->amount} successfully processed.",
                'repayment' => $repayment->load(['loan', 'transaction']),
                'remaining_loan_balance' => $repayment->remaining_balance,
            ]);
        } catch (Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * Repayments history for a specific loan or all repayments.
     */
    public function index(Request $request, ?int $loanId = null): JsonResponse
    {
        $query = LoanRepayment::with(['loan.user', 'transaction']);

        if ($loanId) {
            $query->where('loan_id', $loanId);
        }

        $repayments = $query->orderBy('payment_date', 'desc')->paginate($request->get('per_page', 15));

        return response()->json($repayments);
    }
}

