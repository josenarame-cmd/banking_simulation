<?php

namespace App\Services;

use App\Models\AccountType;
use App\Models\BankAccount;
use App\Models\User;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Str;

class AccountService
{
    /**
     * Generate a unique account number based on account type prefix.
     */
    public static function generateAccountNumber(string $accountTypeCode): string
    {
        $prefix = match ($accountTypeCode) {
            'checking' => 'CHK',
            'savings' => 'SAV',
            'fixed_deposit' => 'FD',
            default => 'ACC',
        };

        do {
            $number = $prefix . '-' . mt_rand(10000000, 99999999);
        } while (BankAccount::where('account_number', $number)->exists());

        return $number;
    }

    /**
     * Create a new bank account for a user.
     */
    public static function createAccount(User $user, int $accountTypeId, ?string $customName = null, float $initialDeposit = 0.00): BankAccount
    {
        $accountType = AccountType::findOrFail($accountTypeId);

        if ($accountType->status !== 'active') {
            throw new Exception("Account type '{$accountType->name}' is currently inactive.");
        }

        // Validate minimum balance requirement
        if ($initialDeposit < (float) $accountType->minimum_balance) {
            throw new Exception("Initial deposit must be at least {$accountType->minimum_balance} USD for {$accountType->name}.");
        }

        $accountNumber = self::generateAccountNumber($accountType->code);
        $accountName = $customName ?: "{$user->name}'s {$accountType->name}";

        $maturityDate = null;
        if ($accountType->code === 'fixed_deposit' && $accountType->lock_period_days > 0) {
            $maturityDate = Carbon::now()->addDays($accountType->lock_period_days);
        }

        $account = BankAccount::create([
            'user_id' => $user->id,
            'account_type_id' => $accountType->id,
            'account_number' => $accountNumber,
            'account_name' => $accountName,
            'account_type' => $accountType->code,
            'currency' => 'USD',
            'balance' => 0.00, // starts at 0, deposit transaction handles balance if > 0
            'status' => 'active',
            'opened_at' => now(),
            'maturity_date' => $maturityDate,
        ]);

        AuditLogService::log(
            'ACCOUNT_CREATED',
            "Account {$account->account_number} ({$accountType->name}) opened for user {$user->name}.",
            'BankAccount',
            $account->id,
            $account->toArray(),
            $user->id
        );

        NotificationService::send(
            $user->id,
            'Bank Account Created',
            "Your new {$accountType->name} ({$account->account_number}) is now active.",
            'success',
            ['account_id' => $account->id, 'account_number' => $account->account_number]
        );

        // If there's an initial deposit, process it through the transaction engine!
        if ($initialDeposit > 0) {
            TransactionService::processDeposit($account, $initialDeposit, "Initial account opening deposit", $user->id);
        }

        return $account->fresh();
    }

    /**
     * Block an account (admin/instructor action).
     */
    public static function blockAccount(BankAccount $account, string $reason, int $actorId): BankAccount
    {
        $account->update(['status' => 'blocked']);

        AuditLogService::log(
            'ACCOUNT_BLOCKED',
            "Account {$account->account_number} blocked. Reason: {$reason}",
            'BankAccount',
            $account->id,
            ['status' => 'blocked', 'reason' => $reason],
            $actorId
        );

        NotificationService::send(
            $account->user_id,
            'Account Suspended / Blocked',
            "Your account {$account->account_number} has been blocked by banking administration. Reason: {$reason}",
            'danger',
            ['account_id' => $account->id]
        );

        return $account;
    }

    /**
     * Unblock an account (admin/instructor action).
     */
    public static function unblockAccount(BankAccount $account, int $actorId): BankAccount
    {
        $account->update(['status' => 'active']);

        AuditLogService::log(
            'ACCOUNT_UNBLOCKED',
            "Account {$account->account_number} restored to active status.",
            'BankAccount',
            $account->id,
            ['status' => 'active'],
            $actorId
        );

        NotificationService::send(
            $account->user_id,
            'Account Unblocked',
            "Your account {$account->account_number} has been unblocked and is active.",
            'success',
            ['account_id' => $account->id]
        );

        return $account;
    }

    /**
     * Close an account.
     */
    public static function closeAccount(BankAccount $account, int $actorId): BankAccount
    {
        if ($account->balance > 0) {
            throw new Exception("Cannot close account {$account->account_number} with a remaining balance of \${$account->balance}. Please withdraw or transfer funds first.");
        }

        $account->update([
            'status' => 'closed',
            'closed_at' => now(),
        ]);

        AuditLogService::log(
            'ACCOUNT_CLOSED',
            "Account {$account->account_number} officially closed.",
            'BankAccount',
            $account->id,
            ['status' => 'closed'],
            $actorId
        );

        return $account;
    }
}

