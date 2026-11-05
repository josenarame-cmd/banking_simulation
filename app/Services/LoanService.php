<?php

namespace App\Services;

use App\Models\BankAccount;
use App\Models\Loan;
use App\Models\LoanRepayment;
use App\Models\LoanSchedule;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\DB;

class LoanService
{
    /**
     * Submit a loan application.
     */
    public static function apply(
        User $user,
        BankAccount $receivingAccount,
        float $principalAmount,
        int $termMonths,
        string $purpose,
        ?string $documentPath = null
    ): Loan {
        if ($principalAmount <= 0) {
            throw new Exception("Requested loan amount must be greater than zero.");
        }

        if ($termMonths < 1 || $termMonths > 60) {
            throw new Exception("Loan term must be between 1 and 60 months.");
        }

        if ($receivingAccount->user_id !== $user->id) {
            throw new Exception("Receiving account must belong to you.");
        }

        if ($receivingAccount->status !== 'active') {
            throw new Exception("Receiving account is {$receivingAccount->status}. Cannot disburse to an inactive account.");
        }

        // Standard simulated interest rate: 10% per annum
        $annualRate = 10.00;
        // Total interest = Principal * (Rate/100) * (Months/12)
        $totalInterest = round($principalAmount * ($annualRate / 100.0) * ($termMonths / 12.0), 2);
        $totalPayable = round($principalAmount + $totalInterest, 2);

        $loan = Loan::create([
            'user_id' => $user->id,
            'account_id' => $receivingAccount->id,
            'principal_amount' => $principalAmount,
            'interest_rate' => $annualRate,
            'term_months' => $termMonths,
            'repayment_frequency' => 'monthly',
            'total_payable' => $totalPayable,
            'total_paid' => 0.00,
            'remaining_balance' => $totalPayable,
            'purpose' => $purpose,
            'document_path' => $documentPath,
            'status' => 'pending',
            'requested_at' => now(),
        ]);

        AuditLogService::log(
            'LOAN_APPLICATION_SUBMITTED',
            "Loan application of \${$principalAmount} submitted by {$user->name} for {$termMonths} months.",
            'Loan',
            $loan->id,
            $loan->toArray(),
            $user->id
        );

        NotificationService::send(
            $user->id,
            'Loan Application Submitted',
            "Your loan application for \${$principalAmount} has been received and is pending administrative review.",
            'info',
            ['loan_id' => $loan->id]
        );

        return $loan;
    }

    /**
     * Approve and disburse a loan.
     */
    public static function approveAndDisburse(
        Loan $loan,
        User $approver,
        ?float $approvedPrincipal = null,
        ?float $approvedRate = null,
        ?int $approvedTerm = null
    ): Loan {
        if ($loan->status !== 'pending') {
            throw new Exception("Only pending loans can be approved (current status: {$loan->status}).");
        }

        if (!$approver->isAdmin() && !$approver->isInstructor()) {
            throw new Exception("Unauthorized: Only administrators or instructors can approve loans.");
        }

        $principal = $approvedPrincipal ?? (float) $loan->principal_amount;
        $rate = $approvedRate ?? (float) $loan->interest_rate;
        $term = $approvedTerm ?? (int) $loan->term_months;

        $totalInterest = round($principal * ($rate / 100.0) * ($term / 12.0), 2);
        $totalPayable = round($principal + $totalInterest, 2);

        return DB::transaction(function () use ($loan, $approver, $principal, $rate, $term, $totalInterest, $totalPayable) {
            $account = BankAccount::where('id', $loan->account_id)->lockForUpdate()->first();

            // 1. Update Loan record
            $loan->update([
                'principal_amount' => $principal,
                'interest_rate' => $rate,
                'term_months' => $term,
                'total_payable' => $totalPayable,
                'remaining_balance' => $totalPayable,
                'status' => 'active',
                'approved_at' => now(),
                'approved_by' => $approver->id,
            ]);

            // 2. Generate Installment Schedules
            $monthlyPrincipal = round($principal / $term, 2);
            $monthlyInterest = round($totalInterest / $term, 2);
            $monthlyTotal = round($monthlyPrincipal + $monthlyInterest, 2);

            for ($i = 1; $i <= $term; $i++) {
                $dueDate = Carbon::now()->addMonths($i)->format('Y-m-d');
                LoanSchedule::create([
                    'loan_id' => $loan->id,
                    'installment_number' => $i,
                    'due_date' => $dueDate,
                    'principal_amount' => $monthlyPrincipal,
                    'interest_amount' => $monthlyInterest,
                    'total_amount' => $monthlyTotal,
                    'paid_amount' => 0.00,
                    'status' => 'pending',
                ]);
            }

            // 3. Disburse Principal Funds into Customer's Account!
            $ref = TransactionService::generateReference('LN-DISB');
            $tx = Transaction::create([
                'reference' => $ref,
                'from_account_id' => null, // Bank Loan Disbursement Portfolio
                'to_account_id' => $account->id,
                'transaction_type' => 'loan_disbursement',
                'amount' => $principal,
                'fee_amount' => 0.00,
                'description' => "Loan #{$loan->id} disbursement of \${$principal} ({$term} months @ {$rate}%)",
                'status' => 'completed',
                'initiated_by' => $approver->id,
            ]);

            $account->balance += $principal;
            $account->save();

            // Balanced Double-Entry Ledger:
            // 1. Bank Loan Asset Portfolio: DEBIT
            // 2. Customer Bank Account: CREDIT
            LedgerService::postEntries($tx, [
                [
                    'account_id' => null,
                    'entry_type' => 'debit',
                    'debit' => $principal,
                    'credit' => 0.00,
                    'balance_after' => $principal,
                ],
                [
                    'account_id' => $account->id,
                    'entry_type' => 'credit',
                    'debit' => 0.00,
                    'credit' => $principal,
                    'balance_after' => $account->balance,
                ]
            ]);

            AuditLogService::log(
                'LOAN_APPROVED_DISBURSED',
                "Loan #{$loan->id} approved and \${$principal} disbursed to {$account->account_number}.",
                'Loan',
                $loan->id,
                ['principal' => $principal, 'term' => $term, 'rate' => $rate],
                $approver->id
            );

            NotificationService::send(
                $loan->user_id,
                'Loan Approved and Disbursed!',
                "Congratulations! Your loan of \${$principal} has been approved and disbursed directly into your account {$account->account_number}.",
                'success',
                ['loan_id' => $loan->id, 'transaction_id' => $tx->id]
            );

            return $loan->fresh(['schedules']);
        });
    }

    /**
     * Reject a loan application.
     */
    public static function reject(Loan $loan, User $approver, string $reason): Loan
    {
        if ($loan->status !== 'pending') {
            throw new Exception("Only pending loans can be rejected.");
        }

        $loan->update([
            'status' => 'rejected',
            'rejection_reason' => $reason,
            'approved_by' => $approver->id,
            'approved_at' => now(),
        ]);

        AuditLogService::log(
            'LOAN_REJECTED',
            "Loan #{$loan->id} rejected by {$approver->name}. Reason: {$reason}",
            'Loan',
            $loan->id,
            ['reason' => $reason],
            $approver->id
        );

        NotificationService::send(
            $loan->user_id,
            'Loan Application Rejected',
            "Your loan application for \${$loan->principal_amount} was not approved. Reason: {$reason}",
            'danger',
            ['loan_id' => $loan->id]
        );

        return $loan;
    }

    /**
     * Process simulated repayment for an active loan.
     */
    public static function processRepayment(Loan $loan, float $amount, User $payer): LoanRepayment
    {
        if ($loan->status !== 'active') {
            throw new Exception("Cannot process repayment for loan with status '{$loan->status}'.");
        }

        if ($amount <= 0) {
            throw new Exception("Repayment amount must be greater than zero.");
        }

        $account = $loan->account;
        if ($account->balance < $amount) {
            throw new Exception("Insufficient balance in account {$account->account_number} (\${$account->balance}) to pay \${$amount}.");
        }

        return DB::transaction(function () use ($loan, $amount, $payer, $account) {
            $lockedAccount = BankAccount::where('id', $account->id)->lockForUpdate()->first();
            $lockedLoan = Loan::where('id', $loan->id)->lockForUpdate()->first();

            // Find pending schedules to satisfy
            $pendingSchedules = LoanSchedule::where('loan_id', $lockedLoan->id)
                ->whereIn('status', ['pending', 'partially_paid'])
                ->orderBy('installment_number')
                ->get();

            $remainingToAllocate = $amount;
            $principalPaid = 0.00;
            $interestPaid = 0.00;
            $targetScheduleId = null;

            foreach ($pendingSchedules as $sch) {
                if ($remainingToAllocate <= 0) break;

                $dueForThisSchedule = $sch->total_amount - $sch->paid_amount;
                $targetScheduleId = $sch->id;

                if ($remainingToAllocate >= $dueForThisSchedule) {
                    $sch->paid_amount = $sch->total_amount;
                    $sch->status = 'paid';
                    $sch->paid_at = now();
                    $sch->save();

                    $principalPaid += (float) $sch->principal_amount;
                    $interestPaid += (float) $sch->interest_amount;
                    $remainingToAllocate -= $dueForThisSchedule;
                } else {
                    $sch->paid_amount += $remainingToAllocate;
                    $sch->status = 'partially_paid';
                    $sch->save();

                    // Pro-rate principal and interest portion
                    $principalPaid += round($remainingToAllocate * ($sch->principal_amount / $sch->total_amount), 2);
                    $interestPaid += ($remainingToAllocate - round($remainingToAllocate * ($sch->principal_amount / $sch->total_amount), 2));
                    $remainingToAllocate = 0;
                }
            }

            // Fallback split if extra or no schedule matched
            if ($principalPaid + $interestPaid == 0) {
                $principalPaid = round($amount * 0.9, 2);
                $interestPaid = round($amount * 0.1, 2);
            }

            // Deduct repayment from customer account
            $lockedAccount->balance -= $amount;
            $lockedAccount->save();

            // Update loan remaining balance
            $lockedLoan->total_paid += $amount;
            $lockedLoan->remaining_balance = max(0.00, $lockedLoan->total_payable - $lockedLoan->total_paid);
            if ($lockedLoan->remaining_balance <= 0.00) {
                $lockedLoan->status = 'completed';
            }
            $lockedLoan->save();

            // Create Transaction record
            $ref = TransactionService::generateReference('LN-REP');
            $tx = Transaction::create([
                'reference' => $ref,
                'from_account_id' => $lockedAccount->id,
                'to_account_id' => null, // Bank Loan Asset Clearing
                'transaction_type' => 'loan_repayment',
                'amount' => $amount,
                'fee_amount' => 0.00,
                'description' => "Loan #{$lockedLoan->id} repayment installment",
                'status' => 'completed',
                'initiated_by' => $payer->id,
            ]);

            // Balanced Double-Entry:
            // 1. Customer Account: DEBIT (balance decreases)
            // 2. Bank Loan Asset / Interest Income: CREDIT (settling receivable)
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

            $repayment = LoanRepayment::create([
                'loan_id' => $lockedLoan->id,
                'loan_schedule_id' => $targetScheduleId,
                'transaction_id' => $tx->id,
                'amount' => $amount,
                'principal_paid' => $principalPaid,
                'interest_paid' => $interestPaid,
                'remaining_balance' => $lockedLoan->remaining_balance,
                'payment_date' => now(),
                'status' => 'completed',
            ]);

            AuditLogService::log(
                'LOAN_REPAYMENT_PROCESSED',
                "Loan #{$lockedLoan->id} received repayment of \${$amount}. Outstanding balance: \${$lockedLoan->remaining_balance}.",
                'LoanRepayment',
                $repayment->id,
                ['amount' => $amount, 'remaining' => $lockedLoan->remaining_balance],
                $payer->id
            );

            NotificationService::send(
                $lockedLoan->user_id,
                'Loan Repayment Confirmed',
                "Repayment of \${$amount} for Loan #{$lockedLoan->id} successful. Remaining balance: \${$lockedLoan->remaining_balance}.",
                'success',
                ['loan_id' => $lockedLoan->id, 'transaction_id' => $tx->id]
            );

            return $repayment;
        });
    }
}

