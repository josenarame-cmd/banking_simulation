<?php

namespace Database\Seeders;

use App\Models\AccountType;
use App\Models\Approval;
use App\Models\AuditLog;
use App\Models\BankAccount;
use App\Models\Fee;
use App\Models\FeeType;
use App\Models\InterestCalculation;
use App\Models\InterestRate;
use App\Models\LedgerEntry;
use App\Models\Loan;
use App\Models\LoanRepayment;
use App\Models\LoanSchedule;
use App\Models\Notification;
use App\Models\ScheduledTransfer;
use App\Models\SystemSetting;
use App\Models\Transaction;
use App\Models\User;
use App\Models\UserProfile;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Account Types
        $checkingType = AccountType::create([
            'name' => 'Checking Account',
            'code' => 'checking',
            'description' => 'Everyday transactional banking account with routine deposits, withdrawals, and transfers.',
            'minimum_balance' => 0.00,
            'interest_rate' => 0.00,
            'withdrawal_limit' => 5000.00,
            'lock_period_days' => 0,
            'maintenance_fee' => 5.00,
            'status' => 'active',
        ]);

        $savingsType = AccountType::create([
            'name' => 'Savings Account',
            'code' => 'savings',
            'description' => 'High-yield interest bearing account with periodic interest accruals.',
            'minimum_balance' => 100.00,
            'interest_rate' => 4.50,
            'withdrawal_limit' => 2000.00,
            'lock_period_days' => 0,
            'maintenance_fee' => 0.00,
            'status' => 'active',
        ]);

        $fixedDepositType = AccountType::create([
            'name' => 'Fixed Deposit Account',
            'code' => 'fixed_deposit',
            'description' => 'Fixed-term deposit with higher return rate and restricted early withdrawals.',
            'minimum_balance' => 1000.00,
            'interest_rate' => 8.00,
            'withdrawal_limit' => 0.00,
            'lock_period_days' => 180,
            'maintenance_fee' => 0.00,
            'status' => 'active',
        ]);

        // 2. Interest Rates
        InterestRate::create([
            'account_type_id' => $savingsType->id,
            'rate' => 4.50,
            'effective_from' => '2026-01-01',
            'status' => 'active',
        ]);

        InterestRate::create([
            'account_type_id' => $fixedDepositType->id,
            'rate' => 8.00,
            'effective_from' => '2026-01-01',
            'status' => 'active',
        ]);

        // 3. Fee Types
        FeeType::create([
            'name' => 'Monthly Account Maintenance',
            'code' => 'monthly_maintenance',
            'amount' => 5.00,
            'calculation_method' => 'fixed',
            'applicable_account_type' => 'checking',
            'status' => 'active',
        ]);

        FeeType::create([
            'name' => 'Peer Transfer Fee',
            'code' => 'peer_transfer_fee',
            'amount' => 1.50,
            'calculation_method' => 'fixed',
            'applicable_account_type' => 'all',
            'status' => 'active',
        ]);

        FeeType::create([
            'name' => 'ATM / Simulated Withdrawal Fee',
            'code' => 'withdrawal_fee',
            'amount' => 2.00,
            'calculation_method' => 'fixed',
            'applicable_account_type' => 'checking',
            'status' => 'active',
        ]);

        // 4. System Settings
        SystemSetting::set('approval_threshold', '10000.00', 'Transactions exceeding this amount require instructor/admin approval');
        SystemSetting::set('daily_transfer_limit', '50000.00', 'Maximum transfer limit per account per 24 hours');
        SystemSetting::set('bank_name', 'FinTech Simulated Core Bank', 'System display name');
        SystemSetting::set('default_currency', 'USD', 'Primary simulation currency');
        SystemSetting::set('system_status', 'active', 'Operational status of the banking platform');

        // 5. Seed Users
        $admin = User::create([
            'name' => 'System Administrator',
            'email' => 'admin@banking.com',
            'phone' => '+250788111222',
            'role' => 'admin',
            'status' => 'active',
            'email_verified_at' => now(),
            'password' => Hash::make('password123'),
        ]);
        UserProfile::create([
            'user_id' => $admin->id,
            'address' => 'Kigali Innovation City, Rwanda',
            'date_of_birth' => '1985-05-15',
            'identification_number' => 'ADM-2026-001',
        ]);

        $instructor = User::create([
            'name' => 'SAFARI Cyprien (Instructor)',
            'email' => 'instructor@banking.com',
            'phone' => '+250788333444',
            'role' => 'instructor',
            'status' => 'active',
            'email_verified_at' => now(),
            'password' => Hash::make('password123'),
        ]);
        UserProfile::create([
            'user_id' => $instructor->id,
            'address' => 'RP Karongi College, Western Province, Rwanda',
            'date_of_birth' => '1988-11-20',
            'identification_number' => 'INST-2026-002',
        ]);

        $john = User::create([
            'name' => 'John Doe',
            'email' => 'john.doe@banking.com',
            'phone' => '+250788555666',
            'role' => 'user',
            'status' => 'active',
            'email_verified_at' => now(),
            'password' => Hash::make('password123'),
        ]);
        UserProfile::create([
            'user_id' => $john->id,
            'address' => 'Avenue de la Paix, Kigali',
            'date_of_birth' => '1998-04-12',
            'identification_number' => '1199880012345678',
        ]);

        $jane = User::create([
            'name' => 'Jane Smith',
            'email' => 'jane.smith@banking.com',
            'phone' => '+250788777888',
            'role' => 'user',
            'status' => 'active',
            'email_verified_at' => now(),
            'password' => Hash::make('password123'),
        ]);
        UserProfile::create([
            'user_id' => $jane->id,
            'address' => 'Gisenyi Waterfront, Rubavu',
            'date_of_birth' => '2000-09-25',
            'identification_number' => '1200080087654321',
        ]);

        $robert = User::create([
            'name' => 'Robert Mugisha',
            'email' => 'robert.mugisha@banking.com',
            'phone' => '+250788999000',
            'role' => 'user',
            'status' => 'active',
            'email_verified_at' => now(),
            'password' => Hash::make('password123'),
        ]);
        UserProfile::create([
            'user_id' => $robert->id,
            'address' => 'Huye Technology Hub, Southern Province',
            'date_of_birth' => '1999-01-30',
            'identification_number' => '1199980045612378',
        ]);

        // 6. Bank Accounts
        // John's Checking
        $johnChecking = BankAccount::create([
            'user_id' => $john->id,
            'account_type_id' => $checkingType->id,
            'account_number' => 'CHK-10000001',
            'account_name' => "John Doe's Checking",
            'account_type' => 'checking',
            'currency' => 'USD',
            'balance' => 12500.00,
            'status' => 'active',
            'opened_at' => Carbon::now()->subMonths(3),
        ]);

        // John's Savings
        $johnSavings = BankAccount::create([
            'user_id' => $john->id,
            'account_type_id' => $savingsType->id,
            'account_number' => 'SAV-20000001',
            'account_name' => "John Doe's High Yield Savings",
            'account_type' => 'savings',
            'currency' => 'USD',
            'balance' => 25000.00,
            'status' => 'active',
            'opened_at' => Carbon::now()->subMonths(3),
        ]);

        // John's Fixed Deposit
        $johnFixed = BankAccount::create([
            'user_id' => $john->id,
            'account_type_id' => $fixedDepositType->id,
            'account_number' => 'FD-30000001',
            'account_name' => "John Doe's 6-Month Term Deposit",
            'account_type' => 'fixed_deposit',
            'currency' => 'USD',
            'balance' => 10000.00,
            'status' => 'active',
            'opened_at' => Carbon::now()->subMonths(2),
            'maturity_date' => Carbon::now()->addMonths(4),
        ]);

        // Jane's Checking
        $janeChecking = BankAccount::create([
            'user_id' => $jane->id,
            'account_type_id' => $checkingType->id,
            'account_number' => 'CHK-10000002',
            'account_name' => "Jane Smith's Checking",
            'account_type' => 'checking',
            'currency' => 'USD',
            'balance' => 8400.00,
            'status' => 'active',
            'opened_at' => Carbon::now()->subMonths(2),
        ]);

        // Robert's Checking
        $robertChecking = BankAccount::create([
            'user_id' => $robert->id,
            'account_type_id' => $checkingType->id,
            'account_number' => 'CHK-10000003',
            'account_name' => "Robert Mugisha's Checking",
            'account_type' => 'checking',
            'currency' => 'USD',
            'balance' => 4200.00,
            'status' => 'active',
            'opened_at' => Carbon::now()->subMonth(),
        ]);

        // 7. Seed Transactions and Balanced Ledger Entries
        // Initial Deposit for John's Checking ($15,000)
        $tx1 = Transaction::create([
            'reference' => 'TXN-' . strtoupper(Str::random(10)),
            'from_account_id' => null,
            'to_account_id' => $johnChecking->id,
            'transaction_type' => 'deposit',
            'amount' => 15000.00,
            'fee_amount' => 0.00,
            'description' => 'Initial opening cash deposit',
            'status' => 'completed',
            'initiated_by' => $john->id,
            'created_at' => Carbon::now()->subDays(60),
        ]);
        LedgerEntry::create([
            'transaction_id' => $tx1->id,
            'account_id' => null,
            'entry_type' => 'debit',
            'debit' => 15000.00,
            'credit' => 0.00,
            'balance_after' => 15000.00,
            'created_at' => $tx1->created_at,
        ]);
        LedgerEntry::create([
            'transaction_id' => $tx1->id,
            'account_id' => $johnChecking->id,
            'entry_type' => 'credit',
            'debit' => 0.00,
            'credit' => 15000.00,
            'balance_after' => 15000.00,
            'created_at' => $tx1->created_at,
        ]);

        // Transfer John Checking -> Jane Checking ($2,500)
        $tx2 = Transaction::create([
            'reference' => 'TXN-' . strtoupper(Str::random(10)),
            'from_account_id' => $johnChecking->id,
            'to_account_id' => $janeChecking->id,
            'transaction_type' => 'peer_transfer',
            'amount' => 2500.00,
            'fee_amount' => 0.00,
            'description' => 'Software consultancy project milestone 1 payment',
            'status' => 'completed',
            'initiated_by' => $john->id,
            'created_at' => Carbon::now()->subDays(20),
        ]);
        LedgerEntry::create([
            'transaction_id' => $tx2->id,
            'account_id' => $johnChecking->id,
            'entry_type' => 'debit',
            'debit' => 2500.00,
            'credit' => 0.00,
            'balance_after' => 12500.00,
            'created_at' => $tx2->created_at,
        ]);
        LedgerEntry::create([
            'transaction_id' => $tx2->id,
            'account_id' => $janeChecking->id,
            'entry_type' => 'credit',
            'debit' => 0.00,
            'credit' => 2500.00,
            'balance_after' => 8400.00,
            'created_at' => $tx2->created_at,
        ]);

        // High Value Transfer pending approval ($15,000)
        $tx3 = Transaction::create([
            'reference' => 'TXN-HIGH-' . strtoupper(Str::random(8)),
            'from_account_id' => $johnChecking->id,
            'to_account_id' => $robertChecking->id,
            'transaction_type' => 'peer_transfer',
            'amount' => 15000.00,
            'fee_amount' => 0.00,
            'description' => 'Commercial equipment purchase simulated payment',
            'status' => 'requires_approval',
            'requires_approval' => true,
            'initiated_by' => $john->id,
            'created_at' => Carbon::now()->subHours(6),
        ]);
        Approval::create([
            'transaction_id' => $tx3->id,
            'approver_id' => null,
            'approval_level' => 1,
            'status' => 'pending',
            'notes' => 'Awaiting instructor or admin review. Exceeds $10,000 threshold.',
        ]);

        // 8. Seed Scheduled Transfer
        ScheduledTransfer::create([
            'user_id' => $john->id,
            'from_account_id' => $johnChecking->id,
            'to_account_id' => $johnSavings->id,
            'amount' => 500.00,
            'frequency' => 'monthly',
            'schedule_expression' => 'Every 1st of month',
            'start_date' => Carbon::now()->subMonth(),
            'next_run_at' => Carbon::now()->addDays(15),
            'end_date' => Carbon::now()->addYear(),
            'status' => 'active',
        ]);

        // 9. Seed Loan for John Doe
        $loan = Loan::create([
            'user_id' => $john->id,
            'account_id' => $johnChecking->id,
            'principal_amount' => 5000.00,
            'interest_rate' => 10.00,
            'term_months' => 6,
            'repayment_frequency' => 'monthly',
            'total_payable' => 5250.00,
            'total_paid' => 1750.00,
            'remaining_balance' => 3500.00,
            'purpose' => 'FinTech laboratory simulation hardware setup',
            'status' => 'active',
            'requested_at' => Carbon::now()->subMonths(2),
            'approved_at' => Carbon::now()->subMonths(2)->addDays(1),
            'approved_by' => $admin->id,
        ]);

        // Loan installment schedules
        for ($i = 1; $i <= 6; $i++) {
            $isPaid = $i <= 2;
            $dueDate = Carbon::now()->subMonths(2)->addMonths($i)->format('Y-m-d');
            LoanSchedule::create([
                'loan_id' => $loan->id,
                'installment_number' => $i,
                'due_date' => $dueDate,
                'principal_amount' => 833.33,
                'interest_amount' => 41.67,
                'total_amount' => 875.00,
                'paid_amount' => $isPaid ? 875.00 : 0.00,
                'status' => $isPaid ? 'paid' : 'pending',
                'paid_at' => $isPaid ? Carbon::parse($dueDate)->subDays(2) : null,
            ]);
        }

        // Loan repayment records
        LoanRepayment::create([
            'loan_id' => $loan->id,
            'amount' => 875.00,
            'principal_paid' => 833.33,
            'interest_paid' => 41.67,
            'remaining_balance' => 4375.00,
            'payment_date' => Carbon::now()->subMonth(),
            'status' => 'completed',
        ]);
        LoanRepayment::create([
            'loan_id' => $loan->id,
            'amount' => 875.00,
            'principal_paid' => 833.33,
            'interest_paid' => 41.67,
            'remaining_balance' => 3500.00,
            'payment_date' => Carbon::now()->subDays(5),
            'status' => 'completed',
        ]);

        // 10. Notifications
        Notification::create([
            'user_id' => $john->id,
            'title' => 'Welcome to FinTech Core Banking',
            'message' => 'Your simulated accounts have been activated. You can now perform deposits, transfers, and schedule recurring payments.',
            'notification_type' => 'info',
            'is_read' => true,
        ]);
        Notification::create([
            'user_id' => $john->id,
            'title' => 'High-Value Transfer Under Review',
            'message' => 'Your transfer of $15,000.00 is currently queued for instructor/admin approval.',
            'notification_type' => 'warning',
            'is_read' => false,
        ]);
        Notification::create([
            'user_id' => $jane->id,
            'title' => 'Incoming Funds Received',
            'message' => 'You received $2,500.00 from John Doe (CHK-10000001).',
            'notification_type' => 'success',
            'is_read' => false,
        ]);

        // 11. Audit Logs
        AuditLog::create([
            'user_id' => $admin->id,
            'action' => 'SYSTEM_INIT',
            'entity_type' => 'system',
            'entity_id' => null,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'description' => 'System seed executed with default account types and policies.',
        ]);
        AuditLog::create([
            'user_id' => $john->id,
            'action' => 'TRANSFER_INITIATED',
            'entity_type' => 'Transaction',
            'entity_id' => $tx2->id,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0',
            'description' => 'Peer transfer of $2,500.00 initiated from CHK-10000001 to CHK-10000002.',
        ]);
    }
}
