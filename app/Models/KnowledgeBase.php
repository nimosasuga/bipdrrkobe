<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class KnowledgeBase extends Model
{
    use HasUuids;

    protected $table = 'knowledge_base';

    protected $fillable = [
        'title',
        'category',
        'content',
        'video_url',
        'tags',
    ];

    protected function casts(): array
    {
        return [
            'tags' => 'array',
        ];
    }
}
