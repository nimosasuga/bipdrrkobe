const payload = $json.body ?? $json;

const healthScore = Number(payload.health_score ?? 100);
const multiShift = payload.multi_shift === true || Number(payload.shift_per_day ?? 0) >= 2;
const fastDrainHigh = payload.fast_drain_high === true;
const downtimeHigh = payload.downtime_high === true;

const riskCount = [multiShift, fastDrainHigh, downtimeHigh].filter(Boolean).length;

let leadScore = 'monitor';
let reason = 'Kondisi relatif lebih sehat atau sinyal operasional prioritas tinggi belum terpenuhi.';

if (healthScore <= 40 && multiShift && fastDrainHigh && downtimeHigh) {
  leadScore = 'hot';
  reason = 'Health score <= 40 dengan operasi multi-shift, fast drain tinggi, dan downtime tinggi.';
} else if (healthScore <= 65 || riskCount >= 2) {
  leadScore = 'warm';
  reason = 'Health score <= 65 atau sedikitnya dua sinyal risiko operasional terdeteksi.';
}

return {
  json: {
    lead_id: payload.lead_id,
    diagnosis_id: payload.diagnosis_id,
    lead_score: leadScore,
    reason,
    version: 'v1-2026-08-18',
    evidence: {
      health_score: healthScore,
      multi_shift: multiShift,
      fast_drain_high: fastDrainHigh,
      downtime_high: downtimeHigh,
      risk_count: riskCount,
    },
  },
};
