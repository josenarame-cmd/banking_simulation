<?php

namespace App\Services;

use App\Models\BankAccount;
use App\Models\Fee;
use App\Models\FeeType;
use App\Models\Transaction;
use Exception;
use Illuminate\Support\Facades\DB;

class FeeService
{
    /**
     * Apply a specific fee type to an account.
     */
    public static function applyFee(BankAccount $account, FeeType $feeType, ?string $customDescription = null, int $actorId = 1): Fee
    {
        if ($account->status !== 'active') {
            throw new Exception("Cannot apply fee to {$account->status} account {$account->account_number}.");
        }

        $feeAmount = (float) $feeType->amount;
        $minBalance = (float) ($account->accountType->minimum_balance ?? 0.00);

        if (($account->balance - $feeAmount) < $minBalance) {
            throw new Exception("Account has insufficient balance (\${$account->balance}) to cover the fee of \${$feeAmount}.");
        }

        return DB::transaction(function () use ($account, $feeType, $feeAmount, $customDescription, $actorId) {
            $lockedAccount = BankAccount::where('id', $account->id)->lockForUpdate()->first();

            $ref = TransactionService::generateReference('FEE');
            $desc = $customDescription ?: "Banking fee: {$feeType->name}";

            $tx = Transaction::create([
                'reference' => $ref,
                'from_account_id' => $lockedAccount->id,
                'to_account_id' => null, // Bank Revenue
                'transaction_type' => 'fee',
                'amount' => $feeAmount,
                'fee_amount' => 0.00,
                'description' => $desc,
                'status' => 'completed',
                'initiated_by' => $actorId,
            ]);

            $lockedAccount->balance -= $feeAmount;
            $lockedAccount->save();

            // Balanced Double-Entry:
            // 1. Customer Account: DEBIT
            // 2. Bank Fee Revenue: CREDIT
            LedgerService::postEntries($tx, [
                [
                    'account_id' => $lockedAccount->id,
                    'entry_type' => 'debit',
                    'debit' => $feeAmount,
                    'credit' => 0.00,
                    'balance_after' => $lockedAccount->balance,
                ],
                [
                    'account_id' => null,
                    'entry_type' => 'credit',
                    'debit' => 0.00,
                    'credit' => $feeAmount,
                    'balance_after' => $feeAmount,
                ]
            ]);

            $fee = Fee::create([
                'account_id' => $lockedAccount->id,
                'transaction_id' => $tx->id,
                'fee_type' => $feeType->name,
                'amount' => $feeAmount,
                'description' => $desc,
                'applied_at' => now(),
            ]);

            AuditLogService::log(
                'FEE_APPLIED',
                "Fee of \${$feeAmount} ({$feeType->name}) applied to {$lockedAccount->account_number}.",
                'Fee',
                $fee->id,
                ['fee_amount' => $feeAmount, 'account' => $lockedAccount->account_number],
                $actorId
            );

            NotificationService::send(
                $lockedAccount->user_id,
                'Fee Deducted',
                "A fee of \${$feeAmount} for {$feeType->name} was deducted from your account {$lockedAccount->account_number}.",
                'info',
                ['transaction_id' => $tx->id, 'fee_id' => $fee->id]
            );

            return $fee;
        });
    }

    /**
     * Run monthly maintenance fee cycle across all eligible checking accounts.
     */
    public static function processMonthlyMaintenance(int $actorId): array
    {
        $feeType = FeeType::where('code', 'monthly_maintenance')->where('status', 'active')->first();
        if (!$feeType) {
            throw new Exception("Monthly maintenance fee configuration not found or inactive.");
        }

        $accounts = BankAccount::where('status', 'active')
            ->where('account_type', 'checking')
            ->get();

        $processed = 0;
        $failed = 0;
        $totalCollected = 0.00;

        foreach ($accounts as $account) {
            try {
                self::applyFee($account, $feeType, "Monthly checking maintenance fee - " . date('F Y'), $actorId);
                $processed++;
                $totalCollected += (float) $feeType->amount;
            } catch (Exception $e) {
                $failed++;
            }
        }

        return [
            'total_checking_accounts' => count($accounts),
            'processed' => $processed,
            'failed' => $failed,
            'total_collected' => round($totalCollected, 2),
        ];
    }
}

