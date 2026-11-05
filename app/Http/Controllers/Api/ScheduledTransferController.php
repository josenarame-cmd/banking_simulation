<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ScheduledTransfer;
use App\Services\ScheduledTransferService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScheduledTransferController extends Controller
{
    /**
     * Get scheduled transfers for authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $schedules = ScheduledTransfer::with(['fromAccount', 'toAccount', 'logs'])
            ->where('user_id', $request->user()->id)
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $schedules,
        ]);
    }

    /**
     * Admin/instructor list all scheduled transfers in system.
     */
    public function all(Request $request): JsonResponse
    {
        $schedules = ScheduledTransfer::with(['user', 'fromAccount', 'toAccount'])
            ->orderBy('id', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json($schedules);
    }

    /**
     * Create recurring transfer.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'from_account_id' => 'required|exists:bank_accounts,id',
            'to_account_id' => 'required|exists:bank_accounts,id',
            'amount' => 'required|numeric|min:0.01',
            'frequency' => 'required|in:daily,weekly,monthly',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'schedule_expression' => 'nullable|string|max:100',
        ]);

        try {
            $schedule = ScheduledTransferService::createSchedule(
                $request->user()->id,
                (int) $request->from_account_id,
                (int) $request->to_account_id,
                (float) $request->amount,
                $request->frequency,
                $request->start_date,
                $request->end_date,
                $request->schedule_expression
            );

            return response()->json([
                'status' => 'success',
                'message' => "Recurring {$schedule->frequency} transfer scheduled successfully.",
                'schedule' => $schedule->load(['fromAccount', 'toAccount']),
            ], 201);
        } catch (Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * Change status (suspend, activate, cancel).
     */
    public function toggleStatus(Request $request, int $id): JsonResponse
    {
        $request->validate(['status' => 'required|in:active,suspended,cancelled']);
        $schedule = ScheduledTransfer::findOrFail($id);
        $user = $request->user();

        if (!$user->isAdmin() && !$user->isInstructor() && $schedule->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $schedule->update(['status' => $request->status]);

        return response()->json([
            'status' => 'success',
            'message' => "Scheduled transfer is now {$request->status}.",
            'schedule' => $schedule,
        ]);
    }

    /**
     * Trigger execution of all due scheduled transfers now.
     */
    public function triggerNow(): JsonResponse
    {
        $result = ScheduledTransferService::processDueSchedules();

        return response()->json([
            'status' => 'success',
            'message' => "Executed: {$result['executed']}, Failed: {$result['failed']}.",
            'result' => $result,
        ]);
    }

    /**
     * View execution logs for a schedule.
     */
    public function logs(int $id): JsonResponse
    {
        $schedule = ScheduledTransfer::with('logs.transaction')->findOrFail($id);
        return response()->json([
            'status' => 'success',
            'logs' => $schedule->logs()->orderBy('execution_date', 'desc')->get(),
        ]);
    }
}

