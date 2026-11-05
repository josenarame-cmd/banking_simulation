<?php

namespace App\Services;

use App\Models\BankAccount;
use App\Models\LedgerEntry;
use App\Models\Transaction;
use Exception;
use Illuminate\Support\Facades\DB;

class LedgerService
{
    /**
     * Post a balanced pair or set of ledger entries for a transaction.
     * Enforces the fundamental banking equation: SUM(Debit) == SUM(Credit).
     */
    public static function postEntries(Transaction $transaction, array $entries): array
    {
        $totalDebit = 0.00;
        $totalCredit = 0.00;

        foreach ($entries as $e) {
            $totalDebit += (float) ($e['debit'] ?? 0.00);
            $totalCredit += (float) ($e['credit'] ?? 0.00);
        }

        // Validate double-entry equality (with tolerance for float representation)
        if (round($totalDebit, 2) !== round($totalCredit, 2)) {
            throw new Exception("Double-entry unbalanced: Total Debits ({$totalDebit}) != Total Credits ({$totalCredit})");
        }

        $createdEntries = [];

        foreach ($entries as $entryData) {
            $createdEntries[] = LedgerEntry::create([
                'transaction_id' => $transaction->id,
                'account_id' => $entryData['account_id'] ?? null,
                'entry_type' => $entryData['entry_type'], // 'debit' or 'credit'
                'debit' => $entryData['debit'] ?? 0.00,
                'credit' => $entryData['credit'] ?? 0.00,
                'balance_after' => $entryData['balance_after'],
            ]);
        }

        return $createdEntries;
    }

    /**
     * Check if a specific transaction's ledger entries are balanced.
     */
    public static function verifyTransactionBalance(int $transactionId): bool
    {
        $totals = LedgerEntry::where('transaction_id', $transactionId)
            ->selectRaw('SUM(debit) as total_debit, SUM(credit) as total_credit')
            ->first();

        if (!$totals) {
            return false;
        }

        return round((float) $totals->total_debit, 2) === round((float) $totals->total_credit, 2);
    }

    /**
     * Perform full reconciliation check across all transactions in a date range.
     */
    public static function reconcileDateRange(?string $startDate = null, ?string $endDate = null): array
    {
        $query = LedgerEntry::query();

        if ($startDate) {
            $query->whereDate('created_at', '>=', $startDate);
        }
        if ($endDate) {
            $query->whereDate('created_at', '<=', $endDate);
        }

        $summary = $query->selectRaw('
            COUNT(id) as total_entries,
            COUNT(DISTINCT transaction_id) as total_transactions,
            COALESCE(SUM(debit), 0) as total_debits,
            COALESCE(SUM(credit), 0) as total_credits
        ')->first();

        $totalDebits = round((float) $summary->total_debits, 2);
        $totalCredits = round((float) $summary->total_credits, 2);
        $difference = round(abs($totalDebits - $totalCredits), 2);
        $isBalanced = $difference == 0.00;

        // Find any unbalanced transactions individually
        $unbalancedTxIds = LedgerEntry::groupBy('transaction_id')
            ->selectRaw('transaction_id, ROUND(SUM(debit), 2) as debits, ROUND(SUM(credit), 2) as credits')
            ->havingRaw('ROUND(SUM(debit), 2) != ROUND(SUM(credit), 2)')
            ->pluck('transaction_id')
            ->toArray();

        return [
            'is_balanced' => $isBalanced && empty($unbalancedTxIds),
            'total_entries' => (int) $summary->total_entries,
            'total_transactions' => (int) $summary->total_transactions,
            'total_debits' => $totalDebits,
            'total_credits' => $totalCredits,
            'difference' => $difference,
            'unbalanced_transaction_ids' => $unbalancedTxIds,
            'reconciled_at' => now()->toIso8601String(),
        ];
    }
}

