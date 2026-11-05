<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LedgerEntry;
use App\Services\LedgerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LedgerController extends Controller
{
    /**
     * View double-entry ledger records.
     */
    public function index(Request $request): JsonResponse
    {
        $query = LedgerEntry::with(['transaction.initiator', 'account.user']);

        if ($request->has('account_id') && $request->account_id) {
            $query->where('account_id', $request->account_id);
        }
        if ($request->has('entry_type') && $request->entry_type) {
            $query->where('entry_type', $request->entry_type);
        }
        if ($request->has('from_date') && $request->from_date) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }
        if ($request->has('to_date') && $request->to_date) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        $entries = $query->orderBy('id', 'desc')->paginate($request->get('per_page', 25));

        return response()->json($entries);
    }

    /**
     * Ledger reconciliation verification.
     */
    public function reconciliation(Request $request): JsonResponse
    {
        $startDate = $request->get('from_date');
        $endDate = $request->get('to_date');

        $result = LedgerService::reconcileDateRange($startDate, $endDate);

        return response()->json([
            'status' => 'success',
            'reconciliation' => $result,
        ]);
    }
}

