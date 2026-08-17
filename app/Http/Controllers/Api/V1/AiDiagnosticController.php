<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Diagnosis;
use App\Services\AiDiagnosticService;
use Illuminate\Http\JsonResponse;

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
public function analyze(
    Diagnosis $diagnosis,
    AiDiagnosticService $service
): JsonResponse {
    $result = $service->analyze($diagnosis);

    return response()->json([
        'success' => true,
        'health_score' => $diagnosis->health_score,
        'ai' => $result,
    ]);
}
}
