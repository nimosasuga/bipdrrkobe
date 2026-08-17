<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\BatterySpec;
use App\Models\Brand;
use App\Models\ChargerSpec;
use App\Models\DiagnosticRule;
use App\Models\ForkliftModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SyncController extends Controller
{
    private function authorizeSync(Request $request): ?JsonResponse
    {
        $expected = (string) config('services.n8n.sync_token');
        $provided = (string) $request->header('X-Sync-Token');

        if (
            $expected === '' ||
            $provided === '' ||
            ! hash_equals($expected, $provided)
        ) {
            return response()->json([
                'message' => 'Unauthorized sync request.',
            ], 401);
        }

        return null;
    }

    public function brands(Request $request): JsonResponse
    {
        if ($response = $this->authorizeSync($request)) {
            return $response;
        }

    $request->merge([
        'active' => filter_var(
            $request->input('active', true),
            FILTER_VALIDATE_BOOLEAN
        ),
    ]);


        $data = $request->validate([
            'source_ref' => ['required', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'active' => ['nullable', 'boolean'],
        ]);

        $brand = Brand::updateOrCreate(
            ['source_ref' => $data['source_ref']],
            [
                'name' => $data['name'],
                'slug' => $data['slug'] ?? Str::slug($data['name']),
                'active' => $data['active'] ?? true,
                'source' => 'google_sheets',
                'source_updated_at' => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'data' => $brand,
        ]);
    }

    public function forkliftModels(Request $request): JsonResponse
    {
        if ($response = $this->authorizeSync($request)) {
            return $response;
        }

        $data = $request->validate([
            'source_ref' => ['required', 'string', 'max:255'],

            'brand_source_ref' => [
                'required',
                'string',
                'exists:brands,source_ref'
            ],

            'name' => ['required', 'string', 'max:255'],
            'model_code' => ['nullable', 'string', 'max:255'],
            'type' => ['nullable', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:255'],

            'capacity_kg' => ['nullable', 'integer', 'min:0'],
            'battery_voltage' => ['nullable', 'integer', 'min:0'],
            'battery_capacity_ah' => ['nullable', 'integer', 'min:0'],

            'default_battery_type' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'active' => ['nullable', 'boolean'],
        ]);

        $brand = Brand::where(
            'source_ref',
            $data['brand_source_ref']
        )->firstOrFail();

        $model = ForkliftModel::updateOrCreate(
            ['source_ref' => $data['source_ref']],
            [
                'brand_id' => $brand->id,
                'name' => $data['name'],
                'model_code' => $data['model_code'] ?? null,
                'type' => $data['type'] ?? null,
                'category' => $data['category'] ?? null,
                'capacity_kg' => $data['capacity_kg'] ?? null,
                'battery_voltage' => $data['battery_voltage'] ?? null,
                'battery_capacity_ah' => $data['battery_capacity_ah'] ?? null,
                'default_battery_type' => $data['default_battery_type'] ?? null,
                'notes' => $data['notes'] ?? null,
                'active' => $data['active'] ?? true,
                'source' => 'google_sheets',
                'source_updated_at' => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'data' => $model->load('brand'),
        ]);
    }

    public function batteries(Request $request): JsonResponse
    {
        if ($response = $this->authorizeSync($request)) {
            return $response;
        }

        $data = $request->validate([
            'source_ref' => ['required', 'string', 'max:255'],

            'brand_source_ref' => [
                'nullable',
                'string',
                'exists:brands,source_ref'
            ],

            'model_source_ref' => [
                'nullable',
                'string',
                'exists:forklift_models,source_ref'
            ],

            'battery_code' => ['nullable', 'string', 'max:255'],
            'battery_type' => ['required', 'string', 'max:255'],
            'voltage' => ['nullable', 'integer'],
            'capacity_ah' => ['nullable', 'integer'],
            'cell_count' => ['nullable', 'integer'],
            'recommended_charge_hours' => ['nullable', 'numeric'],
            'connector_type' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'active' => ['nullable', 'boolean'],
        ]);

        $brand = !empty($data['brand_source_ref'])
            ? Brand::where('source_ref', $data['brand_source_ref'])->first()
            : null;

        $model = !empty($data['model_source_ref'])
            ? ForkliftModel::where('source_ref', $data['model_source_ref'])->first()
            : null;

        $battery = BatterySpec::updateOrCreate(
            ['source_ref' => $data['source_ref']],
            [
                'brand_id' => $brand?->id,
                'forklift_model_id' => $model?->id,
                'battery_code' => $data['battery_code'] ?? null,
                'battery_type' => $data['battery_type'],
                'voltage' => $data['voltage'] ?? null,
                'capacity_ah' => $data['capacity_ah'] ?? null,
                'cell_count' => $data['cell_count'] ?? null,
                'recommended_charge_hours' =>
                    $data['recommended_charge_hours'] ?? null,
                'connector_type' => $data['connector_type'] ?? null,
                'notes' => $data['notes'] ?? null,
                'active' => $data['active'] ?? true,
                'source' => 'google_sheets',
                'source_updated_at' => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'data' => $battery,
        ]);
    }

    public function chargers(Request $request): JsonResponse
    {
        if ($response = $this->authorizeSync($request)) {
            return $response;
        }

        $data = $request->validate([
            'source_ref' => ['required', 'string', 'max:255'],

            'brand_source_ref' => [
                'nullable',
                'string',
                'exists:brands,source_ref'
            ],

            'model_source_ref' => [
                'nullable',
                'string',
                'exists:forklift_models,source_ref'
            ],

            'charger_code' => ['nullable', 'string', 'max:255'],
            'charger_type' => ['nullable', 'string', 'max:255'],
            'input_voltage' => ['nullable', 'integer'],
            'output_voltage' => ['nullable', 'integer'],
            'output_current_a' => ['nullable', 'numeric'],
            'compatible_battery_type' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'active' => ['nullable', 'boolean'],
        ]);

        $brand = !empty($data['brand_source_ref'])
            ? Brand::where('source_ref', $data['brand_source_ref'])->first()
            : null;

        $model = !empty($data['model_source_ref'])
            ? ForkliftModel::where('source_ref', $data['model_source_ref'])->first()
            : null;

        $charger = ChargerSpec::updateOrCreate(
            ['source_ref' => $data['source_ref']],
            [
                'brand_id' => $brand?->id,
                'forklift_model_id' => $model?->id,
                'charger_code' => $data['charger_code'] ?? null,
                'charger_type' => $data['charger_type'] ?? null,
                'input_voltage' => $data['input_voltage'] ?? null,
                'output_voltage' => $data['output_voltage'] ?? null,
                'output_current_a' => $data['output_current_a'] ?? null,
                'compatible_battery_type' =>
                    $data['compatible_battery_type'] ?? null,
                'notes' => $data['notes'] ?? null,
                'active' => $data['active'] ?? true,
                'source' => 'google_sheets',
                'source_updated_at' => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'data' => $charger,
        ]);
    }

    public function diagnosticRules(Request $request): JsonResponse
    {
        if ($response = $this->authorizeSync($request)) {
            return $response;
        }

$brandRef = trim((string) $request->input('brand_source_ref', ''));
$modelRef = trim((string) $request->input('model_source_ref', ''));

$request->merge([
    'brand_source_ref' => in_array(
        strtolower($brandRef),
        ['', '(empty)', 'null', 'undefined'],
        true
    ) ? null : ltrim($brandRef, '='),

    'model_source_ref' => in_array(
        strtolower($modelRef),
        ['', '(empty)', 'null', 'undefined'],
        true
    ) ? null : ltrim($modelRef, '='),

    'active' => filter_var(
        $request->input('active', true),
        FILTER_VALIDATE_BOOLEAN
    ),
]);

        $data = $request->validate([
            'source_ref' => ['required', 'string', 'max:255'],

            'brand_source_ref' => [
                'nullable',
                'string',
                'exists:brands,source_ref'
            ],

            'model_source_ref' => [
                'nullable',
                'string',
                'exists:forklift_models,source_ref'
            ],

            'category' => ['required', 'string', 'max:255'],
            'symptom_key' => ['required', 'string', 'max:255'],
            'conditions_json' => ['nullable', 'array'],
            'probable_cause' => ['required', 'string', 'max:255'],

            'severity' => [
                'required',
                'in:low,medium,high,critical'
            ],

            'reason' => ['nullable', 'string'],
            'recommended_action' => ['nullable', 'string'],
            'confidence_base' => ['nullable', 'integer', 'min:0', 'max:100'],
            'priority' => ['nullable', 'integer', 'min:1'],
            'active' => ['nullable', 'boolean'],
        ]);

        $brand = !empty($data['brand_source_ref'])
            ? Brand::where('source_ref', $data['brand_source_ref'])->first()
            : null;

        $model = !empty($data['model_source_ref'])
            ? ForkliftModel::where('source_ref', $data['model_source_ref'])->first()
            : null;

        $rule = DiagnosticRule::updateOrCreate(
            ['source_ref' => $data['source_ref']],
            [
                'brand_id' => $brand?->id,
                'forklift_model_id' => $model?->id,
                'category' => $data['category'],
                'symptom_key' => $data['symptom_key'],
                'conditions_json' => $data['conditions_json'] ?? null,
                'probable_cause' => $data['probable_cause'],
                'severity' => $data['severity'],
                'reason' => $data['reason'] ?? null,
                'recommended_action' =>
                    $data['recommended_action'] ?? null,
                'confidence_base' => $data['confidence_base'] ?? 50,
                'priority' => $data['priority'] ?? 100,
                'active' => $data['active'] ?? true,
                'source' => 'google_sheets',
                'source_updated_at' => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'data' => $rule,
        ]);
    }
}
