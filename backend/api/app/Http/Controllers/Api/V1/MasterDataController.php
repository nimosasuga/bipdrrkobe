<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\ForkliftModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MasterDataController extends Controller
{
    public function brands(): JsonResponse
    {
        $brands = Brand::query()
            ->where('active', true)
            ->whereHas('forkliftModels', fn ($query) => $query->where('active', true))
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        return response()->json([
            'success' => true,
            'data' => $brands,
        ]);
    }

    public function forkliftModels(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'brand_id' => ['required', 'uuid', 'exists:brands,id'],
        ]);

        $models = ForkliftModel::query()
            ->where('brand_id', $validated['brand_id'])
            ->where('active', true)
            ->orderBy('name')
            ->get([
                'id',
                'brand_id',
                'name',
                'model_code',
                'category',
                'capacity_kg',
                'battery_voltage',
                'battery_capacity_ah',
                'default_battery_type',
            ]);

        return response()->json([
            'success' => true,
            'data' => $models,
        ]);
    }
}
