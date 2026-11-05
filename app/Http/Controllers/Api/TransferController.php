<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Services\TransferService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransferController extends Controller
{
    /**
     * Preview / lookup recipient account details before confirming transfer.
     */
    public function lookupRecipient(Request $request): JsonResponse
    {
        $request->validate(['account_number' => 'required|string']);

        $account = BankAccount::with('user', 'accountType')
            ->where('account_number', $request->account_number)
            ->first();

        if (!$account) {
            return response()->json(['message' => 'Account number not found.'], 404);
        }

        if ($account->status !== 'active') {
            return response()->json(['message' => "This account is currently {$account->status} and cannot receive funds."], 422);
        }

        return response()->json([
            'status' => 'success',
            'account' => [
                'id' => $account->id,
                'account_number' => $account->account_number,
                'account_name' => $account->account_name,
                'account_type' => $account->accountType->name,
                'owner_name' => $account->user->name,
                'currency' => $account->currency,
            ],
        ]);
    }

    /**
     * Perform internal or peer transfer.
     */
    public function transfer(Request $request): JsonResponse
    {
        $request->validate([
            'from_account_id' => 'required|exists:bank_accounts,id',
            'to_account_number' => 'required|string|exists:bank_accounts,account_number',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'required|string|max:255',
        ]);

        $fromAccount = BankAccount::findOrFail($request->from_account_id);
        $toAccount = BankAccount::where('account_number', $request->to_account_number)->firstOrFail();
        $user = $request->user();

        try {
            $tx = TransferService::transfer(
                $fromAccount,
                $toAccount,
                (float) $request->amount,
                $request->description,
                $user
            );

            $message = $tx->requires_approval
                ? "Transfer initiated! Exceeds approval threshold and is pending review by banking authorities."
                : "Transfer of \${$request->amount} successfully executed.";

            return response()->json([
                'status' => 'success',
                'message' => $message,
                'requires_approval' => $tx->requires_approval,
                'transaction' => $tx->load(['fromAccount', 'toAccount']),
            ], 201);
        } catch (Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }
    }
}

