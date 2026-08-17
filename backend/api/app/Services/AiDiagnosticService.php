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
public function analyze(Diagnosis $diagnosis): array
{
    $context = $this->buildContext($diagnosis);

    $url = config('services.n8n.ai_diagnostic_url');

    if (!$url) {
        throw new RuntimeException(
            'N8N AI diagnostic URL is not configured.'
        );
    }

    $response = Http::timeout(60)
    ->acceptJson()
    ->post($url, [
        'context' => $context,
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

    'ai_probable_causes' =>
        $result['probable_causes'] ?? [],

    'ai_technical_findings' =>
        $result['technical_findings'] ?? [],

    'ai_recommended_actions' =>
        $result['recommended_actions'] ?? [],

    'ai_limitations' =>
        $result['limitations'] ?? [],

    'ai_urgency' =>
        $result['urgency'] ?? null,

    'ai_confidence' =>
        isset($result['confidence'])
            ? (int) $result['confidence']
            : null,

    'ai_analyzed_at' => now(),
]);

    return $result;
}
}
