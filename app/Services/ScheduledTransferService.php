<?php

namespace App\Services;

use App\Models\BankAccount;
use App\Models\ScheduledTransfer;
use App\Models\ScheduledTransferLog;
use Carbon\Carbon;
use Exception;

class ScheduledTransferService
{
    /**
     * Calculate next run date based on frequency.
     */
    public static function calculateNextRun(string $frequency, ?Carbon $from = null): Carbon
    {
        $base = $from ? $from->copy() : Carbon::now();

        return match ($frequency) {
            'daily' => $base->addDay(),
            'weekly' => $base->addWeek(),
            'monthly' => $base->addMonth(),
            default => $base->addDay(),
        };
    }

    /**
     * Create a scheduled transfer.
     */
    public static function createSchedule(
        int $userId,
        int $fromAccountId,
        int $toAccountId,
        float $amount,
        string $frequency,
        string $startDate,
        ?string $endDate = null,
        ?string $scheduleExpression = null
    ): ScheduledTransfer {
        $fromAccount = BankAccount::findOrFail($fromAccountId);
        $toAccount = BankAccount::findOrFail($toAccountId);

        if ($fromAccount->user_id !== $userId) {
            throw new Exception("You can only schedule transfers from accounts you own.");
        }

        if ($fromAccount->id === $toAccount->id) {
            throw new Exception("Source and destination accounts must be different.");
        }

        $start = Carbon::parse($startDate);
        $nextRun = $start->isPast() ? Carbon::now() : $start;

        return ScheduledTransfer::create([
            'user_id' => $userId,
            'from_account_id' => $fromAccount->id,
            'to_account_id' => $toAccount->id,
            'amount' => $amount,
            'frequency' => $frequency,
            'schedule_expression' => $scheduleExpression ?: "Recurring {$frequency} transfer",
            'start_date' => $start->format('Y-m-d'),
            'next_run_at' => $nextRun,
            'end_date' => $endDate ? Carbon::parse($endDate)->format('Y-m-d') : null,
            'status' => 'active',
        ]);
    }

    /**
     * Execute all currently due scheduled transfers.
     */
    public static function processDueSchedules(): array
    {
        $due = ScheduledTransfer::where('status', 'active')
            ->where('next_run_at', '<=', Carbon::now())
            ->get();

        $executed = 0;
        $failed = 0;

        foreach ($due as $schedule) {
            // Check if end_date has passed
            if ($schedule->end_date && Carbon::now()->gt(Carbon::parse($schedule->end_date))) {
                $schedule->update(['status' => 'completed']);
                continue;
            }

            try {
                $from = $schedule->fromAccount;
                $to = $schedule->toAccount;
                $user = $schedule->user;

                $tx = TransferService::transfer(
                    $from,
                    $to,
                    (float) $schedule->amount,
                    "Automated scheduled transfer ({$schedule->frequency})",
                    $user
                );

                // Update next run
                $schedule->next_run_at = self::calculateNextRun($schedule->frequency, Carbon::parse($schedule->next_run_at));
                $schedule->save();

                ScheduledTransferLog::create([
                    'scheduled_transfer_id' => $schedule->id,
                    'transaction_id' => $tx->id,
                    'execution_date' => now(),
                    'status' => 'success',
                ]);

                $executed++;
            } catch (Exception $e) {
                ScheduledTransferLog::create([
                    'scheduled_transfer_id' => $schedule->id,
                    'transaction_id' => null,
                    'execution_date' => now(),
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                ]);

                NotificationService::send(
                    $schedule->user_id,
                    'Scheduled Transfer Failed',
                    "Your recurring transfer of \${$schedule->amount} could not be executed: {$e->getMessage()}",
                    'danger',
                    ['scheduled_transfer_id' => $schedule->id]
                );

                $failed++;
            }
        }

        return [
            'total_due' => count($due),
            'executed' => $executed,
            'failed' => $failed,
        ];
    }
}

