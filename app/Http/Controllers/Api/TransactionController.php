<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\Transaction;
use App\Services\TransactionService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    /**
     * All transactions (Admin & Instructor view).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Transaction::with(['fromAccount.user', 'toAccount.user', 'initiator']);

        if ($request->has('type') && $request->type) {
            $query->where('transaction_type', $request->type);
        }
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }
        if ($request->has('from_date') && $request->from_date) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }
        if ($request->has('to_date') && $request->to_date) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }
        if ($request->has('search') && $request->search) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('reference', 'like', "%{$s}%")
                    ->orWhere('description', 'like', "%{$s}%");
            });
        }

        $transactions = $query->orderBy('id', 'desc')->paginate($request->get('per_page', 15));

        return response()->json($transactions);
    }

    /**
     * User's personal transactions.
     */
    public function myTransactions(Request $request): JsonResponse
    {
        $user = $request->user();
        $accountIds = $user->accounts()->pluck('id')->toArray();

        $query = Transaction::with(['fromAccount', 'toAccount'])
            ->where(function ($q) use ($accountIds, $user) {
                $q->whereIn('from_account_id', $accountIds)
                    ->orWhereIn('to_account_id', $accountIds)
                    ->orWhere('initiated_by', $user->id);
            });

        if ($request->has('type') && $request->type) {
            $query->where('transaction_type', $request->type);
        }
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }
        if ($request->has('account_id') && $request->account_id) {
            $accId = (int) $request->account_id;
            $query->where(function ($q) use ($accId) {
                $q->where('from_account_id', $accId)->orWhere('to_account_id', $accId);
            });
        }
        if ($request->has('from_date') && $request->from_date) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }
        if ($request->has('to_date') && $request->to_date) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        $transactions = $query->orderBy('id', 'desc')->paginate($request->get('per_page', 15));

        return response()->json($transactions);
    }

    /**
     * Single transaction with full double-entry ledger entries.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $tx = Transaction::with([
            'fromAccount.user',
            'toAccount.user',
            'initiator',
            'ledgerEntries.account',
            'approvals.approver'
        ])->findOrFail($id);

        $user = $request->user();
        $userAccountIds = $user->accounts()->pluck('id')->toArray();

        // Check permission: admin, instructor, or party to transaction
        $isParty = in_array($tx->from_account_id, $userAccountIds) ||
                   in_array($tx->to_account_id, $userAccountIds) ||
                   $tx->initiated_by === $user->id;

        if (!$user->isAdmin() && !$user->isInstructor() && !$isParty) {
            return response()->json(['message' => 'Unauthorized to view this transaction.'], 403);
        }

        return response()->json([
            'status' => 'success',
            'transaction' => $tx,
        ]);
    }

    /**
     * Simulated deposit endpoint.
     */
    public function deposit(Request $request): JsonResponse
    {
        $request->validate([
            'account_id' => 'required|exists:bank_accounts,id',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string|max:255',
        ]);

        $account = BankAccount::findOrFail($request->account_id);
        $user = $request->user();

        // Normal users can only deposit to their own account
        if (!$user->isAdmin() && !$user->isInstructor() && $account->user_id !== $user->id) {
            return response()->json(['message' => 'You can only deposit into your own accounts.'], 403);
        }

        try {
            $tx = TransactionService::processDeposit(
                $account,
                (float) $request->amount,
                $request->description ?: 'Simulated Cash Deposit',
                $user->id
            );

            return response()->json([
                'status' => 'success',
                'message' => "Deposit of \${$request->amount} successfully processed.",
                'transaction' => $tx->load(['toAccount', 'ledgerEntries']),
            ], 201);
        } catch (Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * Simulated withdrawal endpoint.
     */
    public function withdraw(Request $request): JsonResponse
    {
        $request->validate([
            'account_id' => 'required|exists:bank_accounts,id',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string|max:255',
        ]);

        $account = BankAccount::findOrFail($request->account_id);
        $user = $request->user();

        if (!$user->isAdmin() && !$user->isInstructor() && $account->user_id !== $user->id) {
            return response()->json(['message' => 'You can only withdraw from your own accounts.'], 403);
        }

        try {
            $tx = TransactionService::processWithdrawal(
                $account,
                (float) $request->amount,
                $request->description ?: 'Simulated Cash Withdrawal',
                $user->id
            );

            return response()->json([
                'status' => 'success',
                'message' => "Withdrawal of \${$request->amount} completed successfully.",
                'transaction' => $tx->load(['fromAccount', 'ledgerEntries']),
            ]);
        } catch (Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * Reverse a transaction (Admin only).
     */
    public function reverse(Request $request, int $id): JsonResponse
    {
        $request->validate(['reason' => 'required|string|max:255']);
        $tx = Transaction::findOrFail($id);

        try {
            $revTx = TransactionService::reverseTransaction($tx, $request->reason, $request->user()->id);
            return response()->json([
                'status' => 'success',
                'message' => "Transaction {$tx->reference} reversed successfully.",
                'reversal_transaction' => $revTx,
            ]);
        } catch (Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }
    }
}

