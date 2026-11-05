<?php

namespace App\Services;

use App\Models\Approval;
use App\Models\BankAccount;
use App\Models\FeeType;
use App\Models\SystemSetting;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\DB;

class TransferService
{
    /**
     * Process transfer between two bank accounts.
     */
    public static function transfer(
        BankAccount $fromAccount,
        BankAccount $toAccount,
        float $amount,
        string $description,
        User $initiator
    ): Transaction {
        if ($amount <= 0) {
            throw new Exception("Transfer amount must be greater than zero.");
        }

        if ($fromAccount->id === $toAccount->id) {
            throw new Exception("Source and destination accounts cannot be the same.");
        }

        if ($fromAccount->status !== 'active') {
            throw new Exception("Source account {$fromAccount->account_number} is {$fromAccount->status}. Transfers are disabled.");
        }

        if ($toAccount->status !== 'active') {
            throw new Exception("Destination account {$toAccount->account_number} is {$toAccount->status}. Cannot receive transfers.");
        }

        // Restrict withdrawal/transfer out from Fixed Deposit if lock period is active
        if ($fromAccount->account_type === 'fixed_deposit') {
            if ($fromAccount->maturity_date && Carbon::now()->lt($fromAccount->maturity_date)) {
                throw new Exception("Fixed Deposit account has not reached maturity date yet. Funds cannot be transferred.");
            }
        }

        // Check user ownership for source account unless admin/instructor
        if (!$initiator->isAdmin() && !$initiator->isInstructor() && $fromAccount->user_id !== $initiator->id) {
            throw new Exception("Unauthorized: You do not own the source account.");
        }

        $isInternal = ($fromAccount->user_id === $toAccount->user_id);
        $txType = $isInternal ? 'internal_transfer' : 'peer_transfer';

        // Check daily transfer limit for source account
        $dailyLimit = (float) SystemSetting::get('daily_transfer_limit', 50000.00);
        $transferredToday = (float) Transaction::where('from_account_id', $fromAccount->id)
            ->whereDate('created_at', Carbon::today())
            ->whereIn('status', ['completed', 'requires_approval'])
            ->sum('amount');

        if (($transferredToday + $amount) > $dailyLimit) {
            throw new Exception("Daily transfer limit of \${$dailyLimit} exceeded. Today's cumulative transfers: \${$transferredToday}.");
        }

        // Check approval threshold
        $approvalThreshold = (float) SystemSetting::get('approval_threshold', 10000.00);
        $requiresApproval = ($amount > $approvalThreshold);

        // Check available balance
        $minBalance = (float) ($fromAccount->accountType->minimum_balance ?? 0.00);
        if (($fromAccount->balance - $amount) < $minBalance) {
            throw new Exception("Insufficient funds in account {$fromAccount->account_number}. Available: \${$fromAccount->balance}. Minimum required: \${$minBalance}.");
        }

        // Optional fee deduction for peer transfer
        $feeAmount = 0.00;
        if (!$isInternal) {
            $peerFeeSetting = FeeType::where('code', 'peer_transfer_fee')->where('status', 'active')->first();
            if ($peerFeeSetting) {
                $feeAmount = (float) $peerFeeSetting->amount;
            }
        }

        $totalDeduction = $amount + $feeAmount;
        if (($fromAccount->balance - $totalDeduction) < $minBalance) {
            throw new Exception("Insufficient funds to cover transfer amount (\${$amount}) plus service fee (\${$feeAmount}).");
        }

        return DB::transaction(function () use (
            $fromAccount,
            $toAccount,
            $amount,
            $feeAmount,
            $description,
            $initiator,
            $isInternal,
            $txType,
            $requiresApproval,
            $approvalThreshold
        ) {
            $ref = TransactionService::generateReference($requiresApproval ? 'TXN-HIGH' : 'TRF');

            $tx = Transaction::create([
                'reference' => $ref,
                'from_account_id' => $fromAccount->id,
                'to_account_id' => $toAccount->id,
                'transaction_type' => $txType,
                'amount' => $amount,
                'fee_amount' => $feeAmount,
                'description' => $description,
                'status' => $requiresApproval ? 'requires_approval' : 'completed',
                'requires_approval' => $requiresApproval,
                'initiated_by' => $initiator->id,
            ]);

            // If high value, queue for approval without debiting accounts yet
            if ($requiresApproval) {
                Approval::create([
                    'transaction_id' => $tx->id,
                    'approval_level' => 1,
                    'status' => 'pending',
                    'notes' => "High-value transfer of \${$amount} exceeds threshold of \${$approvalThreshold}. Pending review.",
                ]);

                AuditLogService::log(
                    'TRANSFER_QUEUED_APPROVAL',
                    "High-value transfer of \${$amount} queued for administrative review. Ref: {$ref}",
                    'Transaction',
                    $tx->id,
                    ['from' => $fromAccount->account_number, 'to' => $toAccount->account_number, 'amount' => $amount],
                    $initiator->id
                );

                NotificationService::send(
                    $initiator->id,
                    'Transfer Under Review',
                    "Your transfer of \${$amount} to {$toAccount->account_number} exceeds \${$approvalThreshold} and is pending instructor/admin approval.",
                    'warning',
                    ['transaction_id' => $tx->id, 'reference' => $ref]
                );

                return $tx;
            }

            // Otherwise, execute transfer immediately!
            $lockedFrom = BankAccount::where('id', $fromAccount->id)->lockForUpdate()->first();
            $lockedTo = BankAccount::where('id', $toAccount->id)->lockForUpdate()->first();

            $lockedFrom->balance -= ($amount + $feeAmount);
            $lockedFrom->save();

            $lockedTo->balance += $amount;
            $lockedTo->save();

            // Balanced Double-Entry Postings:
            // 1. Source Account: DEBIT ($amount)
            // 2. Destination Account: CREDIT ($amount)
            $entries = [
                [
                    'account_id' => $lockedFrom->id,
                    'entry_type' => 'debit',
                    'debit' => $amount,
                    'credit' => 0.00,
                    'balance_after' => $lockedFrom->balance + $feeAmount, // balance before fee
                ],
                [
                    'account_id' => $lockedTo->id,
                    'entry_type' => 'credit',
                    'debit' => 0.00,
                    'credit' => $amount,
                    'balance_after' => $lockedTo->balance,
                ],
            ];

            // If fee applies, post fee entries as well:
            // Source account DEBIT ($fee), Bank Fee Revenue (Account = null) CREDIT ($fee)
            if ($feeAmount > 0) {
                $entries[] = [
                    'account_id' => $lockedFrom->id,
                    'entry_type' => 'debit',
                    'debit' => $feeAmount,
                    'credit' => 0.00,
                    'balance_after' => $lockedFrom->balance,
                ];
                $entries[] = [
                    'account_id' => null, // bank revenue
                    'entry_type' => 'credit',
                    'debit' => 0.00,
                    'credit' => $feeAmount,
                    'balance_after' => $feeAmount,
                ];
            }

            LedgerService::postEntries($tx, $entries);

            AuditLogService::log(
                'TRANSFER_COMPLETED',
                "Transfer of \${$amount} processed from {$lockedFrom->account_number} to {$lockedTo->account_number}. Ref: {$ref}",
                'Transaction',
                $tx->id,
                ['from' => $lockedFrom->account_number, 'to' => $lockedTo->account_number, 'amount' => $amount],
                $initiator->id
            );

            // Notify Sender
            NotificationService::send(
                $initiator->id,
                'Transfer Successful',
                "Transferred \${$amount} from {$lockedFrom->account_number} to {$lockedTo->account_number}. Reference: {$ref}.",
                'success',
                ['transaction_id' => $tx->id, 'reference' => $ref]
            );

            // Notify Recipient if peer transfer
            if (!$isInternal) {
                NotificationService::send(
                    $lockedTo->user_id,
                    'Incoming Transfer Received',
                    "You received \${$amount} from {$initiator->name} ({$lockedFrom->account_number}) into account {$lockedTo->account_number}.",
                    'success',
                    ['transaction_id' => $tx->id, 'reference' => $ref]
                );
            }

            return $tx;
        });
    }
}

