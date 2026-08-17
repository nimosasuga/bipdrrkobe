# DRRKOBE Lead Capture → Google Sheets

Tujuan workflow ini adalah menyalin lead yang sudah lebih dulu tersimpan di PostgreSQL ke Google Sheets. Database tetap menjadi sumber utama. Kegagalan Google Sheets tidak boleh menghapus lead atau memblokir hasil diagnosis.

## Workflow n8n

Gunakan alur sederhana:

Webhook (POST) → Google Sheets (Append Row) → Respond to Webhook

Webhook path yang disarankan:

`drrkobe-lead-capture`

Setelah workflow Published, simpan Production URL ke `.env` backend sebagai:

`N8N_LEAD_CAPTURE_URL=https://ops.drrkobe.com/webhook/drrkobe-lead-capture`

## Header Google Sheet

Buat sheet misalnya `BIP Leads` dengan header baris pertama:

1. captured_at
2. lead_id
3. diagnosis_id
4. pt
5. lokasi
6. nama_user
7. whatsapp
8. brand
9. model
10. battery_type
11. jumlah_forklift
12. jam_operasional
13. health_score
14. issues
15. ai_summary
16. source

Empat data berikut wajib berasal dari user sebelum masuk Step 9:

- pt
- lokasi
- nama_user
- whatsapp

## Mapping Google Sheets node

Operation: Append Row

Map dari input webhook:

- captured_at → `{{ $json.body.captured_at }}`
- lead_id → `{{ $json.body.lead_id }}`
- diagnosis_id → `{{ $json.body.diagnosis_id }}`
- pt → `{{ $json.body.pt }}`
- lokasi → `{{ $json.body.lokasi }}`
- nama_user → `{{ $json.body.nama_user }}`
- whatsapp → `{{ $json.body.whatsapp }}`
- brand → `{{ $json.body.brand }}`
- model → `{{ $json.body.model }}`
- battery_type → `{{ $json.body.battery_type }}`
- jumlah_forklift → `{{ $json.body.jumlah_forklift }}`
- jam_operasional → `{{ $json.body.jam_operasional }}`
- health_score → `{{ $json.body.health_score }}`
- issues → `{{ Array.isArray($json.body.issues) ? $json.body.issues.join(' | ') : '' }}`
- ai_summary → `{{ $json.body.ai_summary || '' }}`
- source → `{{ $json.body.source }}`

## Respond to Webhook

Status code: 200

Body JSON:

```json
{"success":true}
```

## Aturan penting

- Jangan menyimpan token Google atau credential n8n di GitHub.
- Jangan membuat Google Sheets sebagai sumber utama lead.
- Lead harus berhasil tersimpan di PostgreSQL lebih dulu.
- Bila Google Sheets gagal, backend menandai `spreadsheet_sync_status=failed`; user tetap dapat melanjutkan diagnosis.
