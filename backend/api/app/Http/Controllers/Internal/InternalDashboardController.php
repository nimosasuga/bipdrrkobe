<?php

namespace App\Http\Controllers\Internal;

use App\Http\Controllers\Controller;
use App\Models\FunnelEvent;
use App\Models\Lead;
use Illuminate\Database\Eloquent\Builder;
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
            'bip_visited',
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

        $trafficSources = FunnelEvent::query()
            ->where('event', 'bip_visited')
            ->whereRaw("COALESCE(metadata_json->>'test', 'false') <> 'true'")
            ->selectRaw("COALESCE(NULLIF(metadata_json->>'utm_source', ''), 'direct') AS utm_source")
            ->selectRaw("COALESCE(NULLIF(metadata_json->>'utm_campaign', ''), 'direct') AS utm_campaign")
            ->selectRaw("COALESCE(metadata_json->>'utm_content', '') AS utm_content")
            ->selectRaw('COUNT(DISTINCT session_id) AS users')
            ->groupByRaw("COALESCE(NULLIF(metadata_json->>'utm_source', ''), 'direct'), COALESCE(NULLIF(metadata_json->>'utm_campaign', ''), 'direct'), COALESCE(metadata_json->>'utm_content', '')")
            ->orderByDesc('users')
            ->limit(10)
            ->get()
            ->map(function ($row): array {
                $source = (string) $row->utm_source;
                $campaign = (string) $row->utm_campaign;
                $content = (string) $row->utm_content;

                $baseEventQuery = function (string $event) use ($source, $campaign, $content): Builder {
                    return FunnelEvent::query()
                        ->where('event', $event)
                        ->whereRaw("COALESCE(metadata_json->>'test', 'false') <> 'true'")
                        ->whereRaw("COALESCE(NULLIF(metadata_json->>'utm_source', ''), 'direct') = ?", [$source])
                        ->whereRaw("COALESCE(NULLIF(metadata_json->>'utm_campaign', ''), 'direct') = ?", [$campaign])
                        ->whereRaw("COALESCE(metadata_json->>'utm_content', '') = ?", [$content]);
                };

                $assessmentStarted = $baseEventQuery('diagnosis_started')
                    ->distinct()
                    ->count('session_id');

                $leads = $baseEventQuery('lead_captured')
                    ->whereNotNull('lead_id')
                    ->distinct()
                    ->count('lead_id');

                $deals = $baseEventQuery('lead_captured')
                    ->whereNotNull('lead_id')
                    ->whereHas('lead', function (Builder $query): void {
                        $query->whereIn('status', self::DEAL_STATUSES);
                    })
                    ->distinct()
                    ->count('lead_id');

                return [
                    'source' => $source,
                    'campaign' => $campaign,
                    'content' => $content,
                    'users' => (int) $row->users,
                    'assessment_started' => $assessmentStarted,
                    'leads' => $leads,
                    'deals' => $deals,
                ];
            });

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
            'trafficSources' => $trafficSources,
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
