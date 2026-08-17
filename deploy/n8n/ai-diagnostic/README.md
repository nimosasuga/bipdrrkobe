# DRRKOBE AI Diagnostic — Phase 3

Tujuan: mempercepat analisis tambahan tanpa mengubah Health Score deterministic Laravel.

## Workflow aktif

```text
Webhook
→ Build AI Prompt
→ Basic LLM Chain
→ Parse AI JSON

OpenRouter Chat Model
└──→ Chat Model pada Basic LLM Chain
```

Jangan menambah Agent, Memory, Tools, RAG, atau node lain pada Phase 3.

## 1. Webhook

- Method: `POST`
- Path: `drrkobe-ai-diagnostic`
- Respond: `When Last Node Finishes`
- Response Data: `First Entry JSON`

Payload Laravel tetap menggunakan envelope:

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
- Output node hanya field `prompt`.
- Return harus satu object:

```javascript
return { json: { prompt } };
```

Prompt memakai urutan bukti: `observations` → `reference.rules` → `issues`. Jika keluhan bertentangan dengan observasi, observasi menjadi acuan utama.

## 3. Basic LLM Chain + OpenRouter

Basic LLM Chain:

- Prompt source: `Define Below`
- Prompt: `{{ $json.prompt }}`

OpenRouter Chat Model:

- Model awal: `openai/gpt-4.1-mini`
- Temperature: `0.1`
- Maximum Number of Tokens: `500`
- Max Retries: `0`
- Response Format: `JSON Object` bila tersedia dan stabil.

Jangan menurunkan max token ke `350`; pengujian menunjukkan output diagnosis dapat terpotong dan menyebabkan workflow HTTP 500.

## 4. Parse AI JSON

Node type: `Code`

- Mode: `Run Once for Each Item`
- Gunakan isi file `parse-ai-json.js` pada folder ini.
- Return harus satu object, bukan array.
- Parser mendukung output langsung, `message.content`, `choices[0].message.content`, dan output chain.
- Output tetap memakai field yang sama untuk kompatibilitas Laravel.
- Batas compact: 2 probable causes, 2 findings, 2 actions, dan 2 limitations.

## Target latency

Target normal jalur n8n + model: `2–6 detik` bila provider sedang normal.

Phase 3 dianggap lulus bila:

1. Health Score tetap deterministic dan tidak diubah AI.
2. AI result tersimpan normal ke diagnosis.
3. Output JSON tetap kompatibel dengan Laravel.
4. Tiga test berturut-turut tidak error.
5. Median `POST /ai/diagnosis/{id}/analyze` di bawah 6 detik pada kondisi provider normal.
6. Output tidak mengarang telemetry, fault code, umur sisa, harga, atau keputusan pembelian.

## Pengukuran dari VPS

Gunakan diagnosis ID yang valid:

```bash
DIAGNOSIS_ID=$(docker compose exec -T postgres \
  psql -U drrkobe -d drrkobe -tAc \
  "SELECT id FROM diagnoses ORDER BY created_at DESC LIMIT 1;" \
  | tr -d '[:space:]')

echo "$DIAGNOSIS_ID"

curl -sS -o /tmp/drrkobe-ai.json \
  -w 'HTTP=%{http_code} TOTAL=%{time_total}s CONNECT=%{time_connect}s STARTTRANSFER=%{time_starttransfer}s\n' \
  -X POST \
  -H 'Accept: application/json' \
  "https://api.drrkobe.com/api/v1/ai/diagnosis/${DIAGNOSIS_ID}/analyze"

cat /tmp/drrkobe-ai.json
```

Lakukan tiga kali dan catat `TOTAL` serta validitas JSON.

## Batas Phase 3

Tidak mengubah:

- Health Score rules
- database schema
- Caddy
- WASHENG
- PostgreSQL / Redis
- retry/fallback state

Retry, failure state, `ai_status`, dan hardening endpoint dikerjakan pada Phase 4.
