const raw = $json.content ?? $json.text ?? $json.output ?? $json.message ?? $json;

function extractText(value) {
  if (typeof value === 'string') return value;

  if (value && typeof value === 'object') {
    if (typeof value.content === 'string') return value.content;
    if (typeof value.text === 'string') return value.text;
    if (typeof value.output === 'string') return value.output;
    if (typeof value.message === 'string') return value.message;
    if (value.message && typeof value.message.content === 'string') return value.message.content;

    const choiceContent = value.choices?.[0]?.message?.content;
    if (typeof choiceContent === 'string') return choiceContent;

    const dataContent = value.data?.message?.content ?? value.data?.content ?? value.data?.text;
    if (typeof dataContent === 'string') return dataContent;
  }

  return JSON.stringify(value ?? '');
}

function parseJson(value) {
  if (!value || typeof value !== 'string') return {};

  const text = value.trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');

  if (start >= 0 && end > start) {
    try {
      const extracted = JSON.parse(text.slice(start, end + 1));
      if (extracted && typeof extracted === 'object' && !Array.isArray(extracted)) {
        return extracted;
      }
    } catch {
      // Lanjutkan ke pembersihan markdown.
    }
  }

  const clean = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(clean);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    throw new Error('Hasil balasan AI bukan format JSON yang valid');
  }
}

function percent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  const normalized = number > 0 && number <= 1 ? number * 100 : number;
  return Math.max(0, Math.min(100, Math.round(normalized)));
}

function text(value, max = 180) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function list(value, maxItems, maxChars) {
  return Array.isArray(value)
    ? value.map((item) => text(item, maxChars)).filter(Boolean).slice(0, maxItems)
    : [];
}

const parsed = parseJson(extractText(raw)) || {};

const causes = Array.isArray(parsed.probable_causes)
  ? parsed.probable_causes
      .slice(0, 2)
      .map((item) => ({
        cause: text(item?.cause, 70),
        confidence: percent(item?.confidence),
        reason: text(item?.reason, 120),
      }))
      .filter((item) => item.cause)
  : [];

const allowedUrgency = new Set(['low', 'medium', 'high', 'critical']);
const urgencyValue = String(parsed.urgency || '').toLowerCase();
const urgency = allowedUrgency.has(urgencyValue) ? urgencyValue : 'medium';

// Node mode: Run Once for Each Item.
return {
  json: {
    summary: text(parsed.summary, 180),
    probable_causes: causes,
    technical_findings: list(parsed.technical_findings, 2, 120),
    recommended_actions: list(parsed.recommended_actions, 2, 120),
    urgency,
    confidence: percent(parsed.confidence),
    limitations: list(parsed.limitations, 2, 120),
  },
};
