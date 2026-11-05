<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\Fee;
use App\Models\FeeType;
use App\Services\FeeService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FeeController extends Controller
{
    /**
     * List all fee types.
     */
    public function types(): JsonResponse
    {
        $types = FeeType::orderBy('id')->get();
        return response()->json(['status' => 'success', 'data' => $types]);
    }

    /**
     * Create new fee type.
     */
    public function createType(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'required|string|max:50|unique:fee_types',
            'amount' => 'required|numeric|min:0.01',
            'calculation_method' => 'required|in:fixed,percentage',
            'applicable_account_type' => 'required|string',
            'status' => 'required|in:active,inactive',
        ]);

        $type = FeeType::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Fee configuration created.',
            'data' => $type,
        ], 201);
    }

    /**
     * Apply fee to a specific account.
     */
    public function apply(Request $request): JsonResponse
    {
        $request->validate([
            'account_id' => 'required|exists:bank_accounts,id',
            'fee_type_id' => 'required|exists:fee_types,id',
            'description' => 'nullable|string|max:255',
        ]);

        $account = BankAccount::findOrFail($request->account_id);
        $feeType = FeeType::findOrFail($request->fee_type_id);

        try {
            $fee = FeeService::applyFee($account, $feeType, $request->description, $request->user()->id);

            return response()->json([
                'status' => 'success',
                'message' => "Fee of \${$fee->amount} applied to account {$account->account_number}.",
                'fee' => $fee->load(['account', 'transaction']),
            ], 201);
        } catch (Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * Run monthly checking maintenance cycle.
     */
    public function processMaintenance(Request $request): JsonResponse
    {
        try {
            $result = FeeService::processMonthlyMaintenance($request->user()->id);

            return response()->json([
                'status' => 'success',
                'message' => "Monthly maintenance fee run completed. Processed: {$result['processed']}, Total Collected: \${$result['total_collected']}.",
                'result' => $result,
            ]);
        } catch (Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * View fee history.
     */
    public function history(Request $request): JsonResponse
    {
        $query = Fee::with(['account.user', 'transaction']);

        if ($request->has('account_id') && $request->account_id) {
            $query->where('account_id', $request->account_id);
        }

        $fees = $query->orderBy('applied_at', 'desc')->paginate($request->get('per_page', 15));

        return response()->json($fees);
    }
}

