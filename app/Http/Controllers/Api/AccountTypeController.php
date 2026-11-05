<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AccountType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountTypeController extends Controller
{
    public function index(): JsonResponse
    {
        $types = AccountType::orderBy('id')->get();
        return response()->json(['status' => 'success', 'data' => $types]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'required|string|max:50|unique:account_types',
            'description' => 'nullable|string',
            'minimum_balance' => 'required|numeric|min:0',
            'interest_rate' => 'required|numeric|min:0',
            'withdrawal_limit' => 'nullable|numeric|min:0',
            'lock_period_days' => 'nullable|integer|min:0',
            'maintenance_fee' => 'required|numeric|min:0',
            'status' => 'required|in:active,inactive',
        ]);

        $type = AccountType::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Account type created successfully.',
            'data' => $type,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $type = AccountType::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'description' => 'nullable|string',
            'minimum_balance' => 'sometimes|numeric|min:0',
            'interest_rate' => 'sometimes|numeric|min:0',
            'withdrawal_limit' => 'nullable|numeric|min:0',
            'lock_period_days' => 'nullable|integer|min:0',
            'maintenance_fee' => 'sometimes|numeric|min:0',
            'status' => 'sometimes|in:active,inactive',
        ]);

        $type->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Account type updated successfully.',
            'data' => $type,
        ]);
    }
}

