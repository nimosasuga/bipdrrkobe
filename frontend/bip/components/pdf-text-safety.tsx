'use client';

import { jsPDF } from 'jspdf';

const FINANCIAL_CONTEXT_KEY = 'drrkobe_bip_pdf_financial_context';
const LITHIUM_SCENARIO_KEY = 'drrkobe_bip_lithium_scenario';

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

type LithiumScenario = {
  downtimeHoursPerUnitMonth: number | null;
  maintenanceCostPerUnitMonth: number | null;
  chargingCostPerUnitMonth: number | null;
};

type PdfReportState = {
  metricLabel: string | null;
  captureWateringValue: boolean;
  downtimeDetail: string | null;
  chargingDetail: string | null;
  wateringDetail: string | null;
  runtimeDetail: string | null;
  operationDetail: string | null;
  productivityReported: boolean;
  replaceNextFinancialAmount: boolean;
  financialContext: FinancialContext;
  lithiumScenario: LithiumScenario;
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

function rupiah(value: number): string {
  return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
}

function compactRupiah(value: number): string {
  const absolute = Math.abs(value);
  const format = (amount: number) => amount.toLocaleString('id-ID', { maximumFractionDigits: 1 });
  if (absolute >= 1_000_000_000) return `Rp ${format(value / 1_000_000_000)} M`;
  if (absolute >= 1_000_000) return `Rp ${format(value / 1_000_000)} jt`;
  if (absolute >= 1_000) return `Rp ${format(value / 1_000)} rb`;
  return rupiah(value);
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
        ? Math.max(0, parsed.actualDowntimeHoursPerUnitMonth)
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

function optionalDomNumber(selector: string): number | null {
  if (typeof document === 'undefined') return null;
  const input = document.querySelector<HTMLInputElement>(selector);
  const raw = input?.value.trim() ?? '';
  if (raw === '') return null;
  return Math.max(0, Number(raw) || 0);
}

function readLithiumScenario(): LithiumScenario {
  const domScenario: LithiumScenario = {
    downtimeHoursPerUnitMonth: optionalDomNumber('[data-lithium-downtime="1"]'),
    maintenanceCostPerUnitMonth: optionalDomNumber('[data-lithium-maintenance="1"]'),
    chargingCostPerUnitMonth: optionalDomNumber('[data-lithium-charging="1"]'),
  };

  if (
    domScenario.downtimeHoursPerUnitMonth !== null
    || domScenario.maintenanceCostPerUnitMonth !== null
    || domScenario.chargingCostPerUnitMonth !== null
  ) return domScenario;

  const fallback: LithiumScenario = {
    downtimeHoursPerUnitMonth: null,
    maintenanceCostPerUnitMonth: null,
    chargingCostPerUnitMonth: null,
  };

  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.sessionStorage.getItem(LITHIUM_SCENARIO_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<LithiumScenario>;
    return {
      downtimeHoursPerUnitMonth: typeof parsed.downtimeHoursPerUnitMonth === 'number'
        ? Math.max(0, parsed.downtimeHoursPerUnitMonth)
        : null,
      maintenanceCostPerUnitMonth: typeof parsed.maintenanceCostPerUnitMonth === 'number'
        ? Math.max(0, parsed.maintenanceCostPerUnitMonth)
        : null,
      chargingCostPerUnitMonth: typeof parsed.chargingCostPerUnitMonth === 'number'
        ? Math.max(0, parsed.chargingCostPerUnitMonth)
        : null,
    };
  } catch {
    return fallback;
  }
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

function lithiumTotals(context: FinancialContext, scenario: LithiumScenario) {
  const complete = (
    context.downtimeCostPerHour > 0
    && scenario.downtimeHoursPerUnitMonth !== null
    && scenario.maintenanceCostPerUnitMonth !== null
    && scenario.chargingCostPerUnitMonth !== null
  );

  const monthlyDowntime = complete
    ? (scenario.downtimeHoursPerUnitMonth || 0) * context.downtimeCostPerHour * context.fleetSize
    : 0;
  const monthlyMaintenance = complete ? (scenario.maintenanceCostPerUnitMonth || 0) * context.fleetSize : 0;
  const monthlyCharging = complete ? (scenario.chargingCostPerUnitMonth || 0) * context.fleetSize : 0;
  const monthlyKnown = monthlyDowntime + monthlyMaintenance + monthlyCharging;
  const lead = financialTotals(context).monthlyKnown;
  const gap = complete ? lead - monthlyKnown : 0;

  return {
    complete,
    monthlyDowntime,
    monthlyMaintenance,
    monthlyCharging,
    monthlyKnown,
    annualKnown: monthlyKnown * 12,
    gap,
    annualGap: gap * 12,
  };
}

function detailAfterPrefix(text: string, prefix: string): string | null {
  if (!text.toLowerCase().startsWith(prefix.toLowerCase())) return null;
  const value = text.slice(prefix.length).trim().replace(/[.,;:]$/, '').trim();
  return value || null;
}

function captureDiagnosisEvidence(text: string, state: PdfReportState) {
  const normalized = normalizePdfText(text).trim();
  if (!normalized) return;

  if (normalized === 'ISI AIR BATTERY') {
    state.captureWateringValue = true;
    return;
  }

  if (state.captureWateringValue && normalized !== 'ISI AIR BATTERY') {
    if (normalized !== '-') state.wateringDetail = normalized;
    state.captureWateringValue = false;
  }

  const runtime = detailAfterPrefix(normalized, 'Daya battery bertahan:');
  if (runtime) state.runtimeDetail = runtime;

  const downtime = detailAfterPrefix(normalized, 'Unit berhenti karena battery/pengisian:');
  if (downtime) state.downtimeDetail = downtime;

  const charging = detailAfterPrefix(normalized, 'Durasi pengisian:');
  if (charging) state.chargingDetail = charging;

  const watering = detailAfterPrefix(normalized, 'Pemeriksaan atau isi air battery:');
  if (watering) state.wateringDetail = watering;

  if (/^\d+\s+shift\s+-\s+\d+\s+jam\/hari$/i.test(normalized)) {
    state.operationDetail = normalized;
  }

  if (normalized.toLowerCase().includes('produktivitas forklift menurun')) {
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

function layoutSafeCopy(text: string): string {
  const replacements: Record<string, string> = {
    '05 / LEAD ACID DAN LITHIUM-ION': '05 / LEAD ACID VS LITHIUM-ION',
    'Apa yang berubah bila teknologinya': 'Masalah Lead Acid vs keunggulan',
    'berbeda?': 'Lithium-ion',
    'Perbandingan ini digunakan untuk memahami konsekuensi terhadap cara kerja. Harga battery tidak ditampilkan pada tahap penilaian.': 'Pain point Lead Acid dipetakan terhadap keunggulan operasional Lithium-ion. Harga battery tidak ditampilkan.',
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
    'Lebih fleksibel untuk pengisian saat jeda': 'Opportunity charging multi-shift*',
    'Aspek keselamatan': 'Penanganan battery',
    'Perlu penanganan asam dan ventilasi gas': 'Asam, gas charging, ventilasi & PPE',
    'Tanpa isi air; tetap perlu pengawasan Battery Management System (BMS)': 'Tanpa watering; tetap diawasi BMS',
    'Lithium-ion tidak otomatis menjadi pilihan terbaik untuk setiap perusahaan. Kelayakannya bergantung pada pola kerja unit, charger, konektor, ruang battery, temperatur, jumlah shift, dan target kesiapan unit.': 'Untuk operasi multi-shift dengan charging window sempit dan routine Lead Acid care, Lithium-ion memiliki alasan teknis kuat untuk dievaluasi. Kelayakan final tetap bergantung pada charger, BMS, konektor, dimensi, kapasitas, temperatur, dan duty cycle.',
  };
  return replacements[text] ?? text;
}

function evidenceValueForMetric(text: string, state: PdfReportState): string | null {
  const label = state.metricLabel;
  if (!label) return null;

  const context = state.financialContext;
  const totals = financialTotals(context);
  const actualDowntime = context.actualDowntimeHoursPerUnitMonth;

  if (label === 'WAKTU HENTI' && /^\d+(?:[.,]\d+)?\s+jam\/bln$/i.test(text)) {
    return actualDowntime !== null ? `${actualDowntime} jam/bln` : state.downtimeDetail || 'Frekuensi belum tersedia';
  }
  if (label === 'PENGISIAN DAYA' && /^\d+(?:[.,]\d+)?\s+jam\/bln$/i.test(text)) {
    return state.chargingDetail ? `${state.chargingDetail} / siklus` : 'Durasi belum tersedia';
  }
  if (label === 'PERAWATAN' && /^\d+(?:[.,]\d+)?x\/thn$/i.test(text)) {
    return state.wateringDetail || 'Pola belum tersedia';
  }
  if (label === 'PRODUKTIVITAS' && /^-\d+(?:[.,]\d+)?%$/.test(text)) {
    return state.productivityReported ? 'Terdampak' : 'Belum dilaporkan';
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

  if (label === 'WAKTU HENTI' && text === 'Perkiraan unit tidak produktif') {
    return context.actualDowntimeHoursPerUnitMonth !== null ? 'Durasi aktual dari user' : 'Frekuensi yang dilaporkan';
  }
  if (label === 'PENGISIAN DAYA' && text === 'Waktu terserap untuk pengisian') {
    return 'Durasi pengisian yang dilaporkan';
  }
  if (label === 'PERAWATAN' && text === 'Isi air dan pemeriksaan rutin') {
    return 'Pola perawatan yang dilaporkan';
  }
  if (label === 'PRODUKTIVITAS' && text === 'Terhadap jam operasi tersedia') {
    return 'Berdasarkan gejala yang dipilih';
  }
  if (label === 'WAKTU HENTI / BULAN' && /unit\s+x\s+\d+(?:[.,]\d+)?\s+jam/i.test(text)) {
    return context.actualDowntimeHoursPerUnitMonth !== null
      ? `${context.fleetSize} unit x ${context.actualDowntimeHoursPerUnitMonth} jam aktual`
      : 'Isi durasi downtime aktual';
  }
  return null;
}

function pageFourReplacement(instance: jsPDF, text: string, state: PdfReportState): string[] | null {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const charging = state.chargingDetail || 'durasi charging yang dilaporkan';
  const downtime = state.financialContext.actualDowntimeHoursPerUnitMonth !== null
    ? `${state.financialContext.actualDowntimeHoursPerUnitMonth} jam/bulan`
    : state.downtimeDetail || 'downtime yang dilaporkan';

  if (normalized.startsWith('Pada armada')) {
    const replacement = `Downtime ${downtime} dan charging ${charging} menunjukkan kehilangan kesiapan unit yang nyata. Prioritas: uji kapasitas battery dan charger. Jika charging window tetap membatasi operasi, lanjutkan evaluasi Lithium-ion.`;
    return (instance as any).splitTextToSize(replacement, 132).slice(0, 4);
  }

  const bullets: Array<[string, string]> = [
    ['Frekuensi unit berhenti karena battery/pengisian:', 'Pisahkan log downtime menjadi penyebab battery, charger, dan unit agar akar gangguan terlihat.'],
    ['Durasi pengisian yang dilaporkan:', `Uji charger dan kapasitas battery; charging ${charging} harus dibandingkan dengan kebutuhan shift.`],
    ['Pemeriksaan atau isi air battery:', 'Hitung waktu routine Lead Acid care sebagai beban kerja aktual, bukan hanya frekuensi.'],
    ['Operasi multi-shift membutuhkan battery', 'Jika charging window tetap mengganggu availability, validasi Lithium-ion dan opportunity charging.'],
  ];

  for (const [prefix, replacement] of bullets) {
    if (normalized.startsWith(prefix)) return (instance as any).splitTextToSize(replacement, 158).slice(0, 2);
  }

  return null;
}

function pageSevenMetric(text: string, state: PdfReportState): string | null {
  const lead = financialTotals(state.financialContext);
  const lithium = lithiumTotals(state.financialContext, state.lithiumScenario);
  const label = state.metricLabel;

  if (text === 'WAKTU HENTI') return 'LEAD ACID / BULAN';
  if (label === 'WAKTU HENTI' && /^-\d+(?:[.,]\d+)?%$/.test(text)) return lead.monthlyKnown > 0 ? compactRupiah(lead.monthlyKnown) : 'Belum dihitung';
  if (label === 'WAKTU HENTI' && text === 'Potensi pengurangan') return 'Biaya operasi saat ini';

  if (text === 'EFISIENSI ENERGI') return 'LITHIUM-ION / BULAN';
  if (label === 'EFISIENSI ENERGI' && /^\+?\d+(?:[.,]\d+)?%$/.test(text)) return lithium.complete ? compactRupiah(lithium.monthlyKnown) : 'Belum diisi';
  if (label === 'EFISIENSI ENERGI' && text === 'Potensi peningkatan') return 'Skenario input user';

  if (text === 'PERAWATAN') return 'SELISIH / BULAN';
  if (label === 'PERAWATAN' && /^-\d+(?:[.,]\d+)?%$/.test(text)) {
    if (!lithium.complete) return 'Butuh data';
    return compactRupiah(Math.abs(lithium.gap));
  }
  if (label === 'PERAWATAN' && text === 'Potensi pengurangan pekerjaan rutin') {
    if (!lithium.complete) return 'Lengkapi skenario Lithium-ion';
    return lithium.gap >= 0 ? 'Potensi gap operating cost' : 'Skenario lebih tinggi';
  }

  if (text === 'KESESUAIAN') return 'STATUS';
  if (label === 'KESESUAIAN' && /^(Tinggi|Sedang|Rendah)$/i.test(text)) {
    if (!lithium.complete) return 'Butuh data';
    return lithium.gap > 0 ? 'Layak evaluasi' : 'Kaji ulang';
  }
  if (label === 'KESESUAIAN' && text === 'Terhadap shift & jam operasi') return 'Technical + financial fit';

  return null;
}

function pageSevenReplacement(instance: jsPDF, text: string, state: PdfReportState): string[] | null {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const lead = financialTotals(state.financialContext);
  const lithium = lithiumTotals(state.financialContext, state.lithiumScenario);

  if (normalized.startsWith('Pada armada')) {
    const replacement = lithium.complete
      ? lithium.gap >= 0
        ? `Lead Acid saat ini ${rupiah(lead.monthlyKnown)}/bulan. Skenario Lithium-ion ${rupiah(lithium.monthlyKnown)}/bulan. Selisih ${rupiah(lithium.gap)}/bulan atau ${rupiah(lithium.annualGap)}/tahun. Ini skenario berbasis input user, bukan jaminan saving.`
        : `Lead Acid saat ini ${rupiah(lead.monthlyKnown)}/bulan. Skenario Lithium-ion ${rupiah(lithium.monthlyKnown)}/bulan, lebih tinggi ${rupiah(Math.abs(lithium.gap))}/bulan. Evaluasi harus kembali ke kebutuhan availability dan kompatibilitas teknis.`
      : `Biaya operasional Lead Acid yang teridentifikasi ${rupiah(lead.monthlyKnown)}/bulan. Lengkapi skenario downtime, maintenance, dan charging Lithium-ion untuk menghasilkan perbandingan Rupiah yang setara.`;
    return (instance as any).splitTextToSize(replacement, 132).slice(0, 5);
  }

  const bullets: Array<[string, string]> = [
    ['Berapa jam forklift benar-benar dibutuhkan', 'Bandingkan Lead Acid dan Lithium-ion pada periode bulanan yang sama.'],
    ['Apakah waktu pengisian saat ini', 'Gunakan target downtime Lithium-ion dari benchmark, pilot, atau proposal teknis.'],
    ['Berapa kali unit berhenti karena battery', 'Validasi charger, BMS, konektor, dimensi, kapasitas, temperatur, dan duty cycle.'],
    ['Apakah tersedia waktu istirahat', 'Konfirmasi charging window saat break untuk operasi multi-shift.'],
    ['Apakah charger, konektor, dan ruang battery', 'Gunakan selisih OPEX sebagai dasar evaluasi teknis-komersial, bukan jaminan saving.'],
    ['Apakah pain point charging', 'Jika gap biaya signifikan dan kompatibilitas lolos, lanjutkan proposal teknis Lithium-ion.'],
    ['Apakah potensi pengurangan beban sekitar Rp', 'Jika gap biaya signifikan dan kompatibilitas lolos, lanjutkan proposal teknis Lithium-ion.'],
  ];

  for (const [prefix, replacement] of bullets) {
    if (normalized.startsWith(prefix)) return (instance as any).splitTextToSize(replacement, 158).slice(0, 2);
  }

  return null;
}

function pageEightReplacement(instance: jsPDF, text: string, state: PdfReportState): string[] | null {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const lithium = lithiumTotals(state.financialContext, state.lithiumScenario);

  if (normalized === 'Lanjutkan ke Pemeriksaan Teknis Lapangan') {
    return ['Lanjutkan Evaluasi Teknis Lithium-ion'];
  }

  if (normalized.startsWith('Lanjutkan ke pemeriksaan teknis lapangan untuk menentukan apakah Lead Acid')) {
    const comparison = lithium.complete && lithium.gap > 0
      ? ` Perbandingan operating cost juga menunjukkan gap ${rupiah(lithium.gap)}/bulan berdasarkan skenario yang diisi user.`
      : '';
    const replacement = `Data assessment memberi dasar untuk melanjutkan evaluasi teknis Lithium-ion.${comparison} Validasi charger, BMS, konektor, dimensi, kapasitas, temperatur, dan duty cycle sebelum proposal komersial.`;
    return (instance as any).splitTextToSize(replacement, 154).slice(0, 4);
  }

  if (normalized.startsWith('Jadwalkan pemeriksaan teknis bersama DRRKOBE')) {
    const replacement = 'Jadwalkan technical assessment DRRKOBE untuk memvalidasi kompatibilitas dan menyusun proposal Lithium-ion berdasarkan data site.';
    return (instance as any).splitTextToSize(replacement, 154).slice(0, 3);
  }

  return null;
}

function pageThreeReplacement(instance: jsPDF, text: string, state: PdfReportState): string[] | null {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const runtime = state.runtimeDetail || 'runtime yang dilaporkan';
  const charging = state.chargingDetail || 'durasi charging yang dilaporkan';
  const downtime = state.financialContext.actualDowntimeHoursPerUnitMonth !== null
    ? `${state.financialContext.actualDowntimeHoursPerUnitMonth} jam/bulan`
    : state.downtimeDetail || 'downtime yang dilaporkan';
  const operation = state.operationDetail || 'pola operasi yang dilaporkan';

  if (!normalized.startsWith('Kondisi battery menunjukkan risiko operasional tinggi.')) return null;

  const replacement = `Runtime ${runtime}, charging ${charging}, dan downtime ${downtime} tidak selaras dengan ${operation}. Urutan solusi: uji kapasitas aktual, cek cell/temperatur, verifikasi charger, lalu cocokkan charging window dengan shift. Jika bottleneck tetap berasal dari battery dan charging, Lithium-ion menjadi kandidat teknis berikutnya.`;
  return (instance as any).splitTextToSize(replacement, 94).slice(0, 7);
}

function validateSingleText(value: string, state: PdfReportState, page: number): string {
  const text = normalizePdfText(value);
  captureDiagnosisEvidence(text, state);
  trackMetricLabel(text, state);

  if (page === 4 && text === 'Apa artinya bagi operasi sehari-hari?') return 'Tindakan operasional yang disarankan';

  if (page === 7) {
    const metric = pageSevenMetric(text, state);
    if (metric) return metric;

    const replacements: Record<string, string> = {
      '06 / POTENSI PERBAIKAN': '06 / BUSINESS CASE LITHIUM-ION',
      'Apa yang mungkin diperoleh bila pola': 'Perbandingan biaya operasional',
      'operasi diperbaiki?': 'Lead Acid vs Lithium-ion',
      'Persentase di bawah adalah skenario awal untuk membantu pembahasan. Nilai aktual harus dibuktikan dengan data': 'Bandingkan biaya Lead Acid aktual dengan skenario Lithium-ion yang diisi user.',
      'operasi dan pemeriksaan lapangan.': 'Harga battery / CAPEX tidak termasuk dalam perbandingan ini.',
      'Pertanyaan yang perlu dijawab sebelum keputusan investasi': 'Dasar keputusan menuju Lithium-ion',
    };
    if (replacements[text]) return replacements[text];
  }

  if (page === 8) {
    if (text === 'Lanjutkan ke Pemeriksaan Teknis Lapangan') return 'Lanjutkan Evaluasi Teknis Lithium-ion';
  }

  if (text === 'PERKIRAAN BEBAN OPERASIONAL SETAHUN') {
    state.replaceNextFinancialAmount = true;
    const totals = financialTotals(state.financialContext);
    if (totals.monthlyKnown <= 0) return 'STATUS PERHITUNGAN FINANSIAL';
    return totals.downtimeComplete ? 'TOTAL BIAYA OPERASIONAL / BULAN' : 'SUBTOTAL BIAYA TERIDENTIFIKASI / BULAN';
  }

  if (state.replaceNextFinancialAmount && /^Rp\s/i.test(text)) {
    state.replaceNextFinancialAmount = false;
    const totals = financialTotals(state.financialContext);
    return totals.monthlyKnown > 0 ? rupiah(totals.monthlyKnown) : 'Belum final';
  }

  const evidenceValue = evidenceValueForMetric(text, state);
  if (evidenceValue) return evidenceValue;

  const metricNote = metricNoteReplacement(text, state);
  if (metricNote) return metricNote;

  if (text === 'berdasarkan data biaya dan data operasi yang tersedia') {
    const totals = financialTotals(state.financialContext);
    if (totals.monthlyKnown <= 0) return 'Data biaya belum cukup untuk dihitung.';
    return totals.downtimeComplete
      ? `Estimasi tahunan berdasarkan data user: ${rupiah(totals.annualKnown)}.`
      : `Subtotal tahunan data yang diketahui: ${rupiah(totals.annualKnown)}; downtime belum termasuk.`;
  }

  if (text.startsWith('Skenario potensi pengurangan beban:')) {
    return 'Perbandingan Lithium-ion menggunakan skenario yang diisi user, bukan persentase generik.';
  }

  return layoutSafeCopy(text);
}

function transformText(instance: jsPDF, input: string | string[], state: PdfReportState): string | string[] {
  const page = Number((instance as any).getCurrentPageInfo?.()?.pageNumber || (instance as any).internal?.getCurrentPageInfo?.()?.pageNumber || 1);

  if (Array.isArray(input)) {
    const normalizedLines = input.map((line) => normalizePdfText(String(line)));
    const joined = normalizedLines.join(' ').replace(/\s+/g, ' ').trim();
    captureDiagnosisEvidence(joined, state);

    if (state.replaceNextFinancialAmount && /^Rp\s/i.test(joined)) {
      state.replaceNextFinancialAmount = false;
      const totals = financialTotals(state.financialContext);
      return totals.monthlyKnown > 0 ? rupiah(totals.monthlyKnown) : 'Belum final';
    }

    if (page === 3) {
      const replacement = pageThreeReplacement(instance, joined, state);
      if (replacement) return replacement;
    }
    if (page === 4) {
      const replacement = pageFourReplacement(instance, joined, state);
      if (replacement) return replacement;
    }
    if (page === 7) {
      const replacement = pageSevenReplacement(instance, joined, state);
      if (replacement) return replacement;
    }
    if (page === 8) {
      const replacement = pageEightReplacement(instance, joined, state);
      if (replacement) return replacement;
    }

    if (normalizedLines.length === 1) return validateSingleText(normalizedLines[0], state, page);

    if (state.metricLabel === 'WAKTU HENTI' && /^\d+(?:[.,]\d+)?\s+jam\/bln$/i.test(joined)) {
      const actual = state.financialContext.actualDowntimeHoursPerUnitMonth;
      return actual !== null ? `${actual} jam/bln` : state.downtimeDetail || joined;
    }
    if (state.metricLabel === 'PENGISIAN DAYA' && /^\d+(?:[.,]\d+)?\s+jam\/bln$/i.test(joined)) {
      return state.chargingDetail ? `${state.chargingDetail} / siklus` : joined;
    }

    return normalizedLines.map((line) => validateSingleText(line, state, page));
  }

  if (page === 8) {
    const replacement = pageEightReplacement(instance, normalizePdfText(input), state);
    if (replacement) return replacement;
  }

  return validateSingleText(input, state, page);
}

function drawFinancialChart(instance: jsPDF, context: FinancialContext) {
  const totals = financialTotals(context);
  if (totals.monthlyKnown <= 0) return;

  const originalPage = Number((instance as any).getCurrentPageInfo?.()?.pageNumber || 8);
  try {
    instance.setPage(5);
    const rows = [
      { label: 'Downtime', value: totals.monthlyDowntime },
      { label: 'Perawatan', value: totals.monthlyMaintenance },
      { label: 'Pengisian', value: totals.monthlyCharging },
    ];
    const maxValue = Math.max(1, ...rows.map((row) => row.value));

    instance.setFillColor(252, 252, 249);
    instance.rect(18, 238, 174, 37, 'F');
    instance.setFont('helvetica', 'bold');
    instance.setFontSize(7.4);
    instance.setTextColor(10, 10, 10);
    instance.text('STRUKTUR BIAYA LEAD ACID / BULAN - DATA USER', 18, 243);

    rows.forEach((row, index) => {
      const y = 250 + index * 8;
      instance.setFont('helvetica', 'bold');
      instance.setFontSize(6.4);
      instance.setTextColor(82, 82, 91);
      instance.text(row.label, 18, y);
      instance.setFillColor(228, 228, 231);
      instance.roundedRect(48, y - 3, 79, 3.4, 1.7, 1.7, 'F');
      if (row.value > 0) {
        instance.setFillColor(255, 204, 0);
        instance.roundedRect(48, y - 3, Math.max(2, (79 * row.value) / maxValue), 3.4, 1.7, 1.7, 'F');
      }
      instance.setFont('helvetica', 'bold');
      instance.setFontSize(6.4);
      instance.setTextColor(10, 10, 10);
      instance.text(row.value > 0 ? rupiah(row.value) : 'Belum dihitung', 190, y, { align: 'right' });
    });
  } finally {
    instance.setPage(originalPage);
  }
}

function drawLithiumComparisonChart(instance: jsPDF, context: FinancialContext, scenario: LithiumScenario) {
  const lead = financialTotals(context);
  if (lead.monthlyKnown <= 0) return;
  const lithium = lithiumTotals(context, scenario);

  const originalPage = Number((instance as any).getCurrentPageInfo?.()?.pageNumber || 8);
  try {
    instance.setPage(7);
    instance.setFillColor(252, 252, 249);
    instance.rect(18, 222, 174, 50, 'F');

    instance.setFont('helvetica', 'bold');
    instance.setFontSize(7.4);
    instance.setTextColor(10, 10, 10);
    instance.text('PERBANDINGAN OPERATING COST / BULAN', 18, 228);

    const leadValue = lead.monthlyKnown;
    const lithiumValue = lithium.complete ? lithium.monthlyKnown : 0;
    const maxValue = Math.max(1, leadValue, lithiumValue);
    const rows = [
      { label: 'Lead Acid saat ini', value: leadValue, available: true },
      { label: 'Lithium-ion scenario', value: lithiumValue, available: lithium.complete },
    ];

    rows.forEach((row, index) => {
      const y = 237 + index * 10;
      instance.setFont('helvetica', 'bold');
      instance.setFontSize(6.3);
      instance.setTextColor(82, 82, 91);
      instance.text(row.label, 18, y);
      instance.setFillColor(228, 228, 231);
      instance.roundedRect(58, y - 3, 69, 3.8, 1.9, 1.9, 'F');
      if (row.available && row.value > 0) {
        instance.setFillColor(255, 204, 0);
        instance.roundedRect(58, y - 3, Math.max(2, (69 * row.value) / maxValue), 3.8, 1.9, 1.9, 'F');
      }
      instance.setFont('helvetica', 'bold');
      instance.setFontSize(6.3);
      instance.setTextColor(10, 10, 10);
      instance.text(row.available ? rupiah(row.value) : 'Belum diisi', 190, y, { align: 'right' });
    });

    instance.setFillColor(255, 204, 0);
    instance.roundedRect(18, 255, 174, 9, 2, 2, 'F');
    instance.setFont('helvetica', 'bold');
    instance.setFontSize(6.5);
    instance.setTextColor(10, 10, 10);
    const gapText = lithium.complete
      ? lithium.gap >= 0
        ? `POTENSI GAP OPEX: ${rupiah(lithium.gap)} / bulan | ${rupiah(lithium.annualGap)} / tahun`
        : `SKENARIO LITHIUM-ION LEBIH TINGGI: ${rupiah(Math.abs(lithium.gap))} / bulan`
      : 'LENGKAPI 3 INPUT LITHIUM-ION UNTUK MENGHITUNG GAP OPEX';
    instance.text(gapText, 22, 261);

    instance.setFont('helvetica', 'normal');
    instance.setFontSize(5.4);
    instance.setTextColor(82, 82, 91);
    instance.text('Skenario berbasis input user; bukan harga battery, quotation, atau jaminan saving.', 18, 269);
  } finally {
    instance.setPage(originalPage);
  }
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
        runtimeDetail: null,
        operationDetail: null,
        productivityReported: false,
        replaceNextFinancialAmount: false,
        financialContext: readFinancialContext(),
        lithiumScenario: readLithiumScenario(),
      };

      const originalText = instance.text;
      const originalGetTextWidth = instance.getTextWidth;
      const originalSave = (instance as any).save.bind(instance);
      let chartsDrawn = false;

      instance.getTextWidth = ((text: string) => {
        return originalGetTextWidth.call(instance, normalizePdfText(String(text)));
      }) as jsPDF['getTextWidth'];

      instance.text = ((text: string | string[], ...args: unknown[]) => {
        const safeText = transformText(instance, text, reportState);
        return (originalText as (...params: unknown[]) => jsPDF).call(instance, safeText, ...args);
      }) as jsPDF['text'];

      (instance as any).save = (...args: unknown[]) => {
        if (!chartsDrawn) {
          chartsDrawn = true;
          drawFinancialChart(instance, reportState.financialContext);
          drawLithiumComparisonChart(instance, reportState.financialContext, reportState.lithiumScenario);
        }
        return originalSave(...args);
      };
    },
  ]);
}

export default function PdfTextSafety() {
  return null;
}
