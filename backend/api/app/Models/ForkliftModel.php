<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ForkliftModel extends Model
{
    use HasUuids;

    protected $fillable = [
        'brand_id',
        'name',
        'type',
        'capacity',
        'model_code',
        'category',
        'capacity_kg',
        'battery_voltage',
        'battery_capacity_ah',
        'default_battery_type',
        'notes',
        'active',
	'source',
	'source_ref',
	'source_updated_at',
    ];

    protected function casts(): array
    {
        return [
            'capacity' => 'integer',
            'capacity_kg' => 'integer',
            'battery_voltage' => 'integer',
            'battery_capacity_ah' => 'integer',
            'active' => 'boolean',
	    'source_updated_at' => 'datetime',
        ];
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function diagnoses(): HasMany
    {
        return $this->hasMany(Diagnosis::class, 'model_id');
    }

public function batterySpecs(): HasMany
{
    return $this->hasMany(BatterySpec::class);
}

public function chargerSpecs(): HasMany
{
    return $this->hasMany(ChargerSpec::class);
}

public function diagnosticRules(): HasMany
{
    return $this->hasMany(DiagnosticRule::class);
}

}
