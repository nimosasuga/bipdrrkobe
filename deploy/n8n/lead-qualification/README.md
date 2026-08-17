# DRRKOBE Lead Qualification — PHASE 6

Tujuan workflow ini adalah memberi prioritas sales internal secara deterministik. Workflow ini tidak mengubah Health Score dan tidak tampil ke user publik.

## Flow n8n

Webhook (POST) → Code: Qualify Lead → HTTP Request: Save Qualification

Webhook path:

`drrkobe-lead-qualification`

Production URL:

`https://ops.drrkobe.com/webhook/drrkobe-lead-qualification`

Simpan URL tersebut di `.env` backend:

`N8N_LEAD_QUALIFICATION_URL=https://ops.drrkobe.com/webhook/drrkobe-lead-qualification`

## 1. Webhook

- Method: POST
- Path: `drrkobe-lead-qualification`
- Authentication: Header Auth
- Header name: `X-Sync-Token`
- Header value: gunakan nilai `N8N_SYNC_TOKEN` yang sama dengan backend. Jangan simpan token di GitHub.
- Response: When Last Node Finishes

Payload dari Laravel berisi:

- lead_id
- diagnosis_id
- health_score
- shift_per_day
- multi_shift
- fast_drain_high
- downtime_high
- jumlah_forklift
- issues
- source

## 2. Code — Qualify Lead

Mode: `Run Once for Each Item`.

Copy isi file `qualify-lead.js` ke node Code.

Aturan v1:

- HOT: health_score <= 40 DAN multi_shift DAN fast_drain_high DAN downtime_high.
- WARM: health_score <= 65 ATAU minimal dua dari tiga sinyal operasional di atas terpenuhi.
- MONITOR: selain kondisi di atas.

Klasifikasi ini hanya prioritas sales internal, bukan klaim teknis dan bukan pengganti Health Score.

## 3. HTTP Request — Save Qualification

- Method: POST
- URL expression: `https://api.drrkobe.com/api/v1/internal/leads/{{ $json.lead_id }}/qualification`
- Send Headers: ON
- Header `X-Sync-Token`: gunakan nilai `N8N_SYNC_TOKEN` yang sama.
- Send Body: JSON

Body:

```json
{
  "lead_score": "{{ $json.lead_score }}",
  "reason": "{{ $json.reason }}",
  "version": "{{ $json.version }}"
}
```

Expected HTTP response: 200.

## Uji

Buat diagnosis baru sampai lead tersimpan. Lalu cek PostgreSQL:

```sql
SELECT
  id,
  perusahaan,
  health_score,
  lead_score,
  qualification_status,
  qualification_version,
  qualification_reason,
  qualified_at
FROM leads
ORDER BY created_at DESC
LIMIT 1;
```

Target:

- `qualification_status = qualified`
- `lead_score = hot | warm | monitor`
- `qualification_version = v1-2026-08-18`
- `qualification_reason` terisi
- Health Score tidak berubah.

## Aturan keamanan

- Jangan tampilkan `lead_score` ke frontend publik.
- Jangan kirim harga ke workflow ini.
- Jangan gunakan AI untuk menentukan HOT/WARM/MONITOR.
- Callback Laravel hanya menerima `hot`, `warm`, atau `monitor` dan wajib memakai `X-Sync-Token`.
