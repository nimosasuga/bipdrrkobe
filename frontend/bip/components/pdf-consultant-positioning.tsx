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

function lifetimeLeadText(age: number | null): string {
  return age !== null
    ? `Lead Acid saat ini ${age} tahun; performa dipengaruhi usia & duty cycle`
    : 'Lead Acid saat ini; performa dipengaruhi usia & duty cycle';
}

function lifetimeNarrative(age: number | null): string {
  const ageText = age !== null
    ? `Battery Lead Acid saat ini telah digunakan ${age} tahun. `
    : '';

  return `LIFETIME ADVANTAGE — ${ageText}Lithium-ion menawarkan potensi cycle life yang lebih panjang dan performa yang lebih konsisten untuk operasi intensif. Nilai umur pakai aktual tetap bergantung pada duty cycle, temperatur, depth of discharge, kapasitas, dan strategi charging. Validasi spesifikasi melalui Technical Assessment DRRKOBE sebelum keputusan investasi.`;
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

  // Charger fault/error dikeluarkan dari scope diagnosis. Charging duration/window
  // tetap dipertahankan sebagai data operasional dan bahan compatibility assessment.
  if (/^Gangguan pada charger:/i.test(joined)) return '';
  if (joined === 'Pengisian Battery Terlalu Lama / Charger Bermasalah') {
    return 'Pengisian Battery Terlalu Lama';
  }
  if (joined === 'Forklift Sering Berhenti Karena Battery / Charger') {
    return 'Forklift Sering Berhenti Karena Battery / Proses Pengisian';
  }
  if (/^Indikasi gangguan siklus pengisian atau performa charger$/i.test(joined)) {
    return 'Charging window perlu diverifikasi terhadap kebutuhan operasi';
  }
  if (/^Uji charger dan kapasitas battery;/i.test(joined)) {
    return joined.replace(/^Uji charger dan kapasitas battery;/i, 'Verifikasi kapasitas battery dan charging window;');
  }

  if (page === 6) {
    if (joined === 'Umur siklus' || joined === 'Konsistensi daya') {
      return 'Lifetime advantage';
    }
    if (joined === 'Sekitar 1.200 siklus' || joined === 'Dipengaruhi usia & pemakaian') {
      return lifetimeLeadText(state.batteryAgeYears);
    }
    if (joined === 'Sekitar 3.000+ siklus' || joined === 'BMS bantu kelola charging') {
      return 'Potensi cycle life lebih panjang; validasi duty cycle & spesifikasi';
    }
    if (joined.startsWith('Lithium-ion tidak otomatis menjadi pilihan terbaik untuk setiap perusahaan.')) {
      return lifetimeNarrative(state.batteryAgeYears);
    }
  }

  if (page === 7) {
    if (joined.startsWith('Business case ini menghubungkan biaya Lead Acid')) {
      return 'Business case ini adalah dasar awal untuk Technical Assessment, bukan quotation. Nilai investasi final baru dibahas setelah kapasitas, charging strategy, BMS, konektor, dimensi battery, temperatur, duty cycle, dan kompatibilitas charger tervalidasi.';
    }
  }

  if (page === 8) {
    if (
      joined === 'Lanjutkan ke Pemeriksaan Teknis Lapangan'
      || joined === 'Lanjutkan Evaluasi Teknis Lithium-ion'
      || joined === 'Lanjutkan Evaluasi Lithium-ion'
    ) {
      return 'Technical Assessment Lithium-ion';
    }

    if (joined.startsWith('Lanjutkan ke pemeriksaan teknis lapangan untuk menentukan apakah Lead Acid')) {
      return 'Assessment awal menunjukkan alasan operasional untuk mengevaluasi Lithium-ion. Keputusan investasi dan harga final belum ditentukan pada tahap ini. DRRKOBE akan memvalidasi kapasitas, charging strategy, BMS, konektor, dimensi battery, temperatur, duty cycle, dan kompatibilitas charger terlebih dahulu.';
    }

    if (joined.startsWith('Data assessment memberi dasar untuk melanjutkan evaluasi teknis Lithium-ion.')) {
      return 'Assessment awal memberi dasar untuk melanjutkan Technical Assessment Lithium-ion. Keputusan investasi dan harga final belum ditentukan pada tahap ini. Validasi kapasitas, charging strategy, BMS, konektor, dimensi battery, temperatur, duty cycle, dan kompatibilitas charger dilakukan sebelum proposal komersial.';
    }

    if (
      joined.startsWith('Jadwalkan pemeriksaan teknis bersama DRRKOBE')
      || joined.startsWith('Jadwalkan technical assessment DRRKOBE')
    ) {
      return 'Jadwalkan Technical Assessment DRRKOBE. Proposal teknis dan penawaran harga final disusun setelah kompatibilitas unit dan kebutuhan site tervalidasi.';
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
