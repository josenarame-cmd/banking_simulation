<?php

namespace App\Services;

use App\Models\BankAccount;
use App\Models\LedgerEntry;
use App\Models\Transaction;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TransactionService
{
    /**
     * Generate unique transaction reference code.
     */
    public static function generateReference(string $typePrefix = 'TXN'): string
    {
        return $typePrefix . '-' . date('Ymd') . '-' . strtoupper(Str::random(8));
    }

    /**
     * Process simulated cash deposit.
     */
    public static function processDeposit(
        BankAccount $account,
        float $amount,
        string $description = 'Simulated Cash Deposit',
        ?int $initiatedBy = null
    ): Transaction {
        if ($amount <= 0) {
            throw new Exception("Deposit amount must be greater than zero.");
        }

        if ($account->status !== 'active') {
            throw new Exception("Cannot deposit to account {$account->account_number}: account is {$account->status}.");
        }

        $userId = $initiatedBy ?? $account->user_id;

        return DB::transaction(function () use ($account, $amount, $description, $userId) {
            // Lock account row for update to prevent race conditions
            $lockedAccount = BankAccount::where('id', $account->id)->lockForUpdate()->first();

            $ref = self::generateReference('DEP');
            $tx = Transaction::create([
                'reference' => $ref,
                'from_account_id' => null, // external/cash source
                'to_account_id' => $lockedAccount->id,
                'transaction_type' => 'deposit',
                'amount' => $amount,
                'fee_amount' => 0.00,
                'description' => $description,
                'status' => 'completed',
                'initiated_by' => $userId,
            ]);

            // Update account balance
            $lockedAccount->balance += $amount;
            $lockedAccount->save();

            // Balanced Double-Entry Ledger:
            // 1. External Vault / Cash Clearing (Account = null): DEBIT
            // 2. Customer Bank Account: CREDIT
            LedgerService::postEntries($tx, [
                [
                    'account_id' => null,
                    'entry_type' => 'debit',
                    'debit' => $amount,
                    'credit' => 0.00,
                    'balance_after' => $amount,
                ],
                [
                    'account_id' => $lockedAccount->id,
                    'entry_type' => 'credit',
                    'debit' => 0.00,
                    'credit' => $amount,
                    'balance_after' => $lockedAccount->balance,
                ]
            ]);

            AuditLogService::log(
                'DEPOSIT_COMPLETED',
                "Deposit of \${$amount} credited to account {$lockedAccount->account_number}. Reference: {$ref}",
                'Transaction',
                $tx->id,
                ['amount' => $amount, 'new_balance' => $lockedAccount->balance],
                $userId
            );

            NotificationService::send(
                $lockedAccount->user_id,
                'Deposit Confirmed',
                "Successfully deposited \${$amount} into {$lockedAccount->account_name} ({$lockedAccount->account_number}). Balance: \${$lockedAccount->balance}.",
                'success',
                ['transaction_id' => $tx->id, 'reference' => $ref]
            );

            return $tx;
        });
    }

    /**
     * Process simulated cash withdrawal.
     */
    public static function processWithdrawal(
        BankAccount $account,
        float $amount,
        string $description = 'Simulated Cash Withdrawal',
        ?int $initiatedBy = null
    ): Transaction {
        if ($amount <= 0) {
            throw new Exception("Withdrawal amount must be greater than zero.");
        }

        if ($account->status !== 'active') {
            throw new Exception("Cannot withdraw from account {$account->account_number}: account is {$account->status}.");
        }

        $accountType = $account->accountType;

        // Business Rule: Fixed Deposit lock period check
        if ($account->account_type === 'fixed_deposit') {
            if ($account->maturity_date && Carbon::now()->lt($account->maturity_date)) {
                $daysRemaining = Carbon::now()->diffInDays($account->maturity_date);
                throw new Exception("Fixed Deposit account has not reached maturity date yet ({$daysRemaining} days remaining). Early withdrawal is prohibited by policy.");
            }
        }

        // Business Rule: Withdrawal limit check
        if ($accountType && $accountType->withdrawal_limit && $amount > (float) $accountType->withdrawal_limit) {
            throw new Exception("Withdrawal amount (\${$amount}) exceeds the single transaction limit of \${$accountType->withdrawal_limit} for {$accountType->name}.");
        }

        $userId = $initiatedBy ?? $account->user_id;

        return DB::transaction(function () use ($account, $amount, $description, $userId, $accountType) {
            $lockedAccount = BankAccount::where('id', $account->id)->lockForUpdate()->first();

            $minBalance = $accountType ? (float) $accountType->minimum_balance : 0.00;
            if (($lockedAccount->balance - $amount) < $minBalance) {
                throw new Exception("Insufficient funds. Available: \${$lockedAccount->balance}. Minimum required balance: \${$minBalance}.");
            }

            $ref = self::generateReference('WTH');
            $tx = Transaction::create([
                'reference' => $ref,
                'from_account_id' => $lockedAccount->id,
                'to_account_id' => null, // external cash vault
                'transaction_type' => 'withdrawal',
                'amount' => $amount,
                'fee_amount' => 0.00,
                'description' => $description,
                'status' => 'completed',
                'initiated_by' => $userId,
            ]);

            $lockedAccount->balance -= $amount;
            $lockedAccount->save();

            // Balanced Double-Entry Ledger:
            // 1. Customer Bank Account: DEBIT (reducing customer liability/balance)
            // 2. External Cash Vault: CREDIT (cash leaving bank)
            LedgerService::postEntries($tx, [
                [
                    'account_id' => $lockedAccount->id,
                    'entry_type' => 'debit',
                    'debit' => $amount,
                    'credit' => 0.00,
                    'balance_after' => $lockedAccount->balance,
                ],
                [
                    'account_id' => null,
                    'entry_type' => 'credit',
                    'debit' => 0.00,
                    'credit' => $amount,
                    'balance_after' => $amount,
                ]
            ]);

            AuditLogService::log(
                'WITHDRAWAL_COMPLETED',
                "Withdrawal of \${$amount} debited from account {$lockedAccount->account_number}. Reference: {$ref}",
                'Transaction',
                $tx->id,
                ['amount' => $amount, 'new_balance' => $lockedAccount->balance],
                $userId
            );

            NotificationService::send(
                $lockedAccount->user_id,
                'Withdrawal Confirmed',
                "Withdrew \${$amount} from {$lockedAccount->account_name} ({$lockedAccount->account_number}). Remaining balance: \${$lockedAccount->balance}.",
                'info',
                ['transaction_id' => $tx->id, 'reference' => $ref]
            );

            return $tx;
        });
    }

    /**
     * Process reversal for a completed transaction.
     */
    public static function reverseTransaction(Transaction $tx, string $reason, int $actorId): Transaction
    {
        if ($tx->status !== 'completed') {
            throw new Exception("Only completed transactions can be reversed.");
        }

        return DB::transaction(function () use ($tx, $reason, $actorId) {
            $ref = self::generateReference('REV');

            $revTx = Transaction::create([
                'reference' => $ref,
                'from_account_id' => $tx->to_account_id,
                'to_account_id' => $tx->from_account_id,
                'transaction_type' => 'reversal',
                'amount' => $tx->amount,
                'fee_amount' => 0.00,
                'description' => "Reversal of {$tx->reference}: {$reason}",
                'status' => 'completed',
                'initiated_by' => $actorId,
            ]);

            // Reverse balances
            if ($tx->from_account_id) {
                $from = BankAccount::where('id', $tx->from_account_id)->lockForUpdate()->first();
                $from->balance += $tx->amount;
                $from->save();
            }
            if ($tx->to_account_id) {
                $to = BankAccount::where('id', $tx->to_account_id)->lockForUpdate()->first();
                $to->balance -= $tx->amount;
                $to->save();
            }

            // Mark original transaction as reversed
            $tx->update(['status' => 'reversed']);

            // Post reciprocal ledger entries
            $originalEntries = LedgerEntry::where('transaction_id', $tx->id)->get();
            $reversalEntries = [];
            foreach ($originalEntries as $oe) {
                $reversalEntries[] = [
                    'account_id' => $oe->account_id,
                    'entry_type' => $oe->entry_type === 'debit' ? 'credit' : 'debit',
                    'debit' => $oe->credit,
                    'credit' => $oe->debit,
                    'balance_after' => $oe->account_id ? BankAccount::find($oe->account_id)->balance : 0.00,
                ];
            }
            LedgerService::postEntries($revTx, $reversalEntries);

            AuditLogService::log(
                'TRANSACTION_REVERSED',
                "Transaction {$tx->reference} reversed. Reason: {$reason}",
                'Transaction',
                $tx->id,
                ['reversal_reference' => $ref],
                $actorId
            );

            return $revTx;
        });
    }
}

