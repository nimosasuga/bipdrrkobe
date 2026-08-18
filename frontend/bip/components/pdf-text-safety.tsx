'use client';

import { jsPDF } from 'jspdf';

type JsPdfApiWithGuard = typeof jsPDF.API & {
  __drrkobePdfTextSafetyRegistered?: boolean;
};

type JsPdfInstanceWithGuard = jsPDF & {
  __drrkobePdfTextSafetyPatched?: boolean;
};

type PdfClaimState = {
  replaceNextFinancialAmount: boolean;
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

function validatePublicClaim(value: string, state: PdfClaimState): string {
  const text = normalizePdfText(value);

  if (text === 'PERKIRAAN BEBAN OPERASIONAL SETAHUN') {
    state.replaceNextFinancialAmount = true;
    return 'STATUS VALIDASI FINANSIAL';
  }

  if (state.replaceNextFinancialAmount && /^Rp\s/i.test(text)) {
    state.replaceNextFinancialAmount = false;
    return 'Pending Site Validation';
  }

  if (text === 'berdasarkan data biaya dan data operasi yang tersedia') {
    return 'Baseline biaya dan durasi downtime perlu diverifikasi sebelum perhitungan.';
  }

  if (text.startsWith('Skenario potensi pengurangan beban:')) {
    return 'Potensi pengurangan beban: perlu validasi baseline dan target teknis.';
  }

  if (/^\d+(?:[.,]\d+)?\s+jam\/bln$/i.test(text)) {
    return 'Perlu data aktual';
  }

  if (/^\d+(?:[.,]\d+)?x\/thn$/i.test(text)) {
    return 'Perlu baseline';
  }

  if (/^-\d+(?:[.,]\d+)?%$/.test(text) || text === '+28%') {
    return 'Perlu validasi';
  }

  const replacements: Record<string, string> = {
    '8-12 jam, kemudian masa pendinginan': 'Ikuti spesifikasi battery dan charger',
    'Sekitar 1,5-2,5 jam; dapat diisi saat jeda operasi': 'Validasi battery, charger, BMS, dan prosedur site',
    'Sekitar 1.200 siklus': 'Perlu validasi spesifikasi',
    'Sekitar 3.000+ siklus': 'Perlu validasi spesifikasi',
    'Sekitar 75-80%': 'Perlu pengukuran site',
    'Dapat mencapai sekitar 95%+': 'Perlu pengukuran site',
    '06 / POTENSI PERBAIKAN': '06 / VALIDASI KEBUTUHAN OPERASI',
    'Apa yang mungkin diperoleh bila pola operasi diperbaiki?': 'Data apa yang dibutuhkan sebelum menghitung manfaat?',
    'Persentase di bawah adalah skenario awal untuk membantu pembahasan. Nilai aktual harus dibuktikan dengan data operasi dan pemeriksaan lapangan.': 'Saving, pengurangan downtime, dan ROI tidak dihitung otomatis tanpa baseline operasi dan data site yang dapat diverifikasi.',
  };

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

      const claimState: PdfClaimState = { replaceNextFinancialAmount: false };
      const originalText = instance.text;
      const originalGetTextWidth = instance.getTextWidth;

      instance.getTextWidth = ((text: string) => {
        return originalGetTextWidth.call(instance, normalizePdfText(String(text)));
      }) as jsPDF['getTextWidth'];

      instance.text = ((text: string | string[], ...args: unknown[]) => {
        const safeText = Array.isArray(text)
          ? text.map((line) => validatePublicClaim(String(line), claimState))
          : validatePublicClaim(String(text), claimState);

        return (originalText as (...params: unknown[]) => jsPDF).call(instance, safeText, ...args);
      }) as jsPDF['text'];
    },
  ]);
}

export default function PdfTextSafety() {
  return null;
}
