<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Request;

class AuditLogService
{
    public static function log(
        string $action,
        ?string $description = null,
        ?string $entityType = null,
        ?int $entityId = null,
        ?array $newValues = null,
        ?int $userId = null
    ): AuditLog {
        $user = auth()->user();
        $finalUserId = $userId ?? ($user ? $user->id : null);

        return AuditLog::create([
            'user_id' => $finalUserId,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'ip_address' => Request::ip() ?? '127.0.0.1',
            'user_agent' => Request::userAgent() ?? 'System',
            'description' => $description,
            'new_values' => $newValues,
        ]);
    }
}

