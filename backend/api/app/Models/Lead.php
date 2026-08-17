<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lead extends Model
{
    use HasUuids;

    protected $fillable = [
        'diagnosis_id',
        'nama',
        'perusahaan',
        'kota',
        'whatsapp',
        'jumlah_forklift',
        'model',
        'battery_type',
        'masalah_text',
        'jam_operasional',
        'health_score',
        'lead_score',
        'qualification_status',
        'qualification_version',
        'qualification_reason',
        'qualified_at',
        'qualification_error',
        'ai_summary',
        'session_id',
        'status',
        'source',
        'spreadsheet_sync_status',
        'spreadsheet_synced_at',
        'spreadsheet_sync_error',
    ];

    protected function casts(): array
    {
        return [
            'jumlah_forklift' => 'integer',
            'jam_operasional' => 'integer',
            'health_score' => 'integer',
            'qualified_at' => 'datetime',
            'spreadsheet_synced_at' => 'datetime',
        ];
    }

    public function diagnosis(): BelongsTo
    {
        return $this->belongsTo(Diagnosis::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class);
    }
}
