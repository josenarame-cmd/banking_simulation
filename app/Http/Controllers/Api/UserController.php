<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditLogService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::with(['profile', 'accounts.accountType']);

        if ($request->has('role') && $request->role) {
            $query->where('role', $request->role);
        }
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }
        if ($request->has('search') && $request->search) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                    ->orWhere('email', 'like', "%{$s}%")
                    ->orWhere('phone', 'like', "%{$s}%");
            });
        }

        $users = $query->orderBy('id', 'desc')->paginate($request->get('per_page', 15));

        return response()->json($users);
    }

    public function show(int $id): JsonResponse
    {
        $user = User::with(['profile', 'accounts.accountType', 'loans', 'scheduledTransfers'])->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'user' => $user,
        ]);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:active,suspended,inactive',
            'reason' => 'nullable|string|max:255',
        ]);

        $user = User::findOrFail($id);
        $oldStatus = $user->status;
        $user->status = $request->status;
        $user->save();

        AuditLogService::log(
            'USER_STATUS_UPDATED',
            "User {$user->email} status changed from {$oldStatus} to {$user->status}. Reason: {$request->reason}",
            'User',
            $user->id,
            ['old' => $oldStatus, 'new' => $user->status],
            $request->user()->id
        );

        NotificationService::send(
            $user->id,
            'Account Status Update',
            "Your user account status is now {$user->status}." . ($request->reason ? " Reason: {$request->reason}" : ''),
            $user->status === 'active' ? 'success' : 'danger'
        );

        return response()->json([
            'status' => 'success',
            'message' => "User status updated to {$user->status}.",
            'user' => $user,
        ]);
    }
}

