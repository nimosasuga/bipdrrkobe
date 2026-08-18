'use client';

import { useEffect } from 'react';

function leaf(root: ParentNode, text: string): HTMLElement | null {
  return Array.from(root.querySelectorAll<HTMLElement>('*')).find((node) => node.children.length === 0 && node.textContent?.trim() === text) ?? null;
}

function sectionByTitle(title: string): HTMLElement | null {
  return Array.from(document.querySelectorAll<HTMLElement>('section')).find((section) => section.querySelector('h1')?.textContent?.includes(title)) ?? null;
}

function rewriteMetric(root: ParentNode, label: string, value: string, sub: string, nextLabel?: string) {
  const labelNode = leaf(root, label);
  const card = labelNode?.parentElement;
  if (!labelNode || !card || card.children.length < 3) return;
  if (nextLabel) labelNode.textContent = nextLabel;
  card.children[1].textContent = value;
  card.children[2].textContent = sub;
}

function validateStep6() {
  const section = sectionByTitle('Dampak Operasional Gabungan');
  if (!section) return;

  rewriteMetric(section, 'DOWNTIME', 'Perlu data aktual', 'Durasi kejadian belum diukur');
  rewriteMetric(section, 'CHARGING EXPOSURE', 'Berdasarkan input user', 'Gunakan durasi charging yang dilaporkan');
  rewriteMetric(section, 'MAINTENANCE', 'Perlu baseline', 'Gunakan frekuensi aktual di site');
  rewriteMetric(section, 'PRODUCTIVITY', 'Perlu validasi', 'Tidak dihitung tanpa waktu henti aktual');

  const heading = Array.from(section.querySelectorAll<HTMLElement>('div')).find((node) => node.children.length === 0 && node.textContent?.trim() === 'Kontribusi tiap masalah terhadap kondisi operasional');
  if (heading) heading.textContent = 'Sinyal dampak operasional yang perlu diverifikasi';

  Array.from(section.querySelectorAll<HTMLElement>('span')).forEach((node) => {
    if (/^\d+% bobot indikasi$/i.test(node.textContent?.trim() || '')) {
      node.textContent = 'Perlu verifikasi';
      const progress = node.parentElement?.nextElementSibling as HTMLElement | null;
      if (progress) progress.style.display = 'none';
    }
  });

  Array.from(section.querySelectorAll<HTMLElement>('p')).forEach((node) => {
    if (node.textContent?.includes('Angka di atas adalah indikator operasional')) {
      node.textContent = 'DRRKOBE tidak mengubah frekuensi kejadian menjadi jam downtime atau persentase productivity loss tanpa durasi kejadian aktual. Nilai finansial baru dihitung setelah data site tervalidasi.';
    }
  });
}

function validateStep7() {
  const section = sectionByTitle('Lead Acid vs Lithium-ion');
  if (!section) return;

  const replacements: Record<string, [string, string]> = {
    'Charging Time': [
      'Mengikuti siklus pengisian dan recovery sesuai spesifikasi battery/charger.',
      'Pengisian saat jeda dapat dievaluasi bila battery, charger, BMS, dan prosedur mendukung.',
    ],
    'Lifespan (cycles)': [
      'Dipengaruhi duty cycle, depth of discharge, temperatur, charging, dan disiplin perawatan.',
      'Dipengaruhi chemistry, BMS, duty cycle, temperatur, charging, dan batas operasi pabrikan.',
    ],
    Maintenance: [
      'Perlu pemeriksaan elektrolit/air, terminal, kebersihan, dan equalizing sesuai kebutuhan.',
      'Tidak menggunakan watering; tetap perlu pemeriksaan BMS, konektor, charger, dan temperatur.',
    ],
    'Energy Efficiency': [
      'Konsumsi dan efisiensi harus dibuktikan dari charger serta pengukuran aktual di site.',
      'Potensi efisiensi harus divalidasi dari spesifikasi teknis dan pengukuran aktual di site.',
    ],
    'Downtime Risk': [
      'Dipengaruhi kondisi battery, charging window, rotasi battery, charger, dan pola kerja.',
      'Dipengaruhi kapasitas, kompatibilitas, charging window, BMS, charger, dan pola kerja.',
    ],
    'Opportunity Charging': [
      'Hanya dilakukan bila diizinkan oleh spesifikasi battery, charger, dan prosedur site.',
      'Dapat menjadi opsi bila diizinkan oleh spesifikasi battery, charger, BMS, dan prosedur site.',
    ],
    'Safety / Emission': [
      'Perlu pengendalian ventilasi, elektrolit/asam, gas saat charging, dan PPE sesuai prosedur site.',
      'Perlu pengendalian BMS, temperatur, charger, konektor, dan prosedur keselamatan sesuai site.',
    ],
  };

  section.querySelectorAll<HTMLTableRowElement>('tbody tr').forEach((row) => {
    const cells = row.querySelectorAll<HTMLTableCellElement>('td');
    if (cells.length < 3) return;
    const replacement = replacements[cells[0].textContent?.trim() || ''];
    if (!replacement) return;
    cells[1].textContent = replacement[0];
    cells[2].textContent = replacement[1];
  });

  const lithiumHeader = Array.from(section.querySelectorAll<HTMLElement>('th')).find((node) => node.textContent?.includes('LI-ION'));
  if (lithiumHeader) lithiumHeader.textContent = 'LI-ION UNTUK DIEVALUASI';

  Array.from(section.querySelectorAll<HTMLElement>('div')).forEach((node) => {
    if (node.textContent?.includes('Perbandingan ini digunakan sebagai bahan evaluasi teknis dan operasional.')) {
      node.textContent = 'Perbandingan bersifat kualitatif. Nilai cycle life, charging time, efisiensi energi, temperatur, kompatibilitas, dan keselamatan harus diverifikasi terhadap datasheet battery/charger serta kondisi site. Tidak ada harga yang ditampilkan.';
    }
  });
}

function validateStep8() {
  const section = sectionByTitle('Hitung Potensi Efisiensi') || sectionByTitle('Validasi Kebutuhan Operasional');
  if (!section) return;

  const heading = section.querySelector('h1');
  if (heading?.textContent) heading.textContent = heading.textContent.replace('Hitung Potensi Efisiensi', 'Validasi Kebutuhan Operasional');

  const eyebrow = Array.from(section.querySelectorAll<HTMLElement>('div')).find((node) => node.children.length === 0 && node.textContent?.includes('STEP 8 / 9'));
  if (eyebrow) eyebrow.textContent = 'STEP 8 / 9 — OPERATIONAL READINESS';

  rewriteMetric(section, 'DOWNTIME', 'Perlu data aktual', 'Butuh durasi kejadian aktual', 'VALIDASI DOWNTIME');
  rewriteMetric(section, 'ENERGY', 'Perlu data charger', 'Butuh baseline konsumsi aktual', 'VALIDASI ENERGI');
  rewriteMetric(section, 'MAINTENANCE', 'Perlu baseline', 'Butuh aktivitas maintenance aktual', 'VALIDASI MAINTENANCE');
  const fitLabel = leaf(section, 'OPERATIONAL FIT');
  if (fitLabel) {
    fitLabel.textContent = 'KEBUTUHAN OPERASI';
    const card = fitLabel.parentElement;
    if (card?.children[2]) card.children[2].textContent = 'Indikator berdasarkan shift dan jam operasi';
  }

  Array.from(section.querySelectorAll<HTMLElement>('div')).forEach((node) => {
    const text = node.textContent?.trim() || '';
    if (text.includes('simulasi persentase adalah indikator awal')) {
      node.textContent = 'Catatan: tahap ini membaca kebutuhan operasi. DRRKOBE tidak menghasilkan persentase saving, pengurangan downtime, atau ROI sebelum baseline site tersedia.';
    }
    if (text.startsWith('Potensi operasional:')) {
      node.textContent = 'Dasar keputusan: jumlah unit, jam operasi, shift, charging window, downtime aktual, kondisi battery, dan kompatibilitas charger perlu dibaca bersama sebelum membahas potensi efisiensi atau investasi.';
    }
  });

  const operational = leaf(section, 'OPERATIONAL IMPACT')?.parentElement;
  if (operational) {
    const rows = operational.querySelectorAll<HTMLElement>('.flex.items-center.justify-between');
    rows.forEach((row) => {
      const label = row.querySelector('span')?.textContent?.trim();
      const value = row.querySelector('strong');
      if (!value) return;
      if (label === 'Downtime') value.textContent = 'Perlu durasi aktual';
      if (label === 'Charging') value.textContent = 'Lihat input charging';
      if (label === 'Maintenance') value.textContent = 'Lihat input perawatan';
      if (label === 'Productivity') value.textContent = 'Perlu validasi';
    });
  }

  const financial = leaf(section, 'FINANCIAL STATUS')?.parentElement;
  if (financial && financial.children.length >= 3) {
    financial.children[1].textContent = 'Pending Site Validation';
    financial.children[2].textContent = 'Nilai Rupiah, saving, dan ROI menunggu durasi downtime, baseline biaya, konsumsi, serta data maintenance yang tervalidasi.';
  }

  Array.from(section.querySelectorAll<HTMLElement>('p')).forEach((node) => {
    if (node.textContent?.startsWith('Tidak mengetahui biaya internal tidak menghambat diagnosis.')) {
      node.textContent = 'Tidak mengetahui biaya internal tidak menghambat diagnosis. Nilai Rupiah, saving, dan ROI tidak dihitung otomatis sampai durasi downtime, baseline biaya, konsumsi, serta biaya maintenance benar-benar tersedia.';
    }
  });
}

function validateWhatsapp() {
  document.querySelectorAll<HTMLAnchorElement>('a[href^="https://wa.me/"]').forEach((anchor) => {
    try {
      const url = new URL(anchor.href);
      const message = url.searchParams.get('text');
      if (!message) return;

      const filtered = message
        .split('\n')
        .filter((line) => !line.startsWith('Potensi pengurangan downtime:'))
        .filter((line) => !line.startsWith('Potensi peningkatan efisiensi energi:'))
        .filter((line) => !line.startsWith('Potensi pengurangan aktivitas maintenance:'))
        .filter((line) => !line.startsWith('Estimasi annual operating exposure:'))
        .filter((line) => !line.startsWith('Scenario annual saving potential:'))
        .map((line) => line === '*SIMULASI OPERASIONAL*' ? '*EVALUASI OPERASIONAL*' : line);

      if (!filtered.some((line) => line.includes('Saving / ROI:'))) {
        const shiftIndex = filtered.findIndex((line) => line.startsWith('Shift:'));
        if (shiftIndex >= 0) filtered.splice(shiftIndex + 1, 0, 'Saving / ROI: Menunggu baseline dan validasi data site');
      }

      url.searchParams.set('text', filtered.join('\n'));
      anchor.href = url.toString();
    } catch {
      // Link WhatsApp asli tetap dipertahankan bila parsing gagal.
    }
  });
}

export default function StepValidationGuard() {
  useEffect(() => {
    let queued = false;
    const apply = () => {
      queued = false;
      validateStep6();
      validateStep7();
      validateStep8();
      validateWhatsapp();
    };

    const queue = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(apply);
    };

    queue();
    const observer = new MutationObserver(queue);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
