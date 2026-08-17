<?php

namespace App\Http\Controllers\Internal;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Lead;
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
