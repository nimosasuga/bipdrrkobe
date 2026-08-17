# DRRKOBE AI Diagnostic — Phase 3

Tujuan: mempercepat analisis tambahan tanpa mengubah Health Score deterministic Laravel.

## Workflow aktif

```text
Webhook
→ Build AI Prompt
→ Message a model
→ Parse AI JSON
```

Jangan menambah node lain pada Phase 3.

## 1. Webhook

- Method: `POST`
- Path: `drrkobe-ai-diagnostic`
- Authentication: tetap mengikuti konfigurasi aktif saat ini; hardening auth dikerjakan pada fase security berikutnya.
- Respond: `When Last Node Finishes`
- Response Data: `First Entry JSON`

Payload Laravel sekarang tetap menggunakan envelope:

```json
{
  "context": {
    "diagnosis": {},
    "forklift": {},
    "observations": {},
    "issues": [],
    "reference": {
      "battery": [],
      "charger": [],
      "rules": []
    }
  }
}
```

Context sudah dipadatkan oleh Laravel. Jangan mengambil ulang data dari API atau database di n8n.

## 2. Build AI Prompt

Node type: `Code`

- Mode: `Run Once for Each Item`
- Gunakan isi file `build-ai-prompt.js` pada folder ini.
- Output node harus hanya memiliki field `prompt`.

## 3. Message a model

Gunakan model cepat yang sudah aktif pada workflow.

Setelan yang direkomendasikan bila tersedia pada node/provider:

- Temperature: `0.2`
- Max output tokens: `900`
- Response format: JSON / structured output bila provider mendukung tanpa menambah latency besar.
- Content/Input: Expression `$json.prompt`

Jangan menggunakan literal `{{ $json.prompt }}` pada mode Fixed.

## 4. Parse AI JSON

Node type: `Code`

- Mode: `Run Once for Each Item`
- Gunakan isi file `parse-ai-json.js` pada folder ini.
- Parser membatasi jumlah item dan panjang teks agar response ke Laravel tetap kecil dan konsisten.

## Target latency

Target normal untuk jalur n8n + model: `2–6 detik` bila provider/model sedang normal.

Phase 3 dianggap lulus bila:

1. Health Score tampil tanpa menunggu AI.
2. AI result tersimpan normal ke diagnosis.
3. Output JSON tidak berubah bentuk.
4. Tiga test berturut-turut tidak error.
5. Median waktu `POST /ai/diagnosis/{id}/analyze` berada di bawah 6 detik pada kondisi provider normal.

## Pengukuran dari VPS

Gunakan diagnosis ID baru:

```bash
curl -sS -o /tmp/drrkobe-ai.json \
  -w 'HTTP=%{http_code} TOTAL=%{time_total}s CONNECT=%{time_connect}s STARTTRANSFER=%{time_starttransfer}s\n' \
  -X POST \
  -H 'Accept: application/json' \
  https://api.drrkobe.com/api/v1/ai/diagnosis/DIAGNOSIS_ID/analyze

cat /tmp/drrkobe-ai.json
```

Lakukan pada tiga diagnosis baru dan catat `TOTAL`.

## Batas Phase 3

Tidak mengubah:

- Health Score rules
- database schema
- Caddy
- WASHENG
- PostgreSQL / Redis
- retry/fallback state

Retry, failure state, dan `ai_status` dikerjakan pada Phase 4.
