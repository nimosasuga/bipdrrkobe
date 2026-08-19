'use client';

import { useEffect } from 'react';

function setText(node: Element | null | undefined, value: string) {
  if (node && node.textContent !== value) node.textContent = value;
}

function leaf(root: ParentNode, text: string): HTMLElement | null {
  return Array.from(root.querySelectorAll<HTMLElement>('*')).find(
    (node) => node.children.length === 0 && node.textContent?.trim() === text,
  ) ?? null;
}

function sectionByTitle(title: string): HTMLElement | null {
  return Array.from(document.querySelectorAll<HTMLElement>('section')).find(
    (section) => section.querySelector('h1')?.textContent?.includes(title),
  ) ?? null;
}

function rewriteMetric(root: ParentNode, label: string, value: string, sub: string, nextLabel?: string) {
  const labelNode = leaf(root, label);
  const card = labelNode?.parentElement;
  if (!labelNode || !card || card.children.length < 3) return;

  if (nextLabel) setText(labelNode, nextLabel);
  setText(card.children[1], value);
  setText(card.children[2], sub);
}

function validateStep6() {
  const section = sectionByTitle('Dampak Operasional Gabungan');
  if (!section) return;

  rewriteMetric(section, 'DOWNTIME', 'Perlu data aktual', 'Durasi kejadian belum diukur');
  rewriteMetric(section, 'CHARGING EXPOSURE', 'Berdasarkan input user', 'Gunakan durasi charging yang dilaporkan');
  rewriteMetric(section, 'MAINTENANCE', 'Perlu baseline', 'Gunakan frekuensi aktual di site');
  rewriteMetric(section, 'PRODUCTIVITY', 'Perlu validasi', 'Tidak dihitung tanpa waktu henti aktual');

  const heading = Array.from(section.querySelectorAll<HTMLElement>('div')).find(
    (node) => node.children.length === 0 && node.textContent?.trim() === 'Kontribusi tiap masalah terhadap kondisi operasional',
  );
  setText(heading, 'Sinyal dampak operasional yang perlu diverifikasi');

  Array.from(section.querySelectorAll<HTMLElement>('span')).forEach((node) => {
    if (!/^\d+% bobot indikasi$/i.test(node.textContent?.trim() || '')) return;

    setText(node, 'Perlu verifikasi');
    const progress = node.parentElement?.nextElementSibling as HTMLElement | null;
    if (progress && progress.style.display !== 'none') progress.style.display = 'none';
  });

  Array.from(section.querySelectorAll<HTMLElement>('p')).forEach((node) => {
    if (node.textContent?.includes('Angka di atas adalah indikator operasional')) {
      setText(
        node,
        'DRRKOBE tidak mengubah frekuensi kejadian menjadi jam downtime atau persentase productivity loss tanpa durasi kejadian aktual. Nilai finansial baru dihitung setelah data site tervalidasi.',
      );
    }
  });
}

function validateStep7() {
  const section = sectionByTitle('Lead Acid vs Lithium-ion');
  if (!section) return;

  const title = section.querySelector('h1 span');
  setText(title, 'Masalah Lead Acid vs Keunggulan Lithium-ion');

  const table = section.querySelector('table');
  if (!table) return;

  const headers = table.querySelectorAll<HTMLTableCellElement>('thead th');
  if (headers.length >= 3) {
    setText(headers[0], 'MASALAH / KEBUTUHAN OPERASI');
    setText(headers[1], 'KONDISI LEAD ACID SAAT INI');
    setText(headers[2], 'BAGAIMANA LITHIUM-ION MEMBANTU');
  }

  const replacements: Record<string, [string, string, string]> = {
    'Charging Time': [
      'Charging lama / charging window sempit',
      'Siklus pengisian dan recovery Lead Acid perlu direncanakan agar unit siap kembali digunakan.',
      'Lithium-ion dapat mendukung pengisian yang lebih fleksibel dan opportunity charging bila battery, charger, BMS, serta unit kompatibel.',
    ],
    'Lifespan (cycles)': [
      'Daya makin sulit konsisten seiring kondisi battery menurun',
      'Kinerja Lead Acid dipengaruhi umur, depth of discharge, charging, temperatur, dan disiplin perawatan.',
      'BMS pada Lithium-ion membantu mengelola charging dan discharging. Kapasitas, duty cycle, temperatur, dan batas operasi tetap harus diverifikasi.',
    ],
    Maintenance: [
      'Watering, equalizing, dan routine battery care',
      'Lead Acid memerlukan pemeriksaan elektrolit/air, terminal, kebersihan, dan equalizing sesuai kebutuhan.',
      'Lithium-ion tidak membutuhkan watering atau equalizing. Pemeriksaan beralih ke BMS, konektor, charger, temperatur, dan kondisi fisik.',
    ],
    'Energy Efficiency': [
      'Waktu operasi terserap proses charging',
      'Availability dapat terpengaruh ketika kebutuhan charging dan recovery berbenturan dengan jam operasi.',
      'Strategi charging Lithium-ion yang lebih fleksibel dapat membantu menjaga availability. Dampak aktual tetap perlu dibuktikan dari data site.',
    ],
    'Downtime Risk': [
      'Downtime terkait battery / charging',
      'Battery lemah, charging window, atau kebutuhan maintenance dapat membuat unit tidak siap saat dibutuhkan.',
      'Lithium-ion dapat mengurangi sumber downtime yang memang berasal dari watering, equalizing, dan keterbatasan charging. Penyebab dari unit, charger, atau instalasi tetap harus diperiksa.',
    ],
    'Opportunity Charging': [
      'Operasi multi-shift membutuhkan charging yang lebih fleksibel',
      'Lead Acid membutuhkan disiplin charging dan recovery sehingga charging window harus dijaga.',
      'Opportunity charging dapat menjadi keunggulan Lithium-ion untuk operasi multi-shift bila diizinkan oleh spesifikasi battery, charger, BMS, dan prosedur site.',
    ],
    'Safety / Emission': [
      'Penanganan elektrolit, watering, dan area charging',
      'Lead Acid memerlukan pengendalian elektrolit/asam, gas saat charging, ventilasi, kebersihan, dan PPE sesuai prosedur site.',
      'Lithium-ion menghilangkan watering dan penanganan elektrolit rutin. Keselamatan tetap bergantung pada BMS, temperatur, charger, konektor, instalasi, dan prosedur site.',
    ],
  };

  table.querySelectorAll<HTMLTableRowElement>('tbody tr').forEach((row) => {
    const cells = row.querySelectorAll<HTMLTableCellElement>('td');
    if (cells.length < 3) return;

    const replacement = replacements[cells[0].textContent?.trim() || ''];
    if (!replacement) return;

    setText(cells[0], replacement[0]);
    setText(cells[1], replacement[1]);
    setText(cells[2], replacement[2]);
  });

  const wrapper = table.parentElement;
  if (wrapper && !section.querySelector('[data-lithium-selling-context="1"]')) {
    const intro = document.createElement('div');
    intro.dataset.lithiumSellingContext = '1';
    intro.className = 'mb-5 rounded-[20px] bg-[#0A0A0A] p-5 text-white';
    intro.innerHTML = '<div class="font-mono text-[10px] font-bold tracking-[.14em] text-[#FFCC00]">WHY LITHIUM-ION</div><div class="mt-2 text-xl font-black">Bukan sekadar membandingkan teknologi. Lihat masalah Lead Acid mana yang dapat dikurangi atau dihilangkan dengan Lithium-ion.</div><p class="mt-3 text-sm leading-6 text-zinc-300">Fokus utama: charging window, watering dan equalizing, kebutuhan maintenance battery, serta availability pada operasi multi-shift. Gangguan electrical, hydraulic, drive, charger, atau temperatur tidak dianggap otomatis selesai hanya karena battery diganti.</p>';
    wrapper.insertAdjacentElement('beforebegin', intro);
  }

  const comparisonNote = Array.from(section.querySelectorAll<HTMLElement>('div')).find((node) => {
    const className = typeof node.className === 'string' ? node.className : '';
    return className.includes('border-dashed');
  });

  setText(
    comparisonNote,
    'Lithium-ion diposisikan sebagai solusi untuk pain point Lead Acid yang memang terkait dengan charging strategy, watering/equalizing, routine battery maintenance, dan kebutuhan availability. Kesesuaian battery, charger, BMS, dimensi, konektor, kapasitas, serta duty cycle tetap harus diverifikasi sebelum konversi.',
  );

  const navButtons = section.querySelectorAll<HTMLButtonElement>('button');
  const nextButton = Array.from(navButtons).find((button) => button.textContent?.includes('Hitung Potensi Efisiensi'));
  setText(nextButton, 'Validasi Kesesuaian Lithium-ion →');
}

function validateStep8() {
  const section = sectionByTitle('Hitung Potensi Efisiensi') || sectionByTitle('Validasi Kebutuhan Operasional');
  if (!section) return;

  const heading = section.querySelector('h1');
  if (heading?.textContent?.includes('Hitung Potensi Efisiensi')) {
    setText(heading, heading.textContent.replace('Hitung Potensi Efisiensi', 'Validasi Kebutuhan Operasional'));
  }

  const eyebrow = Array.from(section.querySelectorAll<HTMLElement>('div')).find(
    (node) => node.children.length === 0 && node.textContent?.includes('STEP 8 / 9'),
  );
  setText(eyebrow, 'STEP 8 / 9 — OPERATIONAL READINESS');

  rewriteMetric(section, 'DOWNTIME', 'Perlu data aktual', 'Butuh durasi kejadian aktual', 'VALIDASI DOWNTIME');
  rewriteMetric(section, 'ENERGY', 'Perlu data charger', 'Butuh baseline konsumsi aktual', 'VALIDASI ENERGI');
  rewriteMetric(section, 'MAINTENANCE', 'Perlu baseline', 'Butuh aktivitas maintenance aktual', 'VALIDASI MAINTENANCE');

  const fitLabel = leaf(section, 'OPERATIONAL FIT');
  if (fitLabel) {
    setText(fitLabel, 'KEBUTUHAN OPERASI');
    const card = fitLabel.parentElement;
    if (card?.children[2]) setText(card.children[2], 'Indikator berdasarkan shift dan jam operasi');
  }

  const simulationNote = Array.from(section.querySelectorAll<HTMLElement>('div')).find((node) => {
    const className = typeof node.className === 'string' ? node.className : '';
    return className.includes('bg-[#FFFEF0]')
      && node.textContent?.includes('simulasi persentase adalah indikator awal');
  });
  setText(
    simulationNote,
    'Catatan: tahap ini membaca kebutuhan operasi. DRRKOBE tidak menghasilkan persentase saving, pengurangan downtime, atau ROI sebelum baseline site tersedia.',
  );

  const operationalNote = Array.from(section.querySelectorAll<HTMLElement>('div')).find((node) => {
    const className = typeof node.className === 'string' ? node.className : '';
    return className.includes('bg-[#FFCC00]') && node.textContent?.trim().startsWith('Potensi operasional:');
  });
  setText(
    operationalNote,
    'Dasar keputusan: jumlah unit, jam operasi, shift, charging window, downtime aktual, kondisi battery, dan kompatibilitas charger perlu dibaca bersama sebelum membahas potensi efisiensi atau investasi.',
  );

  const operational = leaf(section, 'OPERATIONAL IMPACT')?.parentElement;
  if (operational) {
    const rows = operational.querySelectorAll<HTMLElement>('.flex.items-center.justify-between');
    rows.forEach((row) => {
      const label = row.querySelector('span')?.textContent?.trim();
      const value = row.querySelector('strong');
      if (!value) return;

      if (label === 'Downtime') setText(value, 'Perlu durasi aktual');
      if (label === 'Charging') setText(value, 'Lihat input charging');
      if (label === 'Maintenance') setText(value, 'Lihat input perawatan');
      if (label === 'Productivity') setText(value, 'Perlu validasi');
    });
  }

  const financial = leaf(section, 'FINANCIAL STATUS')?.parentElement;
  if (financial && financial.children.length >= 3) {
    setText(financial.children[1], 'Pending Site Validation');
    setText(
      financial.children[2],
      'Nilai Rupiah, saving, dan ROI menunggu durasi downtime, baseline biaya, konsumsi, serta data maintenance yang tervalidasi.',
    );
  }

  Array.from(section.querySelectorAll<HTMLElement>('p')).forEach((node) => {
    if (node.textContent?.startsWith('Tidak mengetahui biaya internal tidak menghambat diagnosis.')) {
      setText(
        node,
        'Tidak mengetahui biaya internal tidak menghambat diagnosis. Nilai Rupiah, saving, dan ROI tidak dihitung otomatis sampai durasi downtime, baseline biaya, konsumsi, serta biaya maintenance benar-benar tersedia.',
      );
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
        if (shiftIndex >= 0) {
          filtered.splice(shiftIndex + 1, 0, 'Saving / ROI: Menunggu baseline dan validasi data site');
        }
      }

      url.searchParams.set('text', filtered.join('\n'));
      const nextHref = url.toString();
      if (anchor.href !== nextHref) anchor.href = nextHref;
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
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
