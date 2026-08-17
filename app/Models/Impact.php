<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Impact extends Model
{
    use HasUuids;

    protected $fillable = [
        'diagnosis_id',
        'downtime_hours_month',
        'charging_waste_hours',
        'maintenance_count_year',
        'productivity_loss_percent',
    ];

    protected function casts(): array
    {
        return [
            'downtime_hours_month' => 'float',
            'charging_waste_hours' => 'float',
            'maintenance_count_year' => 'integer',
            'productivity_loss_percent' => 'float',
        ];
    }

    public function diagnosis(): BelongsTo
    {
        return $this->belongsTo(Diagnosis::class);
    }
}
