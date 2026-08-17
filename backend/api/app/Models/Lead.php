<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lead extends Model
{
    use HasUuids;

    protected $fillable = [
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
        'ai_summary',
        'session_id',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'jumlah_forklift' => 'integer',
            'jam_operasional' => 'integer',
            'health_score' => 'integer',
        ];
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class);
    }
}
