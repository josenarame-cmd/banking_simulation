<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Services\FraudMonitoringService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    /**
     * Audit trail list (Admin & Instructor).
     */
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::with('user');

        if ($request->has('action') && $request->action) {
            $query->where('action', 'like', "%{$request->action}%");
        }
        if ($request->has('user_id') && $request->user_id) {
            $query->where('user_id', $request->user_id);
        }
        if ($request->has('from_date') && $request->from_date) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }
        if ($request->has('to_date') && $request->to_date) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        $logs = $query->orderBy('id', 'desc')->paginate($request->get('per_page', 25));

        return response()->json($logs);
    }

    /**
     * Suspicious activity and fraud monitoring alerts.
     */
    public function securityAlerts(): JsonResponse
    {
        $alerts = FraudMonitoringService::getSecurityAlerts();

        return response()->json([
            'status' => 'success',
            'count' => count($alerts),
            'alerts' => $alerts,
        ]);
    }
}

