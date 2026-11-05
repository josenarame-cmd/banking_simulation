<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Approval;
use App\Services\ApprovalService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApprovalController extends Controller
{
    /**
     * List all pending high-value transaction approvals.
     */
    public function index(): JsonResponse
    {
        $approvals = Approval::with([
            'transaction.fromAccount.user',
            'transaction.toAccount.user',
            'transaction.initiator'
        ])
            ->where('status', 'pending')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'count' => count($approvals),
            'data' => $approvals,
        ]);
    }

    /**
     * Approve a high-value transaction.
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        $request->validate(['notes' => 'nullable|string|max:500']);
        $approval = Approval::with('transaction')->findOrFail($id);

        try {
            $tx = ApprovalService::approve($approval, $request->user(), $request->notes);

            return response()->json([
                'status' => 'success',
                'message' => "Transaction {$tx->reference} successfully approved and posted.",
                'transaction' => $tx->load(['fromAccount', 'toAccount', 'ledgerEntries']),
            ]);
        } catch (Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * Reject a high-value transaction.
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        $request->validate(['reason' => 'required|string|max:500']);
        $approval = Approval::with('transaction')->findOrFail($id);

        try {
            $tx = ApprovalService::reject($approval, $request->user(), $request->reason);

            return response()->json([
                'status' => 'success',
                'message' => "Transaction {$tx->reference} rejected.",
                'transaction' => $tx,
            ]);
        } catch (Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * View past approval decisions history.
     */
    public function history(): JsonResponse
    {
        $history = Approval::with([
            'transaction.fromAccount',
            'transaction.toAccount',
            'transaction.initiator',
            'approver'
        ])
            ->whereIn('status', ['approved', 'rejected'])
            ->orderBy('decided_at', 'desc')
            ->take(50)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $history,
        ]);
    }
}

