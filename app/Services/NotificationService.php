<?php

namespace App\Services;

use App\Models\Notification;

class NotificationService
{
    public static function send(
        int $userId,
        string $title,
        string $message,
        string $type = 'info',
        ?array $metadata = null
    ): Notification {
        return Notification::create([
            'user_id' => $userId,
            'title' => $title,
            'message' => $message,
            'notification_type' => $type,
            'is_read' => false,
            'metadata' => $metadata,
        ]);
    }
}

