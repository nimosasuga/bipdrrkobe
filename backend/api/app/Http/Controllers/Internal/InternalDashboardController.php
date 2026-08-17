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
    public function __invoke(Request $request): View
    {
        $eventNames = [
            'diagnosis_started',
            'diagnosis_completed',
            'step_8_viewed',
            'lead_captured',
            'report_downloaded',
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

        $started = (int) $eventCounts->get('diagnosis_started', 0);
        $leadCaptured = (int) $eventCounts->get('lead_captured', 0);
        $assessmentClicked = (int) $eventCounts->get('assessment_clicked', 0);

        $leadPriority = [
            'hot' => Lead::query()->where('lead_score', 'hot')->count(),
            'warm' => Lead::query()->where('lead_score', 'warm')->count(),
            'monitor' => Lead::query()->where('lead_score', 'monitor')->count(),
            'pending' => Lead::query()->whereNull('lead_score')->count(),
        ];

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
                'qualification_status',
                'qualification_reason',
                'created_at',
            ])
            ->orderByRaw("CASE lead_score WHEN 'hot' THEN 1 WHEN 'warm' THEN 2 WHEN 'monitor' THEN 3 ELSE 4 END")
            ->latest()
            ->limit(10)
            ->get();

        return view('internal.dashboard', [
            'user' => $request->user(),
            'eventCounts' => $eventCounts,
            'totalLeads' => Lead::query()->count(),
            'leadPriority' => $leadPriority,
            'startedToLeadRate' => $this->rate($leadCaptured, $started),
            'leadToAssessmentRate' => $this->rate($assessmentClicked, $leadCaptured),
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
