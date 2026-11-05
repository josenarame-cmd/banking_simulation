<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\Fee;
use App\Models\InterestCalculation;
use App\Models\LedgerEntry;
use App\Models\Loan;
use App\Models\Transaction;
use App\Services\LedgerService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    /**
     * Cashflow statement report.
     */
    public function cashflow(Request $request): JsonResponse
    {
        $startDate = $request->get('from_date', Carbon::now()->subDays(30)->format('Y-m-d'));
        $endDate = $request->get('to_date', Carbon::now()->format('Y-m-d'));

        $deposits = (float) Transaction::where('transaction_type', 'deposit')
            ->where('status', 'completed')
            ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->sum('amount');

        $withdrawals = (float) Transaction::where('transaction_type', 'withdrawal')
            ->where('status', 'completed')
            ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->sum('amount');

        $transfers = (float) Transaction::whereIn('transaction_type', ['internal_transfer', 'peer_transfer'])
            ->where('status', 'completed')
            ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->sum('amount');

        $fees = (float) Fee::whereBetween('applied_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])->sum('amount');

        $interest = (float) InterestCalculation::where('status', 'credited')
            ->whereBetween('processed_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->sum('interest_amount');

        return response()->json([
            'status' => 'success',
            'period' => ['from' => $startDate, 'to' => $endDate],
            'inflow' => [
                'deposits' => $deposits,
                'fees_collected' => $fees,
                'total_inflow' => $deposits + $fees,
            ],
            'outflow' => [
                'withdrawals' => $withdrawals,
                'interest_paid' => $interest,
                'total_outflow' => $withdrawals + $interest,
            ],
            'net_cashflow' => ($deposits + $fees) - ($withdrawals + $interest),
            'interbank_volume' => $transfers,
        ]);
    }

    /**
     * Export reports directly to CSV.
     */
    public function exportCsv(Request $request, string $type): StreamedResponse
    {
        $filename = "banking-report-{$type}-" . date('Y-m-d') . ".csv";

        return response()->streamDownload(function () use ($type) {
            $handle = fopen('php://output', 'w');

            if ($type === 'transactions') {
                fputcsv($handle, ['Reference', 'Type', 'From Account', 'To Account', 'Amount', 'Fee', 'Status', 'Date', 'Description']);
                Transaction::with(['fromAccount', 'toAccount'])
                    ->orderBy('id', 'desc')
                    ->chunk(100, function ($rows) use ($handle) {
                        foreach ($rows as $r) {
                            fputcsv($handle, [
                                $r->reference,
                                $r->transaction_type,
                                $r->fromAccount ? $r->fromAccount->account_number : 'EXTERNAL',
                                $r->toAccount ? $r->toAccount->account_number : 'EXTERNAL',
                                $r->amount,
                                $r->fee_amount,
                                $r->status,
                                $r->created_at->toDateTimeString(),
                                $r->description,
                            ]);
                        }
                    });
            } elseif ($type === 'accounts') {
                fputcsv($handle, ['Account Number', 'Owner', 'Type', 'Balance', 'Currency', 'Status', 'Opened At']);
                BankAccount::with(['user', 'accountType'])
                    ->orderBy('id')
                    ->chunk(100, function ($rows) use ($handle) {
                        foreach ($rows as $r) {
                            fputcsv($handle, [
                                $r->account_number,
                                $r->user->name,
                                $r->account_type,
                                $r->balance,
                                $r->currency,
                                $r->status,
                                $r->opened_at,
                            ]);
                        }
                    });
            } elseif ($type === 'ledger') {
                fputcsv($handle, ['ID', 'Transaction Ref', 'Account', 'Entry Type', 'Debit', 'Credit', 'Balance After', 'Timestamp']);
                LedgerEntry::with(['transaction', 'account'])
                    ->orderBy('id')
                    ->chunk(100, function ($rows) use ($handle) {
                        foreach ($rows as $r) {
                            fputcsv($handle, [
                                $r->id,
                                $r->transaction->reference,
                                $r->account ? $r->account->account_number : 'CLEARING_VAULT',
                                $r->entry_type,
                                $r->debit,
                                $r->credit,
                                $r->balance_after,
                                $r->created_at->toDateTimeString(),
                            ]);
                        }
                    });
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}

