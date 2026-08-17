<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Brand extends Model
{
    use HasUuids;

    protected $fillable = [
    'name',
    'slug',
    'active',
    'source',
    'source_ref',
    'source_updated_at',
    ];

    protected function casts(): array
{
    return [
        'active' => 'boolean',
        'source_updated_at' => 'datetime',
    ];
}

    public function forkliftModels(): HasMany
    {
        return $this->hasMany(ForkliftModel::class);
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
