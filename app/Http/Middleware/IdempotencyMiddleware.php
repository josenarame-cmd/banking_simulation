<?php

namespace App\Http\Middleware;

use App\Models\IdempotencyKey;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IdempotencyMiddleware
{
    public function handle(Request $request, Closure $next, string $operationType = 'transaction'): Response
    {
        $key = $request->header('X-Idempotency-Key');

        if (!$key) {
            // Idempotency key not supplied, proceed standard
            return $next($request);
        }

        $user = $request->user();
        if (!$user) {
            return $next($request);
        }

        // Check if idempotency key was previously processed
        $existing = IdempotencyKey::where('user_id', $user->id)
            ->where('idempotency_key', $key)
            ->where('operation_type', $operationType)
            ->first();

        if ($existing) {
            if ($existing->status === 'completed' && $existing->response_body) {
                return response()->json($existing->response_body, 200, [
                    'X-Idempotency-Replayed' => 'true',
                ]);
            }

            if ($existing->status === 'processing') {
                return response()->json([
                    'message' => 'A request with this idempotency key is currently processing. Please wait.',
                ], 409);
            }
        }

        // Record key as processing
        $record = IdempotencyKey::create([
            'user_id' => $user->id,
            'idempotency_key' => $key,
            'operation_type' => $operationType,
            'status' => 'processing',
        ]);

        $response = $next($request);

        if ($response->isSuccessful()) {
            $record->update([
                'status' => 'completed',
                'response_body' => json_decode($response->getContent(), true),
            ]);
        } else {
            $record->update([
                'status' => 'failed',
            ]);
        }

        return $response;
    }
}

