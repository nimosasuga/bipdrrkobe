'use client';

import { jsPDF } from 'jspdf';

const FINANCIAL_CONTEXT_KEY = 'drrkobe_bip_pdf_financial_context';

type JsPdfApiWithGuard = typeof jsPDF.API & {
  __drrkobePdfTextSafetyRegistered?: boolean;
};

type JsPdfInstanceWithGuard = jsPDF & {
  __drrkobePdfTextSafetyPatched?: boolean;
};

type FinancialContext = {
  actualDowntimeHoursPerUnitMonth: number | null;
  downtimeCostPerHour: number;
  maintenanceCostPerUnitMonth: number;
  chargingCostPerUnitMonth: number;
  fleetSize: number;
};

type PdfReportState = {
  metricLabel: string | null;
  captureWateringValue: boolean;
  downtimeDetail: string | null;
  chargingDetail: string | null;
  wateringDetail: string | null;
  productivityReported: boolean;
  replaceNextAnnualAmount: boolean;
  financialContext: FinancialContext;
};

function normalizePdfText(value: string): string {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/[\u200b-\u200d\ufeff]/g, '')
    .replace(/[‐‑‒–—―]/g, '-')
    .replace(/≥/g, '>=')
    .replace(/≤/g, '<=')
    .replace(/[“”„]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, '...');
}

function readFinancialContext(): FinancialContext {
  const fallback: FinancialContext = {
    actualDowntimeHoursPerUnitMonth: null,
    downtimeCostPerHour: 0,
    maintenanceCostPerUnitMonth: 0,
    chargingCostPerUnitMonth: 0,
    fleetSize: 1,
  };

  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.sessionStorage.getItem(FINANCIAL_CONTEXT_KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw) as Partial<FinancialContext>;
    return {
      actualDowntimeHoursPerUnitMonth: typeof parsed.actualDowntimeHoursPerUnitMonth === 'number'
        ? parsed.actualDowntimeHoursPerUnitMonth
        : null,
      downtimeCostPerHour: Math.max(0, Number(parsed.downtimeCostPerHour) || 0),
      maintenanceCostPerUnitMonth: Math.max(0, Number(parsed.maintenanceCostPerUnitMonth) || 0),
      chargingCostPerUnitMonth: Math.max(0, Number(parsed.chargingCostPerUnitMonth) || 0),
      fleetSize: Math.max(1, Number(parsed.fleetSize) || 1),
    };
  } catch {
    return fallback;
  }
}

function rupiah(value: number): string {
  return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
}

function financialTotals(context: FinancialContext) {
  const downtimeComplete = context.actualDowntimeHoursPerUnitMonth !== null && context.downtimeCostPerHour > 0;
  const monthlyDowntime = downtimeComplete
    ? (context.actualDowntimeHoursPerUnitMonth || 0) * context.downtimeCostPerHour * context.fleetSize
    : 0;
  const monthlyMaintenance = context.maintenanceCostPerUnitMonth * context.fleetSize;
  const monthlyCharging = context.chargingCostPerUnitMonth * context.fleetSize;
  const monthlyKnown = monthlyDowntime + monthlyMaintenance + monthlyCharging;

  return {
    downtimeComplete,
    monthlyDowntime,
    monthlyMaintenance,
    monthlyCharging,
    monthlyKnown,
    annualKnown: monthlyKnown * 12,
  };
}

function detailAfterPrefix(text: string, prefix: string): string | null {
  if (!text.toLowerCase().startsWith(prefix.toLowerCase())) return null;
  const value = text.slice(prefix.length).trim().replace(/[.,;:]$/, '').trim();
  return value || null;
}

function captureDiagnosisEvidence(text: string, state: PdfReportState) {
  if (text === 'ISI AIR BATTERY') {
    state.captureWateringValue = true;
    return;
  }

  if (state.captureWateringValue && text !== 'ISI AIR BATTERY') {
    if (text && text !== '-') state.wateringDetail = text;
    state.captureWateringValue = false;
  }

  const downtime = detailAfterPrefix(text, 'Unit berhenti karena battery/pengisian:');
  if (downtime) state.downtimeDetail = downtime;

  const charging = detailAfterPrefix(text, 'Durasi pengisian:');
  if (charging) state.chargingDetail = charging;

  const watering = detailAfterPrefix(text, 'Pemeriksaan atau isi air battery:');
  if (watering) state.wateringDetail = watering;

  if (text.toLowerCase().includes('produktivitas forklift menurun')) {
    state.productivityReported = true;
  }
}

function trackMetricLabel(text: string, state: PdfReportState) {
  const labels = new Set([
    'WAKTU HENTI',
    'PENGISIAN DAYA',
    'PERAWATAN',
    'PRODUKTIVITAS',
    'WAKTU HENTI / BULAN',
    'PERAWATAN / BULAN',
    'PENGISIAN / BULAN',
    'EFISIENSI ENERGI',
    'KESESUAIAN',
  ]);

  if (labels.has(text)) state.metricLabel = text;
}

function evidenceValueForMetric(text: string, state: PdfReportState): string | null {
  const label = state.metricLabel;
  if (!label) return null;

  const context = state.financialContext;
  const totals = financialTotals(context);
  const actualDowntime = context.actualDowntimeHoursPerUnitMonth;

  if (label === 'WAKTU HENTI') {
    if (/^\d+(?:[.,]\d+)?\s+jam\/bln$/i.test(text) || /^-\d+(?:[.,]\d+)?%$/.test(text)) {
      if (actualDowntime !== null) return `${actualDowntime} jam/bln`;
      return state.downtimeDetail || 'Frekuensi belum tersedia';
    }
  }

  if (label === 'PENGISIAN DAYA' && /^\d+(?:[.,]\d+)?\s+jam\/bln$/i.test(text)) {
    return state.chargingDetail ? `${state.chargingDetail} / siklus` : 'Durasi belum tersedia';
  }

  if (label === 'PERAWATAN') {
    if (/^\d+(?:[.,]\d+)?x\/thn$/i.test(text) || /^-\d+(?:[.,]\d+)?%$/.test(text)) {
      return state.wateringDetail || 'Pola belum tersedia';
    }
  }

  if (label === 'PRODUKTIVITAS' && /^-\d+(?:[.,]\d+)?%$/.test(text)) {
    return state.productivityReported ? 'Terdampak' : 'Belum dilaporkan';
  }

  if (label === 'EFISIENSI ENERGI' && /^\+?\d+(?:[.,]\d+)?%$/.test(text)) {
    return 'Belum diukur';
  }

  if (label === 'WAKTU HENTI / BULAN' && /^Rp\s/i.test(text)) {
    return totals.downtimeComplete ? rupiah(totals.monthlyDowntime) : 'Belum dihitung';
  }

  if (label === 'PERAWATAN / BULAN' && /^Rp\s/i.test(text) && context.maintenanceCostPerUnitMonth > 0) {
    return rupiah(totals.monthlyMaintenance);
  }

  if (label === 'PENGISIAN / BULAN' && /^Rp\s/i.test(text) && context.chargingCostPerUnitMonth > 0) {
    return rupiah(totals.monthlyCharging);
  }

  return null;
}

function metricNoteReplacement(text: string, state: PdfReportState): string | null {
  const label = state.metricLabel;
  const context = state.financialContext;

  if (label === 'WAKTU HENTI' && (text === 'Perkiraan unit tidak produktif' || text === 'Potensi pengurangan')) {
    return context.actualDowntimeHoursPerUnitMonth !== null ? 'Durasi aktual dari user' : 'Frekuensi yang dilaporkan';
  }
  if (label === 'PENGISIAN DAYA' && text === 'Waktu terserap untuk pengisian') {
    return 'Durasi pengisian yang dilaporkan';
  }
  if (label === 'PERAWATAN' && (text === 'Isi air dan pemeriksaan rutin' || text === 'Potensi pengurangan pekerjaan rutin')) {
    return 'Pola perawatan yang dilaporkan';
  }
  if (label === 'PRODUKTIVITAS' && text === 'Terhadap jam operasi tersedia') {
    return 'Berdasarkan gejala yang dipilih';
  }
  if (label === 'EFISIENSI ENERGI' && text === 'Potensi peningkatan') {
    return 'Butuh baseline konsumsi aktual';
  }
  if (label === 'WAKTU HENTI / BULAN' && /unit\s+x\s+\d+(?:[.,]\d+)?\s+jam/i.test(text)) {
    return context.actualDowntimeHoursPerUnitMonth !== null
      ? `${context.fleetSize} unit x ${context.actualDowntimeHoursPerUnitMonth} jam aktual`
      : 'Isi durasi downtime aktual';
  }

  return null;
}

function layoutSafeCopy(text: string): string {
  const replacements: Record<string, string> = {
    '05 / LEAD ACID DAN LITHIUM-ION': '05 / LEAD ACID VS LITHIUM-ION',
    'Apa yang berubah bila teknologinya': 'Masalah Lead Acid vs keunggulan',
    'berbeda?': 'Lithium-ion',
    'PARAMETER': 'PAIN POINT',
    'LITHIUM-ION UNTUK DIEVALUASI': 'KEUNGGULAN LITHIUM-ION',
    'Waktu pengisian': 'Charging window',
    '8-12 jam, kemudian masa pendinginan': 'Charging & recovery perlu dijadwalkan',
    'Sekitar 1,5-2,5 jam; dapat diisi saat jeda operasi': 'Opportunity charging saat jeda*',
    'Umur siklus': 'Konsistensi daya',
    'Sekitar 1.200 siklus': 'Dipengaruhi usia & pemakaian',
    'Sekitar 3.000+ siklus': 'BMS bantu kelola charging',
    'Perawatan rutin': 'Routine battery care',
    'Isi air, equalizing, dan pembersihan': 'Watering, equalizing, dan cleaning',
    'Tidak memerlukan isi air atau equalizing rutin': 'Tanpa watering / equalizing rutin',
    'Efisiensi energi': 'Availability charging',
    'Sekitar 75-80%': 'Charging window lebih terbatas',
    'Dapat mencapai sekitar 95%+': 'Charging lebih fleksibel*',
    'Membutuhkan waktu pengisian dan rotasi battery': 'Perlu charging window & rotasi battery',
    'Lebih fleksibel untuk pengisian saat jeda': 'Opportunity charging untuk multi-shift*',
    'Aspek keselamatan': 'Penanganan battery',
    'Perlu penanganan asam dan ventilasi gas': 'Asam, gas charging, ventilasi & PPE',
    'Tanpa isi air; tetap perlu pengawasan Battery Management System (BMS)': 'Tanpa watering; tetap diawasi BMS',
    '06 / POTENSI PERBAIKAN': '06 / VALIDASI LITHIUM-ION',
    'Apa yang mungkin diperoleh bila pola': 'Mengapa Lithium-ion layak dievaluasi',
    'operasi diperbaiki?': 'untuk operasi ini?',
    'Persentase di bawah adalah skenario awal untuk membantu pembahasan. Nilai aktual harus dibuktikan dengan data': 'Gunakan data diagnosis sebagai dasar evaluasi. Saving dan ROI memerlukan baseline site.',
    'operasi dan pemeriksaan lapangan.': 'Nilai aktual tetap perlu diverifikasi.',
  };

  return replacements[text] ?? text;
}

function validatePublicReportText(value: string, state: PdfReportState): string {
  const text = normalizePdfText(value);

  captureDiagnosisEvidence(text, state);
  trackMetricLabel(text, state);

  const evidenceValue = evidenceValueForMetric(text, state);
  if (evidenceValue) return evidenceValue;

  const metricNote = metricNoteReplacement(text, state);
  if (metricNote) return metricNote;

  if (text === 'PERKIRAAN BEBAN OPERASIONAL SETAHUN') {
    state.replaceNextAnnualAmount = true;
    const totals = financialTotals(state.financialContext);
    if (totals.monthlyKnown <= 0) return 'STATUS PERHITUNGAN FINANSIAL';
    return totals.downtimeComplete ? 'TOTAL BEBAN OPERASIONAL SETAHUN' : 'SUBTOTAL BIAYA TERIDENTIFIKASI';
  }

  if (state.replaceNextAnnualAmount && /^Rp\s/i.test(text)) {
    state.replaceNextAnnualAmount = false;
    const totals = financialTotals(state.financialContext);
    return totals.annualKnown > 0 ? rupiah(totals.annualKnown) : 'Belum final';
  }

  if (text === 'berdasarkan data biaya dan data operasi yang tersedia') {
    const totals = financialTotals(state.financialContext);
    return totals.downtimeComplete
      ? 'Dihitung dari data biaya dan downtime aktual yang diisi user.'
      : 'Subtotal dari biaya yang sudah diketahui; downtime belum termasuk.';
  }

  if (text.startsWith('Skenario potensi pengurangan beban:')) {
    return 'Potensi saving dibahas setelah target teknis tervalidasi.';
  }

  if (text.startsWith('Apakah potensi pengurangan beban sekitar Rp')) {
    return 'Apakah pain point charging, downtime, dan perawatan cukup bernilai untuk evaluasi investasi?';
  }

  return layoutSafeCopy(text);
}

const api = jsPDF.API as JsPdfApiWithGuard;

if (!api.__drrkobePdfTextSafetyRegistered) {
  api.__drrkobePdfTextSafetyRegistered = true;

  api.events.push([
    'initialized',
    function patchPdfTextSafety(this: jsPDF) {
      const instance = this as JsPdfInstanceWithGuard;
      if (instance.__drrkobePdfTextSafetyPatched) return;

      instance.__drrkobePdfTextSafetyPatched = true;
      const reportState: PdfReportState = {
        metricLabel: null,
        captureWateringValue: false,
        downtimeDetail: null,
        chargingDetail: null,
        wateringDetail: null,
        productivityReported: false,
        replaceNextAnnualAmount: false,
        financialContext: readFinancialContext(),
      };

      const originalText = instance.text;
      const originalGetTextWidth = instance.getTextWidth;

      instance.getTextWidth = ((text: string) => {
        return originalGetTextWidth.call(instance, normalizePdfText(String(text)));
      }) as jsPDF['getTextWidth'];

      instance.text = ((text: string | string[], ...args: unknown[]) => {
        const safeText = Array.isArray(text)
          ? text.map((line) => validatePublicReportText(String(line), reportState))
          : validatePublicReportText(String(text), reportState);

        return (originalText as (...params: unknown[]) => jsPDF).call(instance, safeText, ...args);
      }) as jsPDF['text'];
    },
  ]);
}

export default function PdfTextSafety() {
  return null;
}
