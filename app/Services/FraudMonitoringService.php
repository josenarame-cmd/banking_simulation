<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\BankAccount;
use App\Models\LoginAttempt;
use App\Models\ScheduledTransferLog;
use App\Models\Transaction;
use Carbon\Carbon;

class FraudMonitoringService
{
    /**
     * Gather system-wide fraud alerts and suspicious activity indicators.
     */
    public static function getSecurityAlerts(): array
    {
        $alerts = [];

        // 1. Repeated failed logins in last 24 hours
        $failedLogins = LoginAttempt::where('status', 'failed')
            ->where('attempted_at', '>=', Carbon::now()->subHours(24))
            ->selectRaw('email, ip_address, COUNT(*) as fail_count, MAX(attempted_at) as last_attempt')
            ->groupBy('email', 'ip_address')
            ->havingRaw('COUNT(*) >= 3')
            ->get();

        foreach ($failedLogins as $fl) {
            $alerts[] = [
                'type' => 'failed_logins',
                'severity' => $fl->fail_count >= 5 ? 'high' : 'medium',
                'title' => "Multiple Failed Login Attempts ({$fl->fail_count} attempts)",
                'description' => "Account {$fl->email} had {$fl->fail_count} consecutive failed login attempts from IP {$fl->ip_address}.",
                'entity' => $fl->email,
                'timestamp' => $fl->last_attempt,
            ];
        }

        // 2. High frequency transfer activity (more than 3 transfers in 2 hours for same account)
        $rapidTransfers = Transaction::where('created_at', '>=', Carbon::now()->subHours(2))
            ->whereNotNull('from_account_id')
            ->whereIn('transaction_type', ['peer_transfer', 'internal_transfer'])
            ->selectRaw('from_account_id, COUNT(*) as tx_count, SUM(amount) as total_volume, MAX(created_at) as last_tx')
            ->groupBy('from_account_id')
            ->havingRaw('COUNT(*) >= 3')
            ->get();

        foreach ($rapidTransfers as $rt) {
            $account = BankAccount::find($rt->from_account_id);
            if ($account) {
                $alerts[] = [
                    'type' => 'velocity_alert',
                    'severity' => 'high',
                    'title' => "Rapid Transfer Velocity Detected ({$rt->tx_count} transfers)",
                    'description' => "Account {$account->account_number} performed {$rt->tx_count} transfers totaling \${$rt->total_volume} in less than 2 hours.",
                    'entity' => $account->account_number,
                    'timestamp' => $rt->last_tx,
                ];
            }
        }

        // 3. Transactions requiring approval or exceeding $10,000 threshold
        $highValueTx = Transaction::where('amount', '>=', 10000.00)
            ->where('created_at', '>=', Carbon::now()->subDays(7))
            ->with(['fromAccount', 'toAccount', 'initiator'])
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        foreach ($highValueTx as $htx) {
            $alerts[] = [
                'type' => 'high_value',
                'severity' => 'medium',
                'title' => "High-Value Transaction Flagged (\${$htx->amount})",
                'description' => "Transaction {$htx->reference} of \${$htx->amount} initiated by {$htx->initiator->name}. Status: {$htx->status}.",
                'entity' => $htx->reference,
                'timestamp' => $htx->created_at->toIso8601String(),
            ];
        }

        // 4. Repeated failed scheduled transfers
        $failedSchedules = ScheduledTransferLog::where('status', 'failed')
            ->where('execution_date', '>=', Carbon::now()->subDays(7))
            ->selectRaw('scheduled_transfer_id, COUNT(*) as fail_count, MAX(execution_date) as last_fail')
            ->groupBy('scheduled_transfer_id')
            ->havingRaw('COUNT(*) >= 2')
            ->get();

        foreach ($failedSchedules as $fs) {
            $alerts[] = [
                'type' => 'recurring_transfer_failures',
                'severity' => 'medium',
                'title' => "Recurring Transfer Failure",
                'description' => "Scheduled transfer #{$fs->scheduled_transfer_id} failed {$fs->fail_count} times in the past week.",
                'entity' => "Schedule #{$fs->scheduled_transfer_id}",
                'timestamp' => $fs->last_fail,
            ];
        }

        return $alerts;
    }
}

