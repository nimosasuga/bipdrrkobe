<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DiagnosticRule extends Model
{
    use HasUuids;

    protected $fillable = [
        'brand_id',
        'forklift_model_id',
        'category',
        'symptom_key',
        'conditions_json',
        'probable_cause',
        'severity',
        'reason',
        'recommended_action',
        'confidence_base',
        'priority',
        'source',
        'source_ref',
        'source_updated_at',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'conditions_json' => 'array',
            'confidence_base' => 'integer',
            'priority' => 'integer',
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
