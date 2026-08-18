<?php

namespace App\Http\Controllers\Internal;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Lead;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class InternalLeadController extends Controller
{
    private const STATUSES = [
        'new',
        'follow_up',
        'deal',
        'lost',
    ];

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

    public function index(Request $request): View
    {
        $status = strtolower(trim((string) $request->query('status', '')));
        $search = trim((string) $request->query('q', ''));

        if (! in_array($status, self::STATUSES, true)) {
            $status = '';
        }

        if (mb_strlen($search) > 120) {
            $search = mb_substr($search, 0, 120);
        }

        $query = Lead::query()->select([
            'id',
            'perusahaan',
            'kota',
            'nama',
            'whatsapp',
            'model',
            'battery_type',
            'jumlah_forklift',
            'health_score',
            'lead_score',
            'status',
            'created_at',
        ]);

        $this->applyStatusFilter($query, $status);

        if ($search !== '') {
            $needle = '%'.str_replace(['%', '_'], ['\\%', '\\_'], $search).'%';

            $query->where(function (Builder $builder) use ($needle): void {
                $builder->where('perusahaan', 'ilike', $needle)
                    ->orWhere('kota', 'ilike', $needle)
                    ->orWhere('nama', 'ilike', $needle)
                    ->orWhere('whatsapp', 'ilike', $needle)
                    ->orWhere('model', 'ilike', $needle);
            });
        }

        $leads = $query
            ->orderByRaw("CASE lead_score WHEN 'hot' THEN 1 WHEN 'warm' THEN 2 WHEN 'monitor' THEN 3 ELSE 4 END")
            ->latest('created_at')
            ->paginate(20)
            ->withQueryString();

        return view('internal.leads.index', [
            'user' => $request->user(),
            'leads' => $leads,
            'status' => $status,
            'search' => $search,
            'statuses' => self::STATUSES,
        ]);
    }

    public function show(Request $request, Lead $lead): View
    {
        $lead->load([
            'diagnosis.forkliftModel.brand',
            'activities' => fn ($query) => $query->latest()->limit(30),
        ]);

        $priority = in_array($lead->lead_score, ['hot', 'warm', 'monitor'], true)
            ? $lead->lead_score
            : 'pending';

        return view('internal.leads.show', [
            'user' => $request->user(),
            'lead' => $lead,
            'priority' => $priority,
            'currentStatus' => $this->normalizeStatus($lead->status),
            'statuses' => self::STATUSES,
        ]);
    }

    public function updateStatus(Request $request, Lead $lead): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:'.implode(',', self::STATUSES)],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $previousRawStatus = (string) ($lead->status ?: 'new');
        $previousStatus = $this->normalizeStatus($lead->status);
        $nextStatus = (string) $validated['status'];
        $note = trim((string) ($validated['note'] ?? ''));

        if ($previousRawStatus === $nextStatus && $note === '') {
            return back()->with('status', 'Tidak ada perubahan yang disimpan.');
        }

        DB::transaction(function () use (
            $request,
            $lead,
            $previousStatus,
            $nextStatus,
            $note
        ): void {
            $lead->status = $nextStatus;
            $lead->last_follow_up_at = now();

            if (in_array($nextStatus, ['deal', 'lost'], true)) {
                $lead->next_follow_up_at = null;
            }

            $lead->save();

            Activity::query()->create([
                'lead_id' => $lead->id,
                'event' => 'sales_status_updated',
                'metadata_json' => [
                    'from' => $previousStatus,
                    'to' => $nextStatus,
                    'note' => $note !== '' ? $note : null,
                    'user_id' => $request->user()?->id,
                    'user_name' => $request->user()?->name,
                    'user_role' => $request->user()?->role,
                ],
            ]);
        });

        return back()->with('status', 'Status lead berhasil diperbarui.');
    }

    private function applyStatusFilter(Builder $query, string $status): void
    {
        if ($status === '') {
            return;
        }

        if ($status === 'follow_up') {
            $query->whereIn('status', self::FOLLOW_UP_STATUSES);

            return;
        }

        if ($status === 'deal') {
            $query->whereIn('status', self::DEAL_STATUSES);

            return;
        }

        if ($status === 'lost') {
            $query->where('status', 'lost');

            return;
        }

        $knownStatuses = [
            'new',
            ...self::FOLLOW_UP_STATUSES,
            ...self::DEAL_STATUSES,
            'lost',
        ];

        $query->where(function (Builder $builder) use ($knownStatuses): void {
            $builder->whereNull('status')
                ->orWhere('status', 'new')
                ->orWhereNotIn('status', $knownStatuses);
        });
    }

    private function normalizeStatus(?string $status): string
    {
        if (in_array($status, self::FOLLOW_UP_STATUSES, true)) {
            return 'follow_up';
        }

        if (in_array($status, self::DEAL_STATUSES, true)) {
            return 'deal';
        }

        if ($status === 'lost') {
            return 'lost';
        }

        return 'new';
    }
}
