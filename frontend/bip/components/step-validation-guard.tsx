'use client';

import { useEffect } from 'react';

const FINANCIAL_CONTEXT_KEY = 'drrkobe_bip_pdf_financial_context';

type FinancialContext = {
  actualDowntimeHoursPerUnitMonth: number | null;
  downtimeCostPerHour: number;
  maintenanceCostPerUnitMonth: number;
  chargingCostPerUnitMonth: number;
  fleetSize: number;
};

const EMPTY_FINANCIAL_CONTEXT: FinancialContext = {
  actualDowntimeHoursPerUnitMonth: null,
  downtimeCostPerHour: 0,
  maintenanceCostPerUnitMonth: 0,
  chargingCostPerUnitMonth: 0,
  fleetSize: 1,
};

function setText(node: Element | null | undefined, value: string) {
  if (node && node.textContent !== value) node.textContent = value;
}

function leaf(root: ParentNode, text: string): HTMLElement | null {
  return Array.from(root.querySelectorAll<HTMLElement>('*')).find(
    (node) => node.children.length === 0 && node.textContent?.trim() === text,
  ) ?? null;
}

function leafStartsWith(root: ParentNode, text: string): HTMLElement | null {
  return Array.from(root.querySelectorAll<HTMLElement>('*')).find(
    (node) => node.children.length === 0 && node.textContent?.trim().startsWith(text),
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

function readFinancialContext(): FinancialContext {
  try {
    const raw = window.sessionStorage.getItem(FINANCIAL_CONTEXT_KEY);
    if (!raw) return { ...EMPTY_FINANCIAL_CONTEXT };

    const parsed = JSON.parse(raw) as Partial<FinancialContext>;
    return {
      actualDowntimeHoursPerUnitMonth: typeof parsed.actualDowntimeHoursPerUnitMonth === 'number'
        ? parsed.actualDowntimeHoursPerUnitMonth
        : null,
      downtimeCostPerHour: Number(parsed.downtimeCostPerHour) || 0,
      maintenanceCostPerUnitMonth: Number(parsed.maintenanceCostPerUnitMonth) || 0,
      chargingCostPerUnitMonth: Number(parsed.chargingCostPerUnitMonth) || 0,
      fleetSize: Math.max(1, Number(parsed.fleetSize) || 1),
    };
  } catch {
    return { ...EMPTY_FINANCIAL_CONTEXT };
  }
}

function writeFinancialContext(context: FinancialContext) {
  try {
    window.sessionStorage.setItem(FINANCIAL_CONTEXT_KEY, JSON.stringify(context));
  } catch {
    // Assessment tetap dapat berjalan bila browser menolak sessionStorage.
  }
}

function clearFinancialContext() {
  try {
    window.sessionStorage.removeItem(FINANCIAL_CONTEXT_KEY);
  } catch {
    // Tidak memblokir assessment.
  }
}

function formatRupiah(value: number): string {
  return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
}

function numberInputByLabel(root: ParentNode, labelText: string): number {
  const label = Array.from(root.querySelectorAll<HTMLLabelElement>('label')).find(
    (node) => node.textContent?.includes(labelText),
  );
  const input = label?.querySelector<HTMLInputElement>('input[type="number"]');
  return Math.max(0, Number(input?.value) || 0);
}

function ensureActualDowntimeField(section: HTMLElement) {
  const financialMarker = leaf(section, 'DATA FINANSIAL — OPSIONAL');
  const financialPanel = financialMarker?.parentElement;
  if (!financialPanel || financialPanel.querySelector('[data-actual-downtime-field="1"]')) return;

  const stored = readFinancialContext();
  const field = document.createElement('div');
  field.dataset.actualDowntimeField = '1';
  field.className = 'mt-5 rounded-[18px] border border-[#FFCC00]/60 bg-[#FFFEF0] p-5';
  field.innerHTML = `
    <div class="font-mono text-[10px] font-bold tracking-[.12em] text-zinc-500">DATA DOWNTIME AKTUAL — OPSIONAL</div>
    <label class="mt-3 block text-sm font-black text-zinc-800" for="drrkobe-actual-downtime-hours">Total downtime battery / charger per forklift dalam 1 bulan (jam)</label>
    <input id="drrkobe-actual-downtime-hours" data-actual-downtime-input="1" class="drr-input" type="number" min="0" step="0.1" inputmode="decimal" placeholder="Contoh: 6" value="${stored.actualDowntimeHoursPerUnitMonth ?? ''}">
    <p class="mt-2 text-xs leading-5 text-zinc-600">Isi berdasarkan log atau data site bila diketahui. Nilai ini digunakan untuk menghitung biaya downtime di PDF. Jika kosong, DRRKOBE tidak akan membuat asumsi durasi.</p>
  `;

  const introParagraph = Array.from(financialPanel.querySelectorAll<HTMLParagraphElement>('p')).find(
    (node) => node.textContent?.includes('Tidak mengetahui biaya internal tidak menghambat diagnosis'),
  );

  if (introParagraph) introParagraph.insertAdjacentElement('afterend', field);
  else financialPanel.appendChild(field);
}

function captureFinancialContext(section: HTMLElement): FinancialContext {
  const actualInput = section.querySelector<HTMLInputElement>('[data-actual-downtime-input="1"]');
  const actualRaw = actualInput?.value.trim() ?? '';
  const actualDowntimeHoursPerUnitMonth = actualRaw === '' ? null : Math.max(0, Number(actualRaw) || 0);

  const fleetLabel = leafStartsWith(section, 'Jumlah Forklift:');
  const fleetMatch = fleetLabel?.textContent?.match(/Jumlah Forklift:\s*(\d+)/i);
  const fleetSize = Math.max(1, Number(fleetMatch?.[1]) || 1);

  const context: FinancialContext = {
    actualDowntimeHoursPerUnitMonth,
    downtimeCostPerHour: numberInputByLabel(section, 'biaya downtime 1 forklift / jam'),
    maintenanceCostPerUnitMonth: numberInputByLabel(section, 'Maintenance Lead Acid / unit / bulan'),
    chargingCostPerUnitMonth: numberInputByLabel(section, 'Charging / listrik / unit / bulan'),
    fleetSize,
  };

  writeFinancialContext(context);
  return context;
}

function updateFinancialPreview(section: HTMLElement, context: FinancialContext) {
  const actualDowntime = context.actualDowntimeHoursPerUnitMonth;
  const downtimeKnown = actualDowntime !== null && actualDowntime >= 0 && context.downtimeCostPerHour > 0;
  const monthlyDowntime = downtimeKnown ? actualDowntime * context.downtimeCostPerHour * context.fleetSize : 0;
  const monthlyMaintenance = context.maintenanceCostPerUnitMonth * context.fleetSize;
  const monthlyCharging = context.chargingCostPerUnitMonth * context.fleetSize;
  const subtotal = monthlyDowntime + monthlyMaintenance + monthlyCharging;
  const hasAnyCost = subtotal > 0;

  const operational = leaf(section, 'OPERATIONAL IMPACT')?.parentElement;
  if (operational) {
    const rows = operational.querySelectorAll<HTMLElement>('.flex.items-center.justify-between');
    rows.forEach((row) => {
      const label = row.querySelector('span')?.textContent?.trim();
      const value = row.querySelector('strong');
      if (!value) return;

      if (label === 'Downtime') {
        setText(value, actualDowntime !== null ? `${actualDowntime} jam/bulan` : 'Gunakan frekuensi diagnosis');
      }
      if (label === 'Charging') setText(value, 'Lihat input charging');
      if (label === 'Maintenance') setText(value, 'Lihat input perawatan');
      if (label === 'Productivity') setText(value, 'Berdasarkan gejala');
    });
  }

  const financial = leaf(section, 'FINANCIAL STATUS')?.parentElement;
  if (!financial || financial.children.length < 3) return;

  if (!hasAnyCost) {
    setText(financial.children[1], 'Menunggu Data Biaya');
    setText(financial.children[2], 'Isi data biaya yang diketahui. Tidak ada nominal yang dibuat dari asumsi.');
    return;
  }

  if (downtimeKnown) {
    setText(financial.children[1], `${formatRupiah(subtotal)} / bulan`);
    setText(financial.children[2], `Total berdasarkan data yang Anda isi. Estimasi tahunan: ${formatRupiah(subtotal * 12)}. Saving dan ROI tetap menunggu target teknis tervalidasi.`);
    return;
  }

  setText(financial.children[1], `Subtotal ${formatRupiah(subtotal)} / bulan`);
  setText(financial.children[2], `Biaya yang sudah diketahui dapat dihitung. Downtime belum termasuk sampai durasi aktual dan biaya/jam tersedia.`);
}

function validateStep6() {
  const section = sectionByTitle('Dampak Operasional Gabungan');
  if (!section) return;

  rewriteMetric(section, 'DOWNTIME', 'Frekuensi tersedia', 'Gunakan frekuensi downtime yang dilaporkan');
  rewriteMetric(section, 'CHARGING EXPOSURE', 'Berdasarkan input user', 'Gunakan durasi charging yang dilaporkan');
  rewriteMetric(section, 'MAINTENANCE', 'Berdasarkan input user', 'Gunakan pola perawatan yang dilaporkan');
  rewriteMetric(section, 'PRODUCTIVITY', 'Terdampak bila dilaporkan', 'Tidak dikonversi menjadi persentase tanpa baseline');

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
        'DRRKOBE menggunakan frekuensi, durasi charging, pola perawatan, dan gejala yang benar-benar dilaporkan. Durasi downtime dan nilai finansial hanya dihitung bila data aktual diberikan.',
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

  rewriteMetric(section, 'DOWNTIME', 'Gunakan data aktual', 'Masukkan total downtime bila diketahui', 'VALIDASI DOWNTIME');
  rewriteMetric(section, 'ENERGY', 'Perlu data charger', 'Butuh baseline konsumsi aktual', 'VALIDASI ENERGI');
  rewriteMetric(section, 'MAINTENANCE', 'Gunakan data aktual', 'Gunakan biaya maintenance bila diketahui', 'VALIDASI MAINTENANCE');

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

  ensureActualDowntimeField(section);
  const context = captureFinancialContext(section);
  updateFinancialPreview(section, context);

  Array.from(section.querySelectorAll<HTMLElement>('p')).forEach((node) => {
    if (node.textContent?.startsWith('Tidak mengetahui biaya internal tidak menghambat diagnosis.')) {
      setText(
        node,
        'Tidak mengetahui seluruh biaya internal tidak menghambat diagnosis. Isi hanya data yang benar-benar diketahui; PDF akan menghitung subtotal atau total dari data tersebut tanpa asumsi tersembunyi.',
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

      const financialContext = readFinancialContext();
      if (financialContext.actualDowntimeHoursPerUnitMonth !== null) {
        const insertAt = filtered.findIndex((line) => line.startsWith('Saving / ROI:'));
        const actualLine = `Downtime aktual: ${financialContext.actualDowntimeHoursPerUnitMonth} jam / unit / bulan`;
        if (!filtered.includes(actualLine)) {
          filtered.splice(insertAt >= 0 ? insertAt : filtered.length, 0, actualLine);
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
    let stepOneSeen = false;

    const apply = () => {
      queued = false;

      const stepOne = sectionByTitle('Pilih Bidang Industri & Model Forklift');
      if (stepOne && !stepOneSeen) {
        stepOneSeen = true;
        clearFinancialContext();
      }

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
    document.addEventListener('input', queue, true);
    document.addEventListener('change', queue, true);

    return () => {
      observer.disconnect();
      document.removeEventListener('input', queue, true);
      document.removeEventListener('change', queue, true);
    };
  }, []);

  return null;
}
