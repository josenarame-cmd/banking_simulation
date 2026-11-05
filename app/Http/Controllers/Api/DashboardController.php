<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Approval;
use App\Models\AuditLog;
use App\Models\BankAccount;
use App\Models\Fee;
use App\Models\InterestCalculation;
use App\Models\Loan;
use App\Models\LoanSchedule;
use App\Models\Notification;
use App\Models\ScheduledTransfer;
use App\Models\Transaction;
use App\Models\User;
use App\Services\FraudMonitoringService;
use App\Services\LedgerService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Administrator comprehensive dashboard metrics & analytics.
     */
    public function admin(): JsonResponse
    {
        // 1. Summary Cards
        $totalUsers = User::count();
        $totalAccounts = BankAccount::count();
        $checkingCount = BankAccount::where('account_type', 'checking')->count();
        $savingsCount = BankAccount::where('account_type', 'savings')->count();
        $fixedDepositCount = BankAccount::where('account_type', 'fixed_deposit')->count();
        $totalBalances = (float) BankAccount::sum('balance');

        $totalDeposits = (float) Transaction::where('transaction_type', 'deposit')->where('status', 'completed')->sum('amount');
        $totalWithdrawals = (float) Transaction::where('transaction_type', 'withdrawal')->where('status', 'completed')->sum('amount');
        $totalTransfers = (float) Transaction::whereIn('transaction_type', ['internal_transfer', 'peer_transfer'])->where('status', 'completed')->sum('amount');
        $totalInterestCredited = (float) InterestCalculation::where('status', 'credited')->sum('interest_amount');
        $totalFeesCollected = (float) Fee::sum('amount');

        $activeLoans = Loan::where('status', 'active')->count();
        $outstandingLoanBalance = (float) Loan::where('status', 'active')->sum('remaining_balance');
        $pendingApprovals = Approval::where('status', 'pending')->count();
        $fraudAlerts = FraudMonitoringService::getSecurityAlerts();

        // 2. Daily Cash Inflow vs Outflow (Past 14 Days)
        $dailyCashflow = [];
        for ($i = 13; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i)->format('Y-m-d');
            $inflow = (float) Transaction::where('transaction_type', 'deposit')
                ->where('status', 'completed')
                ->whereDate('created_at', $date)
                ->sum('amount');

            $outflow = (float) Transaction::where('transaction_type', 'withdrawal')
                ->where('status', 'completed')
                ->whereDate('created_at', $date)
                ->sum('amount');

            $dailyCashflow[] = [
                'date' => Carbon::parse($date)->format('M d'),
                'inflow' => $inflow,
                'outflow' => $outflow,
                'net' => $inflow - $outflow,
            ];
        }

        // 3. Transactions distribution by type
        $distributionByType = Transaction::where('status', 'completed')
            ->selectRaw('transaction_type, COUNT(*) as count, SUM(amount) as total_amount')
            ->groupBy('transaction_type')
            ->get();

        // 4. Balances by Account Type
        $balancesByType = BankAccount::selectRaw('account_type, SUM(balance) as total_balance, COUNT(*) as account_count')
            ->groupBy('account_type')
            ->get();

        // 5. Top Transacting Users
        $topTransactors = Transaction::with('initiator')
            ->where('status', 'completed')
            ->selectRaw('initiated_by, COUNT(*) as tx_count, SUM(amount) as total_volume')
            ->groupBy('initiated_by')
            ->orderBy('total_volume', 'desc')
            ->take(5)
            ->get()
            ->map(function ($t) {
                return [
                    'user_id' => $t->initiated_by,
                    'name' => $t->initiator ? $t->initiator->name : 'System',
                    'tx_count' => $t->tx_count,
                    'total_volume' => (float) $t->total_volume,
                ];
            });

        return response()->json([
            'status' => 'success',
            'metrics' => [
                'total_users' => $totalUsers,
                'total_accounts' => $totalAccounts,
                'checking_count' => $checkingCount,
                'savings_count' => $savingsCount,
                'fixed_deposit_count' => $fixedDepositCount,
                'total_balances' => $totalBalances,
                'total_deposits' => $totalDeposits,
                'total_withdrawals' => $totalWithdrawals,
                'total_transfers' => $totalTransfers,
                'total_interest_credited' => $totalInterestCredited,
                'total_fees_collected' => $totalFeesCollected,
                'active_loans' => $activeLoans,
                'outstanding_loan_balance' => $outstandingLoanBalance,
                'pending_approvals' => $pendingApprovals,
                'suspicious_activity_count' => count($fraudAlerts),
            ],
            'charts' => [
                'daily_cashflow' => $dailyCashflow,
                'distribution_by_type' => $distributionByType,
                'balances_by_type' => $balancesByType,
                'top_transactors' => $topTransactors,
            ],
            'recent_approvals' => Approval::with(['transaction.fromAccount', 'transaction.toAccount', 'transaction.initiator'])
                ->where('status', 'pending')
                ->take(5)
                ->get(),
            'recent_audit_logs' => AuditLog::with('user')->orderBy('id', 'desc')->take(6)->get(),
        ]);
    }

    /**
     * Instructor training environment monitoring dashboard.
     */
    public function instructor(): JsonResponse
    {
        $learnersCount = User::where('role', 'user')->count();
        $simulatedAccounts = BankAccount::count();
        $ledgerStatus = LedgerService::reconcileDateRange();
        $loanApplicationsCount = Loan::count();
        $scheduledTransfersCount = ScheduledTransfer::where('status', 'active')->count();
        $failedTxCount = Transaction::where('status', 'failed')->count();

        $accountTypeDistribution = BankAccount::selectRaw('account_type, COUNT(*) as count, SUM(balance) as total_balance')
            ->groupBy('account_type')
            ->get();

        $recentTransactions = Transaction::with(['fromAccount', 'toAccount', 'initiator'])
            ->orderBy('id', 'desc')
            ->take(10)
            ->get();

        $recentLearners = User::where('role', 'user')
            ->with(['accounts', 'profile'])
            ->orderBy('id', 'desc')
            ->take(6)
            ->get();

        return response()->json([
            'status' => 'success',
            'metrics' => [
                'learners_count' => $learnersCount,
                'simulated_accounts' => $simulatedAccounts,
                'loan_applications_count' => $loanApplicationsCount,
                'scheduled_transfers_count' => $scheduledTransfersCount,
                'failed_transactions_count' => $failedTxCount,
                'is_ledger_balanced' => $ledgerStatus['is_balanced'],
                'total_ledger_debits' => $ledgerStatus['total_debits'],
                'total_ledger_credits' => $ledgerStatus['total_credits'],
            ],
            'account_distribution' => $accountTypeDistribution,
            'recent_transactions' => $recentTransactions,
            'recent_learners' => $recentLearners,
            'ledger_status' => $ledgerStatus,
        ]);
    }

    /**
     * End-user personal banking dashboard.
     */
    public function user(Request $request): JsonResponse
    {
        $user = $request->user();
        $accounts = BankAccount::with('accountType')
            ->where('user_id', $user->id)
            ->get();

        $accountIds = $accounts->pluck('id')->toArray();
        $totalBalance = (float) $accounts->sum('balance');

        $recentTransactions = Transaction::with(['fromAccount', 'toAccount'])
            ->where(function ($q) use ($accountIds, $user) {
                $q->whereIn('from_account_id', $accountIds)
                    ->orWhereIn('to_account_id', $accountIds)
                    ->orWhere('initiated_by', $user->id);
            })
            ->orderBy('id', 'desc')
            ->take(5)
            ->get();

        $activeLoans = Loan::where('user_id', $user->id)->where('status', 'active')->get();
        $upcomingInstallments = LoanSchedule::whereIn('loan_id', $activeLoans->pluck('id'))
            ->whereIn('status', ['pending', 'partially_paid'])
            ->orderBy('due_date', 'asc')
            ->take(3)
            ->get();

        $scheduledTransfers = ScheduledTransfer::with(['fromAccount', 'toAccount'])
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->take(3)
            ->get();

        $unreadNotifications = Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        $pendingApprovals = Transaction::where('initiated_by', $user->id)
            ->where('status', 'requires_approval')
            ->count();

        return response()->json([
            'status' => 'success',
            'summary' => [
                'accounts_count' => count($accounts),
                'total_balance' => $totalBalance,
                'active_loans_count' => count($activeLoans),
                'total_loan_debt' => (float) $activeLoans->sum('remaining_balance'),
                'scheduled_transfers_count' => count($scheduledTransfers),
                'unread_notifications' => $unreadNotifications,
                'pending_approvals' => $pendingApprovals,
            ],
            'accounts' => $accounts,
            'recent_transactions' => $recentTransactions,
            'upcoming_installments' => $upcomingInstallments,
            'active_scheduled_transfers' => $scheduledTransfers,
        ]);
    }
}

