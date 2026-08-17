<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Diagnosis;
use App\Services\AiDiagnosticService;
use Illuminate\Http\JsonResponse;
use Throwable;

class AiDiagnosticController extends Controller
{
    public function context(
        Diagnosis $diagnosis,
        AiDiagnosticService $service
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'data' => $service->buildContext($diagnosis),
        ]);
    }

    public function status(
        Diagnosis $diagnosis,
        AiDiagnosticService $service
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'health_score' => $diagnosis->health_score,
            'ai' => $service->statusPayload($diagnosis),
        ]);
    }

    public function analyze(
        Diagnosis $diagnosis,
        AiDiagnosticService $service
    ): JsonResponse {
        try {
            $result = $service->analyze($diagnosis);
            $diagnosis->refresh();

            return response()->json([
                'success' => true,
                'health_score' => $diagnosis->health_score,
                'ai_status' => $diagnosis->ai_status,
                'ai' => $result,
            ]);
        } catch (Throwable $exception) {
            report($exception);
            $diagnosis->refresh();
            $status = $service->statusPayload($diagnosis);

            return response()->json([
                'success' => false,
                'health_score' => $diagnosis->health_score,
                'ai_status' => $status['status'],
                'retryable' => $status['retryable'],
                'message' => $status['message'],
            ], 202);
        }
    }
}
