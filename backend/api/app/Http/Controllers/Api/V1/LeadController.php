<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Diagnosis;
use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Throwable;

class LeadController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'diagnosis_id' => ['required', 'uuid', 'exists:diagnoses,id'],
            'perusahaan' => ['required', 'string', 'max:150'],
            'lokasi' => ['required', 'string', 'max:150'],
            'nama' => ['required', 'string', 'max:120'],
            'whatsapp' => ['required', 'string', 'max:30'],
            'jumlah_forklift' => ['nullable', 'integer', 'min:1', 'max:500'],
            'source' => ['nullable', 'string', 'max:50'],
        ]);

        $diagnosis = Diagnosis::query()
            ->with('forkliftModel.brand')
            ->findOrFail($validated['diagnosis_id']);

        $whatsapp = $this->normaliseWhatsapp($validated['whatsapp']);

        if ($whatsapp === null) {
            return response()->json([
                'success' => false,
                'message' => 'Nomor WhatsApp tidak valid. Gunakan format 08xx atau 62xx.',
            ], 422);
        }

        $answers = is_array($diagnosis->answers_json) ? $diagnosis->answers_json : [];
        $issues = collect($answers['issues'] ?? [])
            ->filter(fn ($item) => is_string($item) && trim($item) !== '')
            ->map(fn ($item) => trim($item))
            ->values()
            ->all();

        $model = $diagnosis->forkliftModel;

        $lead = Lead::query()->updateOrCreate(
            ['diagnosis_id' => $diagnosis->id],
            [
                'nama' => trim($validated['nama']),
                'perusahaan' => trim($validated['perusahaan']),
                'kota' => trim($validated['lokasi']),
                'whatsapp' => $whatsapp,
                'jumlah_forklift' => (int) ($validated['jumlah_forklift'] ?? 1),
                'model' => $model?->model_code ?: ($model?->name ?: '-'),
                'battery_type' => $diagnosis->battery_type,
                'masalah_text' => $issues !== [] ? implode(' | ', $issues) : null,
                'jam_operasional' => $diagnosis->jam_operasi,
                'health_score' => $diagnosis->health_score,
                'ai_summary' => $diagnosis->ai_summary,
                'session_id' => $diagnosis->session_id,
                'status' => 'new',
                'source' => trim($validated['source'] ?? 'bip'),
            ]
        );

        $sheetStatus = $this->syncToSpreadsheet($lead, $diagnosis, $issues);

        if ($lead->qualification_status !== 'qualified') {
            $this->triggerQualification($lead, $diagnosis, $answers, $issues);
        }

        $lead->refresh();

        return response()->json([
            'success' => true,
            'lead_id' => $lead->id,
            'diagnosis_id' => $diagnosis->id,
            'spreadsheet_sync_status' => $sheetStatus,
            'message' => 'Data assessment berhasil disimpan.',
        ], 201);
    }

    public function qualification(Request $request, Lead $lead): JsonResponse
    {
        if ($response = $this->authorizeN8n($request)) {
            return $response;
        }

        $validated = $request->validate([
            'lead_score' => ['required', 'in:hot,warm,monitor'],
            'reason' => ['required', 'string', 'max:500'],
            'version' => ['required', 'string', 'max:50'],
        ]);

        $lead->forceFill([
            'lead_score' => $validated['lead_score'],
            'qualification_status' => 'qualified',
            'qualification_version' => $validated['version'],
            'qualification_reason' => trim($validated['reason']),
            'qualified_at' => now(),
            'qualification_error' => null,
        ])->save();

        return response()->json([
            'success' => true,
            'lead_id' => $lead->id,
            'lead_score' => $lead->lead_score,
            'qualification_status' => $lead->qualification_status,
        ]);
    }

    private function triggerQualification(Lead $lead, Diagnosis $diagnosis, array $answers, array $issues): void
    {
        $url = config('services.n8n.lead_qualification_url');

        if (!$url) {
            $lead->forceFill([
                'qualification_status' => 'pending',
                'qualification_error' => null,
            ])->save();

            return;
        }

        $fastDrainHigh = ($answers['cepat_habis'] ?? null) === true
            || ($answers['fast_drain_duration'] ?? null) === 'under_4';

        $downtimeHigh = ($answers['downtime'] ?? null) === true
            || in_array($answers['downtime_frequency'] ?? null, ['three_four', 'five_plus'], true);

        $payload = [
            'lead_id' => $lead->id,
            'diagnosis_id' => $diagnosis->id,
            'health_score' => $diagnosis->health_score,
            'shift_per_day' => $diagnosis->shift,
            'multi_shift' => (int) $diagnosis->shift >= 2,
            'fast_drain_high' => $fastDrainHigh,
            'downtime_high' => $downtimeHigh,
            'jumlah_forklift' => $lead->jumlah_forklift,
            'issues' => $issues,
            'source' => $lead->source,
        ];

        $lead->forceFill([
            'qualification_status' => 'processing',
            'qualification_error' => null,
        ])->save();

        try {
            $response = Http::asJson()
                ->acceptJson()
                ->connectTimeout(2)
                ->timeout(5)
                ->post($url, $payload);

            if (!$response->successful()) {
                $lead->forceFill([
                    'qualification_status' => 'failed',
                    'qualification_error' => 'HTTP '.$response->status(),
                ])->save();
            }
        } catch (Throwable $exception) {
            report($exception);

            $lead->forceFill([
                'qualification_status' => 'failed',
                'qualification_error' => Str::limit($exception->getMessage(), 500, ''),
            ])->save();
        }
    }

    private function syncToSpreadsheet(Lead $lead, Diagnosis $diagnosis, array $issues): string
    {
        $url = config('services.n8n.lead_capture_url');

        if (!$url) {
            $lead->forceFill([
                'spreadsheet_sync_status' => 'pending',
                'spreadsheet_sync_error' => null,
            ])->save();

            return 'pending';
        }

        $model = $diagnosis->forkliftModel;
        $brand = $model?->brand;

        $payload = [
            'captured_at' => now()->toIso8601String(),
            'lead_id' => $lead->id,
            'diagnosis_id' => $diagnosis->id,
            'pt' => $lead->perusahaan,
            'lokasi' => $lead->kota,
            'nama_user' => $lead->nama,
            'whatsapp' => $lead->whatsapp,
            'brand' => $brand?->name,
            'model' => $lead->model,
            'battery_type' => $lead->battery_type,
            'jumlah_forklift' => $lead->jumlah_forklift,
            'jam_operasional' => $lead->jam_operasional,
            'health_score' => $lead->health_score,
            'issues' => $issues,
            'ai_summary' => $lead->ai_summary,
            'source' => $lead->source,
        ];

        try {
            $response = Http::asJson()
                ->acceptJson()
                ->connectTimeout(2)
                ->timeout(5)
                ->post($url, $payload);

            if ($response->successful()) {
                $lead->forceFill([
                    'spreadsheet_sync_status' => 'synced',
                    'spreadsheet_synced_at' => now(),
                    'spreadsheet_sync_error' => null,
                ])->save();

                return 'synced';
            }

            $lead->forceFill([
                'spreadsheet_sync_status' => 'failed',
                'spreadsheet_sync_error' => 'HTTP '.$response->status(),
            ])->save();

            return 'failed';
        } catch (Throwable $exception) {
            report($exception);

            $lead->forceFill([
                'spreadsheet_sync_status' => 'failed',
                'spreadsheet_sync_error' => Str::limit($exception->getMessage(), 500, ''),
            ])->save();

            return 'failed';
        }
    }

    private function authorizeN8n(Request $request): ?JsonResponse
    {
        $expected = (string) config('services.n8n.sync_token');
        $provided = (string) $request->header('X-Sync-Token');

        if (
            $expected === '' ||
            $provided === '' ||
            !hash_equals($expected, $provided)
        ) {
            return response()->json([
                'message' => 'Unauthorized qualification request.',
            ], 401);
        }

        return null;
    }

    private function normaliseWhatsapp(string $value): ?string
    {
        $digits = preg_replace('/\D+/', '', $value) ?? '';

        if (str_starts_with($digits, '0')) {
            $digits = '62'.substr($digits, 1);
        } elseif (!str_starts_with($digits, '62')) {
            $digits = '62'.$digits;
        }

        if (!preg_match('/^62[0-9]{8,13}$/', $digits)) {
            return null;
        }

        return $digits;
    }
}
