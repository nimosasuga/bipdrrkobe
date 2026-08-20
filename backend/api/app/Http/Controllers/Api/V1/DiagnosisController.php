<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Diagnosis;
use App\Services\AiDiagnosticService;
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
            'answers.industry_sector' => ['required', 'in:food_beverage,pharma_medical_cosmetics,logistics_3pl_ecommerce,cold_storage,electronics_automotive,textile_office_paper,retail_wholesale'],
            'answers.cepat_habis' => ['sometimes', 'nullable', 'boolean'],
            'answers.charging_lama' => ['sometimes', 'nullable', 'boolean'],
            'answers.isi_air' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:7'],
            'answers.downtime' => ['sometimes', 'nullable', 'boolean'],
            'answers.hydraulic_lambat' => ['sometimes', 'nullable', 'boolean'],

            'answers.fast_drain_duration' => ['sometimes', 'nullable', 'in:under_4,four_to_six,six_to_eight,over_eight,unknown'],
            'answers.charging_duration' => ['sometimes', 'nullable', 'in:under_6,six_to_eight,eight_to_ten,over_ten,unknown'],
            'answers.watering_frequency' => ['sometimes', 'nullable', 'in:never,less_than_weekly,once_weekly,twice_weekly,more_than_twice,unknown'],
            'answers.downtime_frequency' => ['sometimes', 'nullable', 'in:never,once_twice,three_four,five_plus,unknown'],
            'answers.hydraulic_when_low' => ['sometimes', 'nullable', 'in:never,sometimes,often,unknown'],

            'answers.issues' => ['sometimes', 'array', 'max:10'],
            'answers.issues.*' => ['string', 'max:120'],
        ]);

        $validated['answers'] = $this->normalizeOperationalAnswers($validated['answers']);

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
            $healthScore <= 40 => 'Technical Assessment Lithium-ion perlu diprioritaskan sebelum proposal dan harga final',
            $healthScore <= 65 => 'Technical Assessment direkomendasikan sebelum keputusan perubahan teknologi',
            $healthScore <= 80 => 'Pantau kondisi battery dan lakukan Technical Assessment bila gejala meningkat',
            default => 'Kondisi battery relatif baik berdasarkan data yang tersedia',
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
            'next_action' => 'Lanjutkan ke Technical Assessment DRRKOBE sebelum proposal teknis dan penawaran harga final',
        ];

        Cache::put($cacheKey, $response, now()->addHour());

        return response()->json([
            'cached' => false,
            ...$response,
        ], 201);
    }

    private function normalizeOperationalAnswers(array $answers): array
    {
        // Charger fault/error bukan bagian dari scope diagnosis BIP.
        // Charging duration tetap dipertahankan karena penting untuk charging window
        // dan evaluasi kompatibilitas pada Technical Assessment.
        unset($answers['charger_error'], $answers['charger_error_frequency']);

        if (array_key_exists('fast_drain_duration', $answers)) {
            $answers['cepat_habis'] = match ($answers['fast_drain_duration']) {
                'under_4' => true,
                'four_to_six', 'six_to_eight', 'over_eight' => false,
                default => null,
            };
        }

        if (array_key_exists('charging_duration', $answers)) {
            $answers['charging_lama'] = match ($answers['charging_duration']) {
                'eight_to_ten', 'over_ten' => true,
                'under_6', 'six_to_eight' => false,
                default => null,
            };
        }

        if (array_key_exists('watering_frequency', $answers)) {
            $answers['isi_air'] = match ($answers['watering_frequency']) {
                'never', 'less_than_weekly' => 0,
                'once_weekly' => 1,
                'twice_weekly' => 2,
                'more_than_twice' => 3,
                default => null,
            };
        }

        if (array_key_exists('downtime_frequency', $answers)) {
            $answers['downtime'] = match ($answers['downtime_frequency']) {
                'three_four', 'five_plus' => true,
                'never', 'once_twice' => false,
                default => null,
            };
        }

        if (array_key_exists('hydraulic_when_low', $answers)) {
            $answers['hydraulic_lambat'] = match ($answers['hydraulic_when_low']) {
                'sometimes', 'often' => true,
                'never' => false,
                default => null,
            };
        }

        if (isset($answers['issues']) && is_array($answers['issues'])) {
            $answers['issues'] = collect($answers['issues'])
                ->filter(fn ($issue) => is_string($issue) && trim($issue) !== '')
                ->map(function (string $issue): string {
                    $clean = trim($issue);
                    $clean = str_ireplace(
                        'Pengisian Battery Terlalu Lama / Charger Bermasalah',
                        'Pengisian Battery Terlalu Lama',
                        $clean
                    );
                    $clean = str_ireplace(
                        'Forklift Sering Berhenti Karena Battery / Charger',
                        'Forklift Sering Berhenti Karena Battery / Proses Pengisian',
                        $clean
                    );

                    return $clean;
                })
                ->reject(fn (string $issue) => preg_match('/charger\s*(error|bermasalah|gangguan)|kode\s+gangguan\s+charger/i', $issue) === 1)
                ->unique()
                ->take(10)
                ->values()
                ->all();
        }

        return $answers;
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

        if (($answers['cepat_habis'] ?? null) === true) {
            $causes[] = [
                'name' => 'Sulfation',
                'prob' => 72,
            ];
        }

        if (($answers['charging_lama'] ?? null) === true) {
            $causes[] = [
                'name' => 'Charging Habit',
                'prob' => 68,
            ];
        }

        if (($answers['downtime'] ?? null) === true || ($answers['hydraulic_lambat'] ?? null) === true) {
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
            $answers['hydraulic_lambat'] ?? null,
        ])->filter(fn ($value) => $value !== null)->count();

        $issueBonus = min(8, count($answers['issues'] ?? []));

        return min(95, 65 + ($answeredSignals * 4) + $issueBonus);
    }

    public function result(
        Diagnosis $diagnosis,
        AiDiagnosticService $aiDiagnosticService
    ): JsonResponse {
        $context = $aiDiagnosticService->buildContext($diagnosis);
        $publicAnswers = $this->normalizeOperationalAnswers($diagnosis->answers_json ?? []);

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
                'answers' => $publicAnswers,
                'forklift' => $context['forklift'],
                'battery_specs' => $context['battery_specs'],
                // Charger tetap tersedia hanya sebagai referensi kompatibilitas teknis,
                // bukan sebagai objek diagnosis fault/error BIP.
                'charger_specs' => $context['charger_specs'],
                'diagnostic_rules' => $context['diagnostic_rules'],
                'ai' => [
                    'analyzed' => $diagnosis->ai_analyzed_at !== null,
                    'summary' => $diagnosis->ai_summary,
                    'probable_causes' => $diagnosis->ai_probable_causes ?? [],
                    'technical_findings' => $diagnosis->ai_technical_findings ?? [],
                    'recommended_actions' => $diagnosis->ai_recommended_actions ?? [],
                    'limitations' => $diagnosis->ai_limitations ?? [],
                    'urgency' => $diagnosis->ai_urgency,
                    'confidence' => $diagnosis->ai_confidence,
                    'analyzed_at' => $diagnosis->ai_analyzed_at?->toISOString(),
                ],
                'created_at' => $diagnosis->created_at?->toISOString(),
                'updated_at' => $diagnosis->updated_at?->toISOString(),
            ],
        ]);
    }
}
