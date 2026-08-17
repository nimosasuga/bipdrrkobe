<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChargerSpec extends Model
{
    use HasUuids;

    protected $fillable = [
        'brand_id',
        'forklift_model_id',
        'charger_code',
        'charger_type',
        'input_voltage',
        'output_voltage',
        'output_current_a',
        'compatible_battery_type',
        'notes',
        'source',
        'source_ref',
        'source_updated_at',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'input_voltage' => 'integer',
            'output_voltage' => 'integer',
            'output_current_a' => 'float',
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
