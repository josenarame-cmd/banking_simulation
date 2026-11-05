<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\AccountType;
use App\Services\AccountService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BankAccountController extends Controller
{
    /**
     * List all bank accounts (admin/instructor view).
     */
    public function index(Request $request): JsonResponse
    {
        $query = BankAccount::with(['user', 'accountType']);

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }
        if ($request->has('account_type') && $request->account_type) {
            $query->where('account_type', $request->account_type);
        }
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('account_number', 'like', "%{$search}%")
                    ->orWhere('account_name', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        $accounts = $query->orderBy('id', 'desc')->paginate($request->get('per_page', 15));

        return response()->json($accounts);
    }

    /**
     * Get accounts belonging to the authenticated user.
     */
    public function myAccounts(Request $request): JsonResponse
    {
        $user = $request->user();
        $accounts = BankAccount::with('accountType')
            ->where('user_id', $user->id)
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'status' => 'success',
            'accounts' => $accounts,
            'total_balance' => $accounts->sum('balance'),
        ]);
    }

    /**
     * Show account details with statement / recent ledger entries.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $account = BankAccount::with(['accountType', 'user'])->findOrFail($id);

        if (!$user->isAdmin() && !$user->isInstructor() && $account->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized to view this account.'], 403);
        }

        $recentLedger = $account->ledgerEntries()
            ->with('transaction')
            ->orderBy('id', 'desc')
            ->take(20)
            ->get();

        return response()->json([
            'status' => 'success',
            'account' => $account,
            'recent_ledger_entries' => $recentLedger,
        ]);
    }

    /**
     * Create a new simulated bank account.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'account_type_id' => 'required|exists:account_types,id',
            'account_name' => 'nullable|string|max:100',
            'initial_deposit' => 'nullable|numeric|min:0',
        ]);

        $user = $request->user();
        $initialDeposit = (float) ($request->initial_deposit ?? 0.00);

        try {
            $account = AccountService::createAccount(
                $user,
                (int) $request->account_type_id,
                $request->account_name,
                $initialDeposit
            );

            return response()->json([
                'status' => 'success',
                'message' => "Bank account {$account->account_number} created successfully.",
                'account' => $account->load('accountType'),
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Block an account (Admin / Instructor only).
     */
    public function block(Request $request, int $id): JsonResponse
    {
        $request->validate(['reason' => 'required|string|max:255']);
        $account = BankAccount::findOrFail($id);

        AccountService::blockAccount($account, $request->reason, $request->user()->id);

        return response()->json([
            'status' => 'success',
            'message' => "Account {$account->account_number} has been blocked.",
            'account' => $account->fresh(),
        ]);
    }

    /**
     * Unblock an account (Admin / Instructor only).
     */
    public function unblock(Request $request, int $id): JsonResponse
    {
        $account = BankAccount::findOrFail($id);
        AccountService::unblockAccount($account, $request->user()->id);

        return response()->json([
            'status' => 'success',
            'message' => "Account {$account->account_number} has been unblocked.",
            'account' => $account->fresh(),
        ]);
    }

    /**
     * Close an account.
     */
    public function close(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $account = BankAccount::findOrFail($id);

        if (!$user->isAdmin() && $account->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        try {
            AccountService::closeAccount($account, $user->id);
            return response()->json([
                'status' => 'success',
                'message' => "Account {$account->account_number} closed successfully.",
            ]);
        } catch (Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }
    }
}

