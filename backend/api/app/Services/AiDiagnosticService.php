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

        $observations = array_filter([
            'fast_drain_duration' => $this->knownAnswer($answers['fast_drain_duration'] ?? null),
            'charging_duration' => $this->knownAnswer($answers['charging_duration'] ?? null),
            'watering_frequency' => $this->knownAnswer($answers['watering_frequency'] ?? null),
            'downtime_frequency' => $this->knownAnswer($answers['downtime_frequency'] ?? null),
            'charger_error_frequency' => $this->knownAnswer($answers['charger_error_frequency'] ?? null),
            'hydraulic_when_low' => $this->knownAnswer($answers['hydraulic_when_low'] ?? null),
        ], fn ($value) => $value !== null);

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

    private function knownAnswer(mixed $value): mixed
    {
        if ($value === null || $value === '' || $value === 'unknown') {
            return null;
        }

        return $value;
    }
}
