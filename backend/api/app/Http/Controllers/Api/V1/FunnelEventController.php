<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\FunnelEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FunnelEventController extends Controller
{
    private const EVENTS = [
        'bip_visited',
        'diagnosis_started',
        'model_selected',
        'diagnosis_completed',
        'step_5_viewed',
        'step_7_viewed',
        'step_8_viewed',
        'report_downloaded',
        'assessment_clicked',
        'lead_captured',
    ];

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'event_key' => ['required', 'uuid'],
            'session_id' => ['required', 'string', 'max:100'],
            'diagnosis_id' => ['nullable', 'uuid', 'exists:diagnoses,id'],
            'lead_id' => ['nullable', 'uuid', 'exists:leads,id'],
            'event' => ['required', 'string', 'in:'.implode(',', self::EVENTS)],
            'source' => ['nullable', 'string', 'max:50'],
            'metadata' => ['nullable', 'array'],
        ]);

        $event = FunnelEvent::query()->firstOrCreate(
            ['event_key' => $validated['event_key']],
            [
                'session_id' => $validated['session_id'],
                'diagnosis_id' => $validated['diagnosis_id'] ?? null,
                'lead_id' => $validated['lead_id'] ?? null,
                'event' => $validated['event'],
                'source' => $validated['source'] ?? 'bip',
                'metadata_json' => $validated['metadata'] ?? null,
            ]
        );

        return response()->json([
            'success' => true,
            'event_id' => $event->id,
            'event' => $event->event,
        ], $event->wasRecentlyCreated ? 201 : 200);
    }
}
