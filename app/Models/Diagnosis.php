<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Diagnosis extends Model
{
    use HasUuids;

    protected $fillable = [
        'session_id',
        'model_id',
        'battery_type',
        'umur_battery',
        'shift',
        'jam_operasi',
        'answers_json',
        'health_score',
        'causes_json',
        'confidence',
        'ai_summary',
        'ai_probable_causes',
        'ai_technical_findings',
        'ai_recommended_actions',
        'ai_limitations',
        'ai_urgency',
        'ai_confidence',
        'ai_analyzed_at',
    ];

    protected function casts(): array
    {
        return [
            'answers_json' => 'array',
            'causes_json' => 'array',
            'umur_battery' => 'integer',
            'shift' => 'integer',
            'jam_operasi' => 'integer',
            'health_score' => 'integer',
            'confidence' => 'integer',
'ai_probable_causes' => 'array', 'ai_technical_findings' => 'array', 'ai_recommended_actions' => 'array', 'ai_limitations' => 
'array', 'ai_confidence' => 'integer', 'ai_analyzed_at' => 'datetime',
        ];
    }

    public function forkliftModel(): BelongsTo
    {
        return $this->belongsTo(ForkliftModel::class, 'model_id');
    }

    public function impact(): HasOne
    {
        return $this->hasOne(Impact::class);
    }
}
