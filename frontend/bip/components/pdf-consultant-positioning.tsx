'use client';

import { jsPDF } from 'jspdf';

type JsPdfApiWithPositioning = typeof jsPDF.API & {
  __drrkobeConsultantPositioningRegistered?: boolean;
};

type JsPdfInstanceWithPositioning = jsPDF & {
  __drrkobeConsultantPositioningPatched?: boolean;
};

type PositioningState = {
  captureBatteryAge: boolean;
  batteryAgeYears: number | null;
};

const states = new WeakMap<jsPDF, PositioningState>();

function stateFor(instance: jsPDF): PositioningState {
  let state = states.get(instance);
  if (!state) {
    state = { captureBatteryAge: false, batteryAgeYears: null };
    states.set(instance, state);
  }
  return state;
}

function currentPage(instance: jsPDF): number {
  return Number(
    (instance as any).getCurrentPageInfo?.()?.pageNumber
      || (instance as any).internal?.getCurrentPageInfo?.()?.pageNumber
      || 1,
  );
}

function normalize(input: string | string[]): string {
  const values = Array.isArray(input) ? input.map(String) : [String(input)];
  return values.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * IMPORTANT: this component runs after the core PDF layout has already measured
 * its original copy. Any longer replacement must therefore be wrapped again
 * before it is passed to jsPDF. Returning a raw long string here can bypass the
 * core fitTextBlock()/paragraph() wrapping and cause text to leave the page.
 */
function wrappedText(instance: jsPDF, text: string, width: number, maxLines: number): string[] {
  const result = (instance as any).splitTextToSize(text, width);
  const lines = Array.isArray(result) ? result.map(String) : [String(result)];
  return lines.slice(0, maxLines);
}

function lifetimeLeadText(age: number | null): string {
  return age !== null
    ? `Lead Acid saat ini ${age} tahun; baseline BIP ~1.200 siklus`
    : 'Lead Acid saat ini; baseline BIP ~1.200 siklus';
}

function lifetimeNarrative(age: number | null): string {
  const ageText = age !== null
    ? `Lead Acid saat ini ${age} tahun. `
    : '';

  return `LIFETIME ADVANTAGE - ${ageText}Baseline BIP: ~1.200 siklus Lead Acid vs ~3.000+ siklus Lithium-ion (>2x cycle potential). Nilai aktual tetap bergantung pada duty cycle dan kondisi site; validasi melalui Technical Assessment DRRKOBE.`;
}

function sanitizeOperationalChargerFaultCopy(text: string): string {
  return text
    .replace(/Pengisian Battery Terlalu Lama \/ Charger Bermasalah/gi, 'Pengisian Battery Terlalu Lama')
    .replace(/Forklift Sering Berhenti Karena Battery \/ Charger/gi, 'Forklift Sering Berhenti Karena Battery / Proses Pengisian')
    .replace(/battery\s*\/\s*charger/gi, 'battery / proses pengisian')
    .replace(/battery atau charger/gi, 'battery atau proses pengisian')
    .replace(/kapasitas battery, kondisi charger, dan charging window/gi, 'kapasitas battery dan charging window')
    .replace(/indikasi gangguan siklus pengisian atau performa charger/gi, 'charging window perlu diverifikasi terhadap kebutuhan operasi')
    .replace(/gangguan pada charger\s*:\s*[^.,;]*/gi, '')
    .replace(/charger\s+(bermasalah|error|mengalami gangguan|failure|fault|issue|problem)/gi, 'charging window belum tervalidasi')
    .replace(/(gangguan|error|failure|fault)\s+(pada\s+)?charger/gi, 'charging window yang belum tervalidasi')
    .replace(/performa charger/gi, 'charging window')
    .replace(/verifikasi charger/gi, 'verifikasi charging window')
    .replace(/uji charger dan kapasitas battery/gi, 'verifikasi kapasitas battery dan charging window')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function operationalReplacement(
  instance: jsPDF,
  page: number,
  original: string | string[],
  text: string,
): string | string[] {
  if (!Array.isArray(original) && text.length < 80) return text;

  if (page === 3) return wrappedText(instance, text, 92, 7);
  if (page === 4) return wrappedText(instance, text, 128, 4);
  if (page === 5) return wrappedText(instance, text, 146, 4);

  return wrappedText(instance, text, 146, 6);
}

function transformPositioningText(instance: jsPDF, input: string | string[]): string | string[] {
  const page = currentPage(instance);
  const joined = normalize(input);
  const state = stateFor(instance);

  if (joined === 'UMUR BATTERY') {
    state.captureBatteryAge = true;
    return input;
  }

  if (state.captureBatteryAge) {
    const match = joined.match(/^(\d+(?:[.,]\d+)?)\s*tahun$/i);
    if (match) {
      state.batteryAgeYears = Number(match[1].replace(',', '.'));
      state.captureBatteryAge = false;
    }
  }

  // Halaman diagnosis/operasional tidak mendiagnosis fault charger. Charger hanya
  // kembali muncul pada halaman evaluasi sebagai compatibility item Technical Assessment.
  // Bila copy berubah, wrap ulang karena input dari guard sebelumnya dapat berupa array
  // yang sudah disesuaikan dengan lebar layout.
  if (page <= 5) {
    if (/^Gangguan pada charger:/i.test(joined)) return '';
    const sanitized = sanitizeOperationalChargerFaultCopy(joined);
    if (sanitized !== joined) return operationalReplacement(instance, page, input, sanitized);
  }

  if (page === 6) {
    if (joined === 'Umur siklus' || joined === 'Konsistensi daya') {
      return 'Lifetime advantage';
    }
    if (joined === 'Sekitar 1.200 siklus' || joined === 'Dipengaruhi usia & pemakaian') {
      return wrappedText(instance, lifetimeLeadText(state.batteryAgeYears), 47, 4);
    }
    if (joined === 'Sekitar 3.000+ siklus' || joined === 'BMS bantu kelola charging') {
      return wrappedText(instance, 'Baseline BIP ~3.000+ siklus; >2x cycle potential', 50, 4);
    }
    if (joined.startsWith('Lithium-ion tidak otomatis menjadi pilihan terbaik untuk setiap perusahaan.')) {
      return wrappedText(instance, lifetimeNarrative(state.batteryAgeYears), 138, 5);
    }
  }

  if (page === 7) {
    if (joined.startsWith('Business case ini menghubungkan biaya Lead Acid')) {
      const replacement = 'Business case ini adalah dasar awal untuk Technical Assessment, bukan quotation. Nilai investasi final baru dibahas setelah kapasitas, charging strategy, BMS, konektor, dimensi battery, temperatur, duty cycle, dan kompatibilitas charger tervalidasi.';
      return wrappedText(instance, replacement, 138, 5);
    }
  }

  if (page === 8) {
    if (
      joined === 'Lanjutkan ke Pemeriksaan Teknis Lapangan'
      || joined === 'Lanjutkan Evaluasi Teknis Lithium-ion'
      || joined === 'Lanjutkan Evaluasi Lithium-ion'
    ) {
      return wrappedText(instance, 'Technical Assessment Lithium-ion', 150, 2);
    }

    if (joined.startsWith('Lanjutkan ke pemeriksaan teknis lapangan untuk menentukan apakah Lead Acid')) {
      const replacement = 'Assessment awal menunjukkan alasan operasional untuk mengevaluasi Lithium-ion. Harga final belum ditentukan pada tahap ini. DRRKOBE memvalidasi kapasitas, charging strategy, BMS, konektor, dimensi battery, temperatur, duty cycle, dan kompatibilitas charger terlebih dahulu.';
      return wrappedText(instance, replacement, 150, 4);
    }

    if (joined.startsWith('Data assessment memberi dasar untuk melanjutkan evaluasi teknis Lithium-ion.')) {
      const replacement = 'Assessment awal memberi dasar untuk Technical Assessment Lithium-ion. Harga final belum ditentukan pada tahap ini. Validasi kapasitas, charging strategy, BMS, konektor, dimensi battery, temperatur, duty cycle, dan kompatibilitas charger dilakukan sebelum proposal komersial.';
      return wrappedText(instance, replacement, 150, 4);
    }

    if (
      joined.startsWith('Jadwalkan pemeriksaan teknis bersama DRRKOBE')
      || joined.startsWith('Jadwalkan technical assessment DRRKOBE')
      || joined.startsWith('Jadwalkan Technical Assessment DRRKOBE')
    ) {
      const replacement = 'Jadwalkan Technical Assessment DRRKOBE. Proposal teknis dan harga final disusun setelah kompatibilitas unit dan kebutuhan site tervalidasi.';
      return wrappedText(instance, replacement, 148, 3);
    }
  }

  return input;
}

const api = jsPDF.API as JsPdfApiWithPositioning;

if (!api.__drrkobeConsultantPositioningRegistered) {
  api.__drrkobeConsultantPositioningRegistered = true;
  api.events.push([
    'initialized',
    function patchConsultantPositioning(this: jsPDF) {
      const instance = this as JsPdfInstanceWithPositioning;
      if (instance.__drrkobeConsultantPositioningPatched) return;
      instance.__drrkobeConsultantPositioningPatched = true;

      const originalText = instance.text;
      instance.text = ((text: string | string[], ...args: unknown[]) => {
        const next = transformPositioningText(instance, text);
        return (originalText as (...params: unknown[]) => jsPDF).call(instance, next, ...args);
      }) as jsPDF['text'];
    },
  ]);
}

export default function PdfConsultantPositioning() {
  return null;
}
