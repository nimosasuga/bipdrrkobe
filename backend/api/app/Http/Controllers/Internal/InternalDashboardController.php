<?php

namespace App\Http\Controllers\Internal;

use App\Http\Controllers\Controller;
use App\Models\FunnelEvent;
use App\Models\Lead;
use Illuminate\Http\Request;
use Illuminate\View\View;

class InternalDashboardController extends Controller
{
    private const FOLLOW_UP_STATUSES = [
        'follow_up',
        'contacted',
        'assessment_scheduled',
        'proposal',
    ];

    private const DEAL_STATUSES = [
        'deal',
        'won',
    ];

    public function __invoke(Request $request): View
    {
        $eventNames = [
            'diagnosis_started',
            'diagnosis_completed',
            'lead_captured',
            'assessment_clicked',
        ];

        $eventCounts = collect($eventNames)->mapWithKeys(function (string $event): array {
            $count = FunnelEvent::query()
                ->where('event', $event)
                ->whereRaw("COALESCE(metadata_json->>'test', 'false') <> 'true'")
                ->distinct()
                ->count('session_id');

            return [$event => $count];
        });

        $knownStatuses = [
            'new',
            ...self::FOLLOW_UP_STATUSES,
            ...self::DEAL_STATUSES,
            'lost',
        ];

        $salesStatus = [
            'new' => Lead::query()
                ->where(function ($query) use ($knownStatuses): void {
                    $query->whereNull('status')
                        ->orWhere('status', 'new')
                        ->orWhereNotIn('status', $knownStatuses);
                })
                ->count(),
            'follow_up' => Lead::query()->whereIn('status', self::FOLLOW_UP_STATUSES)->count(),
            'deal' => Lead::query()->whereIn('status', self::DEAL_STATUSES)->count(),
            'lost' => Lead::query()->where('status', 'lost')->count(),
        ];

        $totalLeads = Lead::query()->count();

        $recentLeads = Lead::query()
            ->select([
                'id',
                'perusahaan',
                'kota',
                'nama',
                'whatsapp',
                'model',
                'jumlah_forklift',
                'health_score',
                'lead_score',
                'status',
                'created_at',
            ])
            ->orderByRaw("CASE lead_score WHEN 'hot' THEN 1 WHEN 'warm' THEN 2 WHEN 'monitor' THEN 3 ELSE 4 END")
            ->latest('created_at')
            ->limit(10)
            ->get();

        return view('internal.dashboard', [
            'user' => $request->user(),
            'eventCounts' => $eventCounts,
            'totalLeads' => $totalLeads,
            'salesStatus' => $salesStatus,
            'dealRate' => $this->rate((int) $salesStatus['deal'], $totalLeads),
            'recentLeads' => $recentLeads,
        ]);
    }

    private function rate(int $numerator, int $denominator): float
    {
        if ($denominator <= 0) {
            return 0;
        }

        return round(($numerator / $denominator) * 100, 1);
    }
}
