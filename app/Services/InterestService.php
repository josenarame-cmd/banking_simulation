<?php

namespace App\Services;

use App\Models\BankAccount;
use App\Models\InterestCalculation;
use App\Models\InterestRate;
use App\Models\Transaction;
use Exception;
use Illuminate\Support\Facades\DB;

class InterestService
{
    /**
     * Preview interest calculation across all active savings and fixed deposit accounts for a given period.
     */
    public static function preview(string $period): array
    {
        $accounts = BankAccount::with('accountType')
            ->where('status', 'active')
            ->whereIn('account_type', ['savings', 'fixed_deposit'])
            ->get();

        $previewItems = [];
        $totalInterest = 0.00;

        foreach ($accounts as $account) {
            $existing = InterestCalculation::where('account_id', $account->id)
                ->where('calculation_period', $period)
                ->first();

            $rate = (float) ($account->accountType->interest_rate ?? 0.00);
            $balance = (float) $account->balance;

            // Monthly interest: Balance * (annual_rate / 100) / 12
            $monthlyInterest = round($balance * ($rate / 100.0) / 12.0, 2);

            $previewItems[] = [
                'account_id' => $account->id,
                'account_number' => $account->account_number,
                'account_name' => $account->account_name,
                'account_type' => $account->account_type,
                'balance' => $balance,
                'interest_rate' => $rate,
                'calculated_interest' => $monthlyInterest,
                'already_processed' => (bool) $existing,
                'existing_status' => $existing ? $existing->status : null,
            ];

            if (!$existing && $monthlyInterest > 0) {
                $totalInterest += $monthlyInterest;
            }
        }

        return [
            'period' => $period,
            'total_accounts' => count($accounts),
            'total_interest_to_credit' => round($totalInterest, 2),
            'items' => $previewItems,
        ];
    }

    /**
     * Process and credit monthly interest batch.
     */
    public static function processPeriod(string $period, int $actorId): array
    {
        $preview = self::preview($period);
        $creditedCount = 0;
        $totalCredited = 0.00;

        foreach ($preview['items'] as $item) {
            if ($item['already_processed'] || $item['calculated_interest'] <= 0) {
                continue;
            }

            DB::transaction(function () use ($item, $period, $actorId, &$creditedCount, &$totalCredited) {
                $account = BankAccount::where('id', $item['account_id'])->lockForUpdate()->first();
                $interestAmount = $item['calculated_interest'];

                $ref = TransactionService::generateReference('INT');

                $tx = Transaction::create([
                    'reference' => $ref,
                    'from_account_id' => null, // Bank Interest Expense
                    'to_account_id' => $account->id,
                    'transaction_type' => 'interest',
                    'amount' => $interestAmount,
                    'fee_amount' => 0.00,
                    'description' => "Periodic interest credit for period {$period} at {$item['interest_rate']}% p.a.",
                    'status' => 'completed',
                    'initiated_by' => $actorId,
                ]);

                $account->balance += $interestAmount;
                $account->save();

                // Double-Entry Ledger:
                // 1. Bank Interest Expense: DEBIT
                // 2. Customer Bank Account: CREDIT
                LedgerService::postEntries($tx, [
                    [
                        'account_id' => null,
                        'entry_type' => 'debit',
                        'debit' => $interestAmount,
                        'credit' => 0.00,
                        'balance_after' => $interestAmount,
                    ],
                    [
                        'account_id' => $account->id,
                        'entry_type' => 'credit',
                        'debit' => 0.00,
                        'credit' => $interestAmount,
                        'balance_after' => $account->balance,
                    ]
                ]);

                InterestCalculation::create([
                    'account_id' => $account->id,
                    'transaction_id' => $tx->id,
                    'calculation_period' => $period,
                    'principal_balance' => $item['balance'],
                    'interest_rate' => $item['interest_rate'],
                    'interest_amount' => $interestAmount,
                    'status' => 'credited',
                    'processed_at' => now(),
                ]);

                NotificationService::send(
                    $account->user_id,
                    'Interest Credited',
                    "Interest of \${$interestAmount} credited to {$account->account_name} ({$account->account_number}) for {$period}.",
                    'success',
                    ['transaction_id' => $tx->id, 'amount' => $interestAmount]
                );

                $creditedCount++;
                $totalCredited += $interestAmount;
            });
        }

        AuditLogService::log(
            'INTEREST_BATCH_PROCESSED',
            "Interest batch processed for period {$period}. Accounts credited: {$creditedCount}, Total: \${$totalCredited}.",
            'InterestCalculation',
            null,
            ['period' => $period, 'credited_count' => $creditedCount, 'total_amount' => $totalCredited],
            $actorId
        );

        return [
            'period' => $period,
            'accounts_processed' => $creditedCount,
            'total_amount_credited' => round($totalCredited, 2),
        ];
    }
}

