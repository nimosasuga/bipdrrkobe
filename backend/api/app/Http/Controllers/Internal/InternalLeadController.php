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
        'contacted',
        'assessment_scheduled',
        'proposal',
        'won',
        'lost',
    ];

    private const PRIORITIES = [
        'hot',
        'warm',
        'monitor',
        'pending',
    ];

    public function index(Request $request): View
    {
        $priority = strtolower(trim((string) $request->query('priority', '')));
        $status = strtolower(trim((string) $request->query('status', '')));
        $search = trim((string) $request->query('q', ''));

        if (! in_array($priority, self::PRIORITIES, true)) {
            $priority = '';
        }

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
            'qualification_status',
            'qualification_reason',
            'status',
            'created_at',
        ]);

        if ($priority !== '') {
            if ($priority === 'pending') {
                $query->where(function (Builder $builder): void {
                    $builder->whereNull('lead_score')
                        ->orWhereNotIn('lead_score', ['hot', 'warm', 'monitor']);
                });
            } else {
                $query->where('lead_score', $priority);
            }
        }

        if ($status !== '') {
            if ($status === 'new') {
                $query->where(function (Builder $builder): void {
                    $builder->whereNull('status')
                        ->orWhere('status', 'new')
                        ->orWhereNotIn('status', self::STATUSES);
                });
            } else {
                $query->where('status', $status);
            }
        }

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
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return view('internal.leads.index', [
            'user' => $request->user(),
            'leads' => $leads,
            'priority' => $priority,
            'status' => $status,
            'search' => $search,
            'priorities' => self::PRIORITIES,
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
            'statuses' => self::STATUSES,
        ]);
    }

    public function updateStatus(Request $request, Lead $lead): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:'.implode(',', self::STATUSES)],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $previousStatus = (string) ($lead->status ?: 'new');
        $nextStatus = (string) $validated['status'];
        $note = trim((string) ($validated['note'] ?? ''));

        if ($previousStatus === $nextStatus && $note === '') {
            return back()->with('status', 'Tidak ada perubahan yang disimpan.');
        }

        DB::transaction(function () use ($request, $lead, $previousStatus, $nextStatus, $note): void {
            $lead->status = $nextStatus;
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

        return back()->with('status', 'Status follow-up berhasil diperbarui.');
    }
}
