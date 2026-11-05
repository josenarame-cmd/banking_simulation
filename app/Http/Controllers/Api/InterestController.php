<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InterestCalculation;
use App\Models\InterestRate;
use App\Services\InterestService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InterestController extends Controller
{
    /**
     * List all active and historical interest rates.
     */
    public function rates(): JsonResponse
    {
        $rates = InterestRate::with('accountType')->orderBy('id', 'desc')->get();
        return response()->json(['status' => 'success', 'data' => $rates]);
    }

    /**
     * Set / update interest rate for an account type.
     */
    public function setRate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'account_type_id' => 'required|exists:account_types,id',
            'rate' => 'required|numeric|min:0|max:100',
            'effective_from' => 'required|date',
            'effective_to' => 'nullable|date|after_or_equal:effective_from',
        ]);

        $rate = InterestRate::create([
            'account_type_id' => $validated['account_type_id'],
            'rate' => $validated['rate'],
            'effective_from' => $validated['effective_from'],
            'effective_to' => $validated['effective_to'] ?? null,
            'status' => 'active',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Interest rate configured successfully.',
            'data' => $rate->load('accountType'),
        ], 201);
    }

    /**
     * Preview interest calculation across accounts.
     */
    public function preview(Request $request): JsonResponse
    {
        $period = $request->get('period', date('Y-m'));
        $preview = InterestService::preview($period);

        return response()->json([
            'status' => 'success',
            'preview' => $preview,
        ]);
    }

    /**
     * Execute monthly interest processing batch.
     */
    public function process(Request $request): JsonResponse
    {
        $request->validate(['period' => 'required|string']);

        try {
            $result = InterestService::processPeriod($request->period, $request->user()->id);

            return response()->json([
                'status' => 'success',
                'message' => "Successfully credited interest to {$result['accounts_processed']} accounts for period {$result['period']}.",
                'result' => $result,
            ]);
        } catch (Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * Historical interest calculations.
     */
    public function history(Request $request): JsonResponse
    {
        $query = InterestCalculation::with(['account.user', 'transaction']);

        if ($request->has('period') && $request->period) {
            $query->where('calculation_period', $request->period);
        }

        $records = $query->orderBy('processed_at', 'desc')->paginate($request->get('per_page', 15));

        return response()->json($records);
    }
}

