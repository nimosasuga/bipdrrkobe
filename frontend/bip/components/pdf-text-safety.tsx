'use client';

import { jsPDF } from 'jspdf';

type JsPdfApiWithGuard = typeof jsPDF.API & {
  __drrkobePdfTextSafetyRegistered?: boolean;
};

type JsPdfInstanceWithGuard = jsPDF & {
  __drrkobePdfTextSafetyPatched?: boolean;
};

type PdfReportState = {
  metricLabel: string | null;
  captureWateringValue: boolean;
  downtimeDetail: string | null;
  chargingDetail: string | null;
  wateringDetail: string | null;
  productivityReported: boolean;
  replaceNextAnnualAmount: boolean;
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

  if (label === 'WAKTU HENTI') {
    if (/^\d+(?:[.,]\d+)?\s+jam\/bln$/i.test(text) || /^-\d+(?:[.,]\d+)?%$/.test(text)) {
      return state.downtimeDetail || 'Frekuensi belum tersedia';
    }
  }

  if (label === 'PENGISIAN DAYA') {
    if (/^\d+(?:[.,]\d+)?\s+jam\/bln$/i.test(text)) {
      return state.chargingDetail ? `${state.chargingDetail} / siklus` : 'Durasi belum tersedia';
    }
  }

  if (label === 'PERAWATAN') {
    if (/^\d+(?:[.,]\d+)?x\/thn$/i.test(text) || /^-\d+(?:[.,]\d+)?%$/.test(text)) {
      return state.wateringDetail || 'Pola perawatan belum tersedia';
    }
  }

  if (label === 'PRODUKTIVITAS' && /^-\d+(?:[.,]\d+)?%$/.test(text)) {
    return state.productivityReported ? 'Terdampak' : 'Belum dilaporkan';
  }

  if (label === 'EFISIENSI ENERGI' && /^\+?\d+(?:[.,]\d+)?%$/.test(text)) {
    return 'Belum diukur';
  }

  if (label === 'WAKTU HENTI / BULAN' && /^Rp\s/i.test(text)) {
    return 'Perlu durasi aktual';
  }

  return null;
}

function metricNoteReplacement(text: string, state: PdfReportState): string | null {
  const label = state.metricLabel;

  if (label === 'WAKTU HENTI' && (text === 'Perkiraan unit tidak produktif' || text === 'Potensi pengurangan')) {
    return 'Frekuensi yang dilaporkan';
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
    return 'Biaya/jam tersedia; durasi kejadian belum diukur';
  }

  return null;
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
    return 'STATUS PERHITUNGAN FINANSIAL';
  }

  if (state.replaceNextAnnualAmount && /^Rp\s/i.test(text)) {
    state.replaceNextAnnualAmount = false;
    return 'Belum dapat ditotal';
  }

  if (text === 'berdasarkan data biaya dan data operasi yang tersedia') {
    return 'Biaya maintenance dan charging tersedia. Durasi downtime aktual belum tersedia.';
  }

  if (text.startsWith('Skenario potensi pengurangan beban:')) {
    return 'Potensi pengurangan beban dihitung setelah baseline dan target teknis tervalidasi.';
  }

  const replacements: Record<string, string> = {
    '05 / LEAD ACID DAN LITHIUM-ION': '05 / MASALAH LEAD ACID & KEUNGGULAN LITHIUM-ION',
    'Apa yang berubah bila teknologinya berbeda?': 'Masalah Lead Acid vs Keunggulan Lithium-ion',
    'Perbandingan ini digunakan untuk memahami konsekuensi terhadap cara kerja. Harga battery tidak ditampilkan pada tahap penilaian.': 'Fokus pada pain point yang dilaporkan: charging, routine maintenance, dan kesiapan unit. Harga battery tidak ditampilkan pada tahap penilaian.',
    'PARAMETER': 'MASALAH / KEBUTUHAN',
    'LITHIUM-ION UNTUK DIEVALUASI': 'BAGAIMANA LITHIUM-ION MEMBANTU',
    'Waktu pengisian': 'Charging window',
    '8-12 jam, kemudian masa pendinginan': 'Membutuhkan siklus charging dan recovery yang disiplin.',
    'Sekitar 1,5-2,5 jam; dapat diisi saat jeda operasi': 'Opportunity charging dapat membantu menjaga kesiapan unit bila battery, charger, BMS, dan unit kompatibel.',
    'Umur siklus': 'Konsistensi daya',
    'Sekitar 1.200 siklus': 'Dipengaruhi umur, depth of discharge, charging, temperatur, dan maintenance.',
    'Sekitar 3.000+ siklus': 'BMS membantu mengelola charging/discharging; kapasitas dan duty cycle tetap perlu diverifikasi.',
    'Perawatan rutin': 'Routine battery care',
    'Isi air, equalizing, dan pembersihan': 'Memerlukan watering, equalizing, kebersihan, dan pemeriksaan terminal sesuai kebutuhan.',
    'Tidak memerlukan isi air atau equalizing rutin': 'Tidak membutuhkan watering atau equalizing; pemeriksaan beralih ke BMS, charger, konektor, dan temperatur.',
    'Efisiensi energi': 'Availability saat charging',
    'Sekitar 75-80%': 'Charging window dapat berbenturan dengan kebutuhan jam operasi.',
    'Dapat mencapai sekitar 95%+': 'Charging yang lebih fleksibel dapat mengurangi konflik dengan jam operasi; dampak aktual perlu diukur.',
    'Operasi multi-shift': 'Operasi multi-shift',
    'Membutuhkan waktu pengisian dan rotasi battery': 'Charging window dan rotasi battery perlu dijaga agar unit tetap siap.',
    'Lebih fleksibel untuk pengisian saat jeda': 'Opportunity charging dapat menjadi keunggulan pada operasi multi-shift bila kompatibel.',
    'Aspek keselamatan': 'Penanganan battery',
    'Perlu penanganan asam dan ventilasi gas': 'Memerlukan pengendalian elektrolit/asam, ventilasi gas, kebersihan, dan PPE.',
    'Tanpa isi air; tetap perlu pengawasan Battery Management System (BMS)': 'Menghilangkan watering dan penanganan elektrolit rutin; tetap perlu pengawasan BMS, temperatur, charger, dan konektor.',
    'Lithium-ion tidak otomatis menjadi pilihan terbaik untuk setiap perusahaan. Kelayakannya bergantung pada pola kerja unit, charger, konektor, ruang battery, temperatur, jumlah shift, dan target kesiapan unit.': 'Lithium-ion layak dievaluasi bila pain point utama berasal dari charging window, watering/equalizing, routine maintenance, atau kebutuhan multi-shift. Kompatibilitas battery, charger, BMS, dimensi, konektor, kapasitas, dan duty cycle tetap harus diverifikasi.',
    '06 / POTENSI PERBAIKAN': '06 / VALIDASI KESESUAIAN LITHIUM-ION',
    'Apa yang mungkin diperoleh bila pola operasi diperbaiki?': 'Mengapa Lithium-ion layak dievaluasi untuk operasi ini?',
    'Persentase di bawah adalah skenario awal untuk membantu pembahasan. Nilai aktual harus dibuktikan dengan data operasi dan pemeriksaan lapangan.': 'Gunakan fakta diagnosis untuk melihat kecocokan awal Lithium-ion. Saving dan ROI baru dihitung setelah baseline operasi dan data site dapat diverifikasi.',
  };

  if (text.startsWith('Apakah potensi pengurangan beban sekitar Rp')) {
    return 'Apakah pengurangan downtime, charging window, dan routine maintenance cukup bernilai untuk dilanjutkan ke evaluasi investasi?';
  }

  return replacements[text] ?? text;
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
