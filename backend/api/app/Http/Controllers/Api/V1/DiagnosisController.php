<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Diagnosis;
use App\Services\HealthScoreService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class DiagnosisController extends Controller
{
    public function store(
        Request $request,
        HealthScoreService $healthScoreService
    ): JsonResponse {
        $validated = $request->validate([
            'session_id' => ['required', 'string', 'max:255'],
            'model_id' => ['required', 'uuid', 'exists:forklift_models,id'],
            'battery_type' => ['required', 'in:lead_acid,lithium'],
            'umur' => ['required', 'integer', 'min:0', 'max:20'],
            'shift' => ['required', 'integer', 'min:1', 'max:3'],
            'jam_operasi' => ['required', 'integer', 'min:1', 'max:24'],

            'answers' => ['required', 'array'],
            'answers.cepat_habis' => ['required', 'boolean'],
            'answers.charging_lama' => ['required', 'boolean'],
            'answers.isi_air' => ['required', 'integer', 'min:0', 'max:7'],
            'answers.downtime' => ['required', 'boolean'],
        ]);

        $cacheKey = 'diagnosis:' . $validated['session_id'];

        if ($cached = Cache::get($cacheKey)) {
            return response()->json([
                'cached' => true,
                ...$cached,
            ]);
        }

        $scoreResult = $healthScoreService->calculate([
            'umur_battery' => $validated['umur'],
            'shift' => $validated['shift'],
            'battery_type' => $validated['battery_type'],
            'answers' => $validated['answers'],
        ]);

        $healthScore = $scoreResult['health_score'];
        $category = $scoreResult['category'];

        $causes = $this->generateMockCauses(
            $validated['umur'],
            $validated['answers']
        );

        $urgency = match (true) {
            $healthScore <= 40 => 'Kritis',
            $healthScore <= 65 => 'Tinggi',
            $healthScore <= 80 => 'Sedang',
            default => 'Rendah',
        };

        $recommendation = match (true) {
            $healthScore <= 40 => 'Assessment teknis segera direkomendasikan',
            $healthScore <= 65 => 'Upgrade layak dipertimbangkan',
            $healthScore <= 80 => 'Monitoring dan evaluasi kondisi battery',
            default => 'Kondisi battery relatif baik',
        };

        $confidence = $this->calculateConfidence($validated['answers']);

        $diagnosis = Diagnosis::create([
            'session_id' => $validated['session_id'],
            'model_id' => $validated['model_id'],
            'battery_type' => $validated['battery_type'],
            'umur_battery' => $validated['umur'],
            'shift' => $validated['shift'],
            'jam_operasi' => $validated['jam_operasi'],
            'answers_json' => $validated['answers'],
            'health_score' => $healthScore,
            'causes_json' => $causes,
            'confidence' => $confidence,
        ]);

        $response = [
            'diagnosis_id' => $diagnosis->id,
            'health_score' => $healthScore,
            'category' => $category,
            'urgency' => $urgency,
            'causes' => $causes,
            'confidence' => $confidence,
            'recommendation' => $recommendation,
            'next_action' => 'Hubungi Technical Sales DRRKOBE untuk assessment',
        ];

        Cache::put($cacheKey, $response, now()->addHour());

        return response()->json([
            'cached' => false,
            ...$response,
        ], 201);
    }

    private function generateMockCauses(int $umur, array $answers): array
    {
        $causes = [];

        if ($umur >= 3) {
            $causes[] = [
                'name' => 'Battery Aging',
                'prob' => min(95, 60 + ($umur * 5)),
            ];
        }

        if (!empty($answers['cepat_habis'])) {
            $causes[] = [
                'name' => 'Sulfation',
                'prob' => 72,
            ];
        }

        if (!empty($answers['charging_lama'])) {
            $causes[] = [
                'name' => 'Charging Habit',
                'prob' => 68,
            ];
        }

        if (!empty($answers['downtime'])) {
            $causes[] = [
                'name' => 'Cell Imbalance',
                'prob' => 64,
            ];
        }

        if (empty($causes)) {
            $causes[] = [
                'name' => 'Normal Operational Wear',
                'prob' => 35,
            ];
        }

        return $causes;
    }

    private function calculateConfidence(array $answers): int
    {
        $answeredSignals = collect([
            $answers['cepat_habis'] ?? null,
            $answers['charging_lama'] ?? null,
            $answers['isi_air'] ?? null,
            $answers['downtime'] ?? null,
        ])->filter(fn ($value) => $value !== null)->count();

        return min(95, 75 + ($answeredSignals * 5));
    }

public function result(
    Diagnosis $diagnosis,
    \App\Services\AiDiagnosticService $aiDiagnosticService
): JsonResponse {
    $context = $aiDiagnosticService->buildContext($diagnosis);

    $category = match (true) {
        $diagnosis->health_score <= 40 => 'Kritis',
        $diagnosis->health_score <= 65 => 'Buruk',
        $diagnosis->health_score <= 80 => 'Waspada',
        default => 'Baik',
    };

    return response()->json([
        'success' => true,

        'data' => [
            'diagnosis_id' => $diagnosis->id,
            'session_id' => $diagnosis->session_id,

            'health_score' => $diagnosis->health_score,
            'category' => $category,

            'battery_type' => $diagnosis->battery_type,
            'umur_battery' => $diagnosis->umur_battery,
            'shift' => $diagnosis->shift,
            'jam_operasi' => $diagnosis->jam_operasi,
            'answers' => $diagnosis->answers_json,

            'forklift' => $context['forklift'],

            'battery_specs' => $context['battery_specs'],
            'charger_specs' => $context['charger_specs'],

            'diagnostic_rules' => $context['diagnostic_rules'],

            'ai' => [
                'analyzed' => $diagnosis->ai_analyzed_at !== null,

                'summary' => $diagnosis->ai_summary,

                'probable_causes' =>
                    $diagnosis->ai_probable_causes ?? [],

                'technical_findings' =>
                    $diagnosis->ai_technical_findings ?? [],

                'recommended_actions' =>
                    $diagnosis->ai_recommended_actions ?? [],

                'limitations' =>
                    $diagnosis->ai_limitations ?? [],

                'urgency' => $diagnosis->ai_urgency,

                'confidence' => $diagnosis->ai_confidence,

                'analyzed_at' =>
                    $diagnosis->ai_analyzed_at?->toISOString(),
            ],

            'created_at' =>
                $diagnosis->created_at?->toISOString(),

            'updated_at' =>
                $diagnosis->updated_at?->toISOString(),
        ],
    ]);
}

}
