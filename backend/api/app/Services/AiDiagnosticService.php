<?php

namespace App\Services;

use App\Models\BatterySpec;
use App\Models\ChargerSpec;
use App\Models\Diagnosis;
use App\Models\DiagnosticRule;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class AiDiagnosticService
{
    public function buildContext(Diagnosis $diagnosis): array
    {
        $diagnosis->load('forkliftModel.brand');

        $model = $diagnosis->forkliftModel;
        $brand = $model?->brand;

        $batterySpecs = BatterySpec::query()
            ->where('active', true)
            ->where(function ($query) use ($model, $brand) {
                $query
                    ->where('forklift_model_id', $model?->id)
                    ->orWhere(function ($q) use ($brand) {
                        $q->whereNull('forklift_model_id')
                            ->where('brand_id', $brand?->id);
                    });
            })
            ->get();

        $chargerSpecs = ChargerSpec::query()
            ->where('active', true)
            ->where(function ($query) use ($model, $brand) {
                $query
                    ->where('forklift_model_id', $model?->id)
                    ->orWhere(function ($q) use ($brand) {
                        $q->whereNull('forklift_model_id')
                            ->where('brand_id', $brand?->id);
                    });
            })
            ->get();

        $rules = DiagnosticRule::query()
            ->where('active', true)
            ->where(function ($query) use ($model, $brand) {
                $query
                    ->where(function ($q) {
                        $q->whereNull('brand_id')
                            ->whereNull('forklift_model_id');
                    })
                    ->orWhere(function ($q) use ($brand) {
                        $q->where('brand_id', $brand?->id)
                            ->whereNull('forklift_model_id');
                    })
                    ->orWhere('forklift_model_id', $model?->id);
            })
            ->orderBy('priority')
            ->get();

        return [
            'diagnosis' => [
                'id' => $diagnosis->id,
                'session_id' => $diagnosis->session_id,
                'battery_type' => $diagnosis->battery_type,
                'umur_battery' => $diagnosis->umur_battery,
                'shift' => $diagnosis->shift,
                'jam_operasi' => $diagnosis->jam_operasi,
                'answers' => $diagnosis->answers_json,
                'health_score' => $diagnosis->health_score,
            ],

            'forklift' => [
                'brand' => $brand?->name,
                'model' => $model?->name,
                'model_code' => $model?->model_code,
                'category' => $model?->category,
                'capacity_kg' => $model?->capacity_kg,
                'battery_voltage' => $model?->battery_voltage,
                'battery_capacity_ah' => $model?->battery_capacity_ah,
            ],

            'battery_specs' => $batterySpecs->map(fn ($item) => [
                'battery_code' => $item->battery_code,
                'battery_type' => $item->battery_type,
                'voltage' => $item->voltage,
                'capacity_ah' => $item->capacity_ah,
                'cell_count' => $item->cell_count,
                'recommended_charge_hours' => $item->recommended_charge_hours,
            ])->values(),

            'charger_specs' => $chargerSpecs->map(fn ($item) => [
                'charger_code' => $item->charger_code,
                'charger_type' => $item->charger_type,
                'input_voltage' => $item->input_voltage,
                'output_voltage' => $item->output_voltage,
                'output_current_a' => $item->output_current_a,
                'compatible_battery_type' => $item->compatible_battery_type,
            ])->values(),

            'diagnostic_rules' => $rules->map(fn ($rule) => [
                'category' => $rule->category,
                'symptom_key' => $rule->symptom_key,
                'conditions' => $rule->conditions_json,
                'probable_cause' => $rule->probable_cause,
                'severity' => $rule->severity,
                'reason' => $rule->reason,
                'recommended_action' => $rule->recommended_action,
                'confidence_base' => $rule->confidence_base,
                'priority' => $rule->priority,
            ])->values(),
        ];
    }

    /**
     * Compact context used only for the n8n AI call.
     * The full buildContext() remains the source for API result/debug data.
     */
    public function buildAiContext(Diagnosis $diagnosis): array
    {
        $context = $this->buildContext($diagnosis);
        $answers = is_array($context['diagnosis']['answers'] ?? null)
            ? $context['diagnosis']['answers']
            : [];

        $observations = $this->normaliseAiObservations($answers);

        $issues = collect($answers['issues'] ?? [])
            ->filter(fn ($value) => is_string($value) && trim($value) !== '')
            ->map(fn ($value) => trim($value))
            ->take(10)
            ->values()
            ->all();

        $batterySpecs = collect($context['battery_specs'] ?? [])
            ->take(2)
            ->map(fn ($item) => [
                'type' => $item['battery_type'] ?? null,
                'voltage' => $item['voltage'] ?? null,
                'capacity_ah' => $item['capacity_ah'] ?? null,
                'cell_count' => $item['cell_count'] ?? null,
                'recommended_charge_hours' => $item['recommended_charge_hours'] ?? null,
            ])
            ->values()
            ->all();

        $chargerSpecs = collect($context['charger_specs'] ?? [])
            ->take(2)
            ->map(fn ($item) => [
                'type' => $item['charger_type'] ?? null,
                'output_voltage' => $item['output_voltage'] ?? null,
                'output_current_a' => $item['output_current_a'] ?? null,
                'compatible_battery_type' => $item['compatible_battery_type'] ?? null,
            ])
            ->values()
            ->all();

        $rules = collect($context['diagnostic_rules'] ?? [])
            ->filter(fn ($rule) => is_array($rule) && $this->ruleIsApplicable($rule, $answers, $context))
            ->take(6)
            ->map(fn ($rule) => array_filter([
                'symptom' => $rule['symptom_key'] ?? null,
                'conditions' => $rule['conditions'] ?? null,
                'cause' => $rule['probable_cause'] ?? null,
                'severity' => $rule['severity'] ?? null,
                'reason' => $rule['reason'] ?? null,
                'action' => $rule['recommended_action'] ?? null,
                'confidence' => $rule['confidence_base'] ?? null,
            ], fn ($value) => $value !== null && $value !== ''))
            ->values()
            ->all();

        return [
            'diagnosis' => [
                'health_score' => $context['diagnosis']['health_score'],
                'battery_type' => $context['diagnosis']['battery_type'],
                'age_years' => $context['diagnosis']['umur_battery'],
                'shift_per_day' => $context['diagnosis']['shift'],
                'operating_hours_per_day' => $context['diagnosis']['jam_operasi'],
            ],
            'forklift' => array_filter([
                'brand' => $context['forklift']['brand'] ?? null,
                'model' => $context['forklift']['model_code']
                    ?? $context['forklift']['model']
                    ?? null,
                'category' => $context['forklift']['category'] ?? null,
                'battery_voltage' => $context['forklift']['battery_voltage'] ?? null,
                'battery_capacity_ah' => $context['forklift']['battery_capacity_ah'] ?? null,
            ], fn ($value) => $value !== null && $value !== ''),
            'observations' => $observations,
            'issues' => $issues,
            'reference' => [
                'battery' => $batterySpecs,
                'charger' => $chargerSpecs,
                'rules' => $rules,
            ],
        ];
    }

    public function analyze(Diagnosis $diagnosis): array
    {
        $url = config('services.n8n.ai_diagnostic_url');

        if (!$url) {
            throw new RuntimeException(
                'N8N AI diagnostic URL is not configured.'
            );
        }

        $response = Http::asJson()
            ->acceptJson()
            ->connectTimeout(3)
            ->timeout(20)
            ->post($url, [
                'context' => $this->buildAiContext($diagnosis),
            ]);

        if ($response->failed()) {
            throw new RuntimeException(
                'AI diagnostic workflow failed with HTTP '
                . $response->status()
            );
        }

        $result = $response->json();

        if (!is_array($result)) {
            throw new RuntimeException(
                'AI diagnostic response is invalid.'
            );
        }

        $diagnosis->update([
            'ai_summary' => $result['summary'] ?? null,
            'ai_probable_causes' => $result['probable_causes'] ?? [],
            'ai_technical_findings' => $result['technical_findings'] ?? [],
            'ai_recommended_actions' => $result['recommended_actions'] ?? [],
            'ai_limitations' => $result['limitations'] ?? [],
            'ai_urgency' => $result['urgency'] ?? null,
            'ai_confidence' => isset($result['confidence'])
                ? (int) $result['confidence']
                : null,
            'ai_analyzed_at' => now(),
        ]);

        return $result;
    }

    private function normaliseAiObservations(array $answers): array
    {
        $maps = [
            'fast_drain_duration' => [
                'under_4' => 'battery_runtime_less_than_4_hours',
                'four_to_six' => 'battery_runtime_4_to_6_hours',
                'six_to_eight' => 'battery_runtime_6_to_8_hours',
                'over_eight' => 'battery_runtime_more_than_8_hours',
            ],
            'charging_duration' => [
                'under_6' => 'charging_duration_less_than_6_hours',
                'six_to_eight' => 'charging_duration_6_to_8_hours',
                'eight_to_ten' => 'charging_duration_8_to_10_hours',
                'over_ten' => 'charging_duration_more_than_10_hours',
            ],
            'watering_frequency' => [
                'never' => 'water_refill_never',
                'less_than_weekly' => 'water_refill_less_than_once_per_week',
                'once_weekly' => 'water_refill_once_per_week',
                'twice_weekly' => 'water_refill_twice_per_week',
                'more_than_twice' => 'water_refill_more_than_twice_per_week',
            ],
            'downtime_frequency' => [
                'never' => 'battery_or_charger_downtime_not_observed',
                'once_twice' => 'battery_or_charger_downtime_1_to_2_occurrences',
                'three_four' => 'battery_or_charger_downtime_3_to_4_occurrences',
                'five_plus' => 'battery_or_charger_downtime_5_or_more_occurrences',
            ],
            'charger_error_frequency' => [
                'never' => 'charger_error_not_observed',
                'once' => 'charger_error_observed_once',
                'repeated' => 'charger_error_observed_repeatedly',
            ],
            'hydraulic_when_low' => [
                'never' => 'hydraulic_slowdown_not_observed_when_battery_low',
                'sometimes' => 'hydraulic_slowdown_sometimes_when_battery_low',
                'often' => 'hydraulic_slowdown_often_when_battery_low',
            ],
        ];

        $observations = [];

        foreach ($maps as $key => $values) {
            $answer = $this->knownAnswer($answers[$key] ?? null);

            if ($answer !== null && isset($values[$answer])) {
                $observations[$key] = $values[$answer];
            }
        }

        return $observations;
    }

    private function ruleIsApplicable(array $rule, array $answers, array $context): bool
    {
        $conditions = $rule['conditions'] ?? [];

        if ($conditions === null || $conditions === []) {
            return true;
        }

        if (!is_array($conditions) || array_is_list($conditions)) {
            return false;
        }

        foreach ($conditions as $key => $expected) {
            if (!$this->conditionIsSatisfied((string) $key, $expected, $answers, $context)) {
                return false;
            }
        }

        return true;
    }

    private function conditionIsSatisfied(
        string $key,
        mixed $expected,
        array $answers,
        array $context
    ): bool {
        $diagnosis = $context['diagnosis'] ?? [];

        return match ($key) {
            'battery_type' => is_string($expected)
                && ($diagnosis['battery_type'] ?? null) === $expected,

            'charging_hours_min' => $this->rangeMeetsMinimum(
                $this->answerRange($answers['charging_duration'] ?? null, [
                    'under_6' => [0, 6],
                    'six_to_eight' => [6, 8],
                    'eight_to_ten' => [8, 10],
                    'over_ten' => [10, null],
                ]),
                $expected
            ),
            'charging_hours_max' => $this->rangeMeetsMaximum(
                $this->answerRange($answers['charging_duration'] ?? null, [
                    'under_6' => [0, 6],
                    'six_to_eight' => [6, 8],
                    'eight_to_ten' => [8, 10],
                    'over_ten' => [10, null],
                ]),
                $expected
            ),

            'runtime_hours_min', 'battery_runtime_hours_min' => $this->rangeMeetsMinimum(
                $this->answerRange($answers['fast_drain_duration'] ?? null, [
                    'under_4' => [0, 4],
                    'four_to_six' => [4, 6],
                    'six_to_eight' => [6, 8],
                    'over_eight' => [8, null],
                ]),
                $expected
            ),
            'runtime_hours_max', 'battery_runtime_hours_max' => $this->rangeMeetsMaximum(
                $this->answerRange($answers['fast_drain_duration'] ?? null, [
                    'under_4' => [0, 4],
                    'four_to_six' => [4, 6],
                    'six_to_eight' => [6, 8],
                    'over_eight' => [8, null],
                ]),
                $expected
            ),

            'watering_per_week_min' => $this->rangeMeetsMinimum(
                $this->answerRange($answers['watering_frequency'] ?? null, [
                    'never' => [0, 0],
                    'less_than_weekly' => [0, 1],
                    'once_weekly' => [1, 1],
                    'twice_weekly' => [2, 2],
                    'more_than_twice' => [3, null],
                ]),
                $expected
            ),
            'watering_per_week_max' => $this->rangeMeetsMaximum(
                $this->answerRange($answers['watering_frequency'] ?? null, [
                    'never' => [0, 0],
                    'less_than_weekly' => [0, 1],
                    'once_weekly' => [1, 1],
                    'twice_weekly' => [2, 2],
                    'more_than_twice' => [3, null],
                ]),
                $expected
            ),

            'downtime_occurrences_min' => $this->rangeMeetsMinimum(
                $this->answerRange($answers['downtime_frequency'] ?? null, [
                    'never' => [0, 0],
                    'once_twice' => [1, 2],
                    'three_four' => [3, 4],
                    'five_plus' => [5, null],
                ]),
                $expected
            ),
            'downtime_occurrences_max' => $this->rangeMeetsMaximum(
                $this->answerRange($answers['downtime_frequency'] ?? null, [
                    'never' => [0, 0],
                    'once_twice' => [1, 2],
                    'three_four' => [3, 4],
                    'five_plus' => [5, null],
                ]),
                $expected
            ),

            'age_years_min', 'battery_age_years_min' => $this->numberMeetsMinimum(
                $diagnosis['umur_battery'] ?? null,
                $expected
            ),
            'age_years_max', 'battery_age_years_max' => $this->numberMeetsMaximum(
                $diagnosis['umur_battery'] ?? null,
                $expected
            ),
            'shift_per_day_min', 'shift_min' => $this->numberMeetsMinimum(
                $diagnosis['shift'] ?? null,
                $expected
            ),
            'shift_per_day_max', 'shift_max' => $this->numberMeetsMaximum(
                $diagnosis['shift'] ?? null,
                $expected
            ),
            'operating_hours_per_day_min', 'operating_hours_min' => $this->numberMeetsMinimum(
                $diagnosis['jam_operasi'] ?? null,
                $expected
            ),
            'operating_hours_per_day_max', 'operating_hours_max' => $this->numberMeetsMaximum(
                $diagnosis['jam_operasi'] ?? null,
                $expected
            ),

            'cepat_habis', 'charging_lama', 'downtime', 'charger_error', 'hydraulic_lambat' =>
                is_bool($expected)
                && array_key_exists($key, $answers)
                && $answers[$key] === $expected,

            default => false,
        };
    }

    private function answerRange(mixed $answer, array $ranges): ?array
    {
        if (!is_string($answer) || $answer === 'unknown' || !isset($ranges[$answer])) {
            return null;
        }

        return $ranges[$answer];
    }

    private function rangeMeetsMinimum(?array $range, mixed $expected): bool
    {
        if ($range === null || !is_numeric($expected)) {
            return false;
        }

        return is_numeric($range[0] ?? null)
            && (float) $range[0] >= (float) $expected;
    }

    private function rangeMeetsMaximum(?array $range, mixed $expected): bool
    {
        if ($range === null || !is_numeric($expected)) {
            return false;
        }

        return is_numeric($range[1] ?? null)
            && (float) $range[1] <= (float) $expected;
    }

    private function numberMeetsMinimum(mixed $actual, mixed $expected): bool
    {
        return is_numeric($actual)
            && is_numeric($expected)
            && (float) $actual >= (float) $expected;
    }

    private function numberMeetsMaximum(mixed $actual, mixed $expected): bool
    {
        return is_numeric($actual)
            && is_numeric($expected)
            && (float) $actual <= (float) $expected;
    }

    private function knownAnswer(mixed $value): mixed
    {
        if ($value === null || $value === '' || $value === 'unknown') {
            return null;
        }

        return $value;
    }
}
