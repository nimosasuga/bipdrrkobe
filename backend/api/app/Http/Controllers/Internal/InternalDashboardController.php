<?php

namespace App\Http\Controllers\Internal;

use App\Http\Controllers\Controller;
use App\Models\FunnelEvent;
use App\Models\Lead;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
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

        $validPriorities = ['hot', 'warm', 'monitor'];

        $leadPriority = [
            'hot' => Lead::query()->where('lead_score', 'hot')->count(),
            'warm' => Lead::query()->where('lead_score', 'warm')->count(),
            'monitor' => Lead::query()->where('lead_score', 'monitor')->count(),
            'pending' => Lead::query()
                ->where(function ($query) use ($validPriorities): void {
                    $query->whereNull('lead_score')
                        ->orWhereNotIn('lead_score', $validPriorities);
                })
                ->count(),
        ];

        $validSalesStatuses = [
            'new',
            'contacted',
            'assessment_scheduled',
            'proposal',
            'won',
            'lost',
        ];

        $salesPipeline = [
            'new' => Lead::query()
                ->where(function ($query) use ($validSalesStatuses): void {
                    $query->whereNull('status')
                        ->orWhere('status', 'new')
                        ->orWhereNotIn('status', $validSalesStatuses);
                })
                ->count(),
            'contacted' => Lead::query()->where('status', 'contacted')->count(),
            'assessment_scheduled' => Lead::query()->where('status', 'assessment_scheduled')->count(),
            'proposal' => Lead::query()->where('status', 'proposal')->count(),
            'won' => Lead::query()->where('status', 'won')->count(),
            'lost' => Lead::query()->where('status', 'lost')->count(),
        ];

        $openPipeline = (int) $salesPipeline['new']
            + (int) $salesPipeline['contacted']
            + (int) $salesPipeline['assessment_scheduled']
            + (int) $salesPipeline['proposal'];

        $closedPipeline = (int) $salesPipeline['won'] + (int) $salesPipeline['lost'];

        $jakartaNow = Carbon::now('Asia/Jakarta');
        $nowUtc = $jakartaNow->copy()->utc();
        $endTodayUtc = $jakartaNow->copy()->endOfDay()->utc();

        $openLeadBase = Lead::query()->where(function (Builder $query): void {
            $query->whereNull('status')
                ->orWhereNotIn('status', ['won', 'lost']);
        });

        $followUpControl = [
            'overdue' => (clone $openLeadBase)
                ->whereNotNull('next_follow_up_at')
                ->where('next_follow_up_at', '<', $nowUtc)
                ->count(),
            'today' => (clone $openLeadBase)
                ->whereNotNull('next_follow_up_at')
                ->where('next_follow_up_at', '>=', $nowUtc)
                ->where('next_follow_up_at', '<=', $endTodayUtc)
                ->count(),
            'unscheduled' => (clone $openLeadBase)
                ->whereNull('next_follow_up_at')
                ->count(),
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
                'status',
                'last_follow_up_at',
                'next_follow_up_at',
                'created_at',
            ])
            ->orderByRaw("CASE WHEN next_follow_up_at IS NOT NULL AND next_follow_up_at < NOW() AND COALESCE(status, 'new') NOT IN ('won','lost') THEN 0 ELSE 1 END")
            ->orderByRaw("CASE lead_score WHEN 'hot' THEN 1 WHEN 'warm' THEN 2 WHEN 'monitor' THEN 3 ELSE 4 END")
            ->latest('created_at')
            ->limit(10)
            ->get();

        return view('internal.dashboard', [
            'user' => $request->user(),
            'eventCounts' => $eventCounts,
            'totalLeads' => Lead::query()->count(),
            'leadPriority' => $leadPriority,
            'salesPipeline' => $salesPipeline,
            'openPipeline' => $openPipeline,
            'closedPipeline' => $closedPipeline,
            'followUpControl' => $followUpControl,
            'nowJakarta' => $jakartaNow,
            'wonRate' => $this->rate((int) $salesPipeline['won'], $closedPipeline),
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
