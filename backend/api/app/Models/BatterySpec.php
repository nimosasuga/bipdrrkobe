<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BatterySpec extends Model
{
    use HasUuids;

    protected $fillable = [
        'brand_id',
        'forklift_model_id',
        'battery_code',
        'battery_type',
        'voltage',
        'capacity_ah',
        'cell_count',
        'recommended_charge_hours',
        'connector_type',
        'notes',
        'source',
        'source_ref',
        'source_updated_at',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'voltage' => 'integer',
            'capacity_ah' => 'integer',
            'cell_count' => 'integer',
            'recommended_charge_hours' => 'float',
            'source_updated_at' => 'datetime',
            'active' => 'boolean',
        ];
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function forkliftModel(): BelongsTo
    {
        return $this->belongsTo(ForkliftModel::class);
    }
}
