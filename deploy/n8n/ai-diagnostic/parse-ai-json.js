const raw = $json.content ?? $json.text ?? $json.output ?? $json.message ?? $json;

function extractText(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    if (typeof value.content === 'string') return value.content;
    if (typeof value.text === 'string') return value.text;
    if (typeof value.output === 'string') return value.output;
  }
  return JSON.stringify(value);
}

function parseJson(text) {
  const clean = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '');

  try {
    return JSON.parse(clean);
  } catch {
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(clean.slice(start, end + 1));
    throw new Error('AI output is not valid JSON');
  }
}

function percent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  const normalized = number > 0 && number <= 1 ? number * 100 : number;
  return Math.max(0, Math.min(100, Math.round(normalized)));
}

function text(value, max = 320) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function list(value, maxItems, maxChars) {
  return Array.isArray(value)
    ? value.map((item) => text(item, maxChars)).filter(Boolean).slice(0, maxItems)
    : [];
}

const parsed = parseJson(extractText(raw));
const causes = Array.isArray(parsed.probable_causes)
  ? parsed.probable_causes.slice(0, 3).map((item) => ({
      cause: text(item?.cause, 120),
      confidence: percent(item?.confidence),
      reason: text(item?.reason, 220),
    })).filter((item) => item.cause)
  : [];

const allowedUrgency = new Set(['low', 'medium', 'high', 'critical']);
const urgency = allowedUrgency.has(String(parsed.urgency || '').toLowerCase())
  ? String(parsed.urgency).toLowerCase()
  : 'medium';

return [{
  json: {
    summary: text(parsed.summary, 420),
    probable_causes: causes,
    technical_findings: list(parsed.technical_findings, 4, 220),
    recommended_actions: list(parsed.recommended_actions, 4, 220),
    urgency,
    confidence: percent(parsed.confidence),
    limitations: list(parsed.limitations, 3, 220),
  },
}];
