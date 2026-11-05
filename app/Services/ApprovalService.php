<?php

namespace App\Services;

use App\Models\Approval;
use App\Models\BankAccount;
use App\Models\Transaction;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\DB;

class ApprovalService
{
    /**
     * Approve a high-value transaction.
     */
    public static function approve(Approval $approval, User $approver, ?string $notes = null): Transaction
    {
        $tx = $approval->transaction;

        if ($tx->status !== 'requires_approval') {
            throw new Exception("Transaction {$tx->reference} is not currently awaiting approval (status: {$tx->status}).");
        }

        // Separation of duties rule: Initiator cannot approve own transaction
        if ($tx->initiated_by === $approver->id) {
            throw new Exception("Separation of duties violation: You cannot approve a transaction that you initiated.");
        }

        // Only admin or instructor can approve
        if (!$approver->isAdmin() && !$approver->isInstructor()) {
            throw new Exception("Unauthorized: Only administrators or instructors can review high-value transactions.");
        }

        return DB::transaction(function () use ($approval, $tx, $approver, $notes) {
            $fromAccount = BankAccount::where('id', $tx->from_account_id)->lockForUpdate()->first();
            $toAccount = BankAccount::where('id', $tx->to_account_id)->lockForUpdate()->first();

            $totalDeduction = $tx->amount + $tx->fee_amount;
            $minBalance = (float) ($fromAccount->accountType->minimum_balance ?? 0.00);

            if (($fromAccount->balance - $totalDeduction) < $minBalance) {
                // Reject due to insufficient funds at approval time
                $approval->update([
                    'approver_id' => $approver->id,
                    'status' => 'rejected',
                    'notes' => 'Auto-rejected at approval: Source account has insufficient funds to clear transaction.',
                    'decided_at' => now(),
                ]);
                $tx->update(['status' => 'failed']);

                NotificationService::send(
                    $tx->initiated_by,
                    'Transfer Failed (Insufficient Funds)',
                    "Your high-value transfer of \${$tx->amount} could not be approved due to insufficient funds in {$fromAccount->account_number}.",
                    'danger',
                    ['transaction_id' => $tx->id]
                );

                throw new Exception("Source account now has insufficient funds to settle this transfer.");
            }

            // Execute the approved transfer!
            $fromAccount->balance -= $totalDeduction;
            $fromAccount->save();

            $toAccount->balance += $tx->amount;
            $toAccount->save();

            // Post double-entry records
            $entries = [
                [
                    'account_id' => $fromAccount->id,
                    'entry_type' => 'debit',
                    'debit' => $tx->amount,
                    'credit' => 0.00,
                    'balance_after' => $fromAccount->balance + $tx->fee_amount,
                ],
                [
                    'account_id' => $toAccount->id,
                    'entry_type' => 'credit',
                    'debit' => 0.00,
                    'credit' => $tx->amount,
                    'balance_after' => $toAccount->balance,
                ],
            ];

            if ($tx->fee_amount > 0) {
                $entries[] = [
                    'account_id' => $fromAccount->id,
                    'entry_type' => 'debit',
                    'debit' => $tx->fee_amount,
                    'credit' => 0.00,
                    'balance_after' => $fromAccount->balance,
                ];
                $entries[] = [
                    'account_id' => null,
                    'entry_type' => 'credit',
                    'debit' => 0.00,
                    'credit' => $tx->fee_amount,
                    'balance_after' => $tx->fee_amount,
                ];
            }

            LedgerService::postEntries($tx, $entries);

            // Update approval and transaction status
            $approval->update([
                'approver_id' => $approver->id,
                'status' => 'approved',
                'notes' => $notes ?: 'Approved by authorized officer.',
                'decided_at' => now(),
            ]);

            $tx->update(['status' => 'completed']);

            AuditLogService::log(
                'TRANSACTION_APPROVED',
                "Transaction {$tx->reference} of \${$tx->amount} approved by {$approver->name}.",
                'Transaction',
                $tx->id,
                ['approved_by' => $approver->name, 'notes' => $notes],
                $approver->id
            );

            NotificationService::send(
                $tx->initiated_by,
                'High-Value Transfer Approved',
                "Your transfer of \${$tx->amount} (Ref: {$tx->reference}) has been approved and successfully executed.",
                'success',
                ['transaction_id' => $tx->id, 'reference' => $tx->reference]
            );

            NotificationService::send(
                $toAccount->user_id,
                'Incoming Funds Received',
                "You received \${$tx->amount} into {$toAccount->account_number} (Ref: {$tx->reference}).",
                'success',
                ['transaction_id' => $tx->id, 'reference' => $tx->reference]
            );

            return $tx;
        });
    }

    /**
     * Reject a high-value transaction.
     */
    public static function reject(Approval $approval, User $approver, string $reason): Transaction
    {
        $tx = $approval->transaction;

        if ($tx->status !== 'requires_approval') {
            throw new Exception("Transaction {$tx->reference} is not awaiting approval.");
        }

        if ($tx->initiated_by === $approver->id) {
            throw new Exception("Separation of duties: You cannot review a transaction that you initiated.");
        }

        $approval->update([
            'approver_id' => $approver->id,
            'status' => 'rejected',
            'notes' => $reason,
            'decided_at' => now(),
        ]);

        $tx->update(['status' => 'rejected']);

        AuditLogService::log(
            'TRANSACTION_REJECTED',
            "Transaction {$tx->reference} rejected by {$approver->name}. Reason: {$reason}",
            'Transaction',
            $tx->id,
            ['reason' => $reason],
            $approver->id
        );

        NotificationService::send(
            $tx->initiated_by,
            'Transfer Request Rejected',
            "Your transfer request of \${$tx->amount} (Ref: {$tx->reference}) was rejected. Reason: {$reason}",
            'danger',
            ['transaction_id' => $tx->id]
        );

        return $tx;
    }
}

