'use client';

import { useEffect } from 'react';

const FINANCIAL_CONTEXT_KEY = 'drrkobe_bip_pdf_financial_context';
const DIRECT_FINANCIAL_CONTEXT_KEY = 'drrkobe_bip_pdf_financial_direct';
const LITHIUM_SCENARIO_KEY = 'drrkobe_bip_lithium_scenario';
const STABLE_DOWNTIME_KEY = 'drrkobe_bip_stable_downtime_baseline';

const DOWNTIME_LABELS = [
  'biaya downtime 1 forklift / jam',
  'estimasi biaya downtime 1 forklift / jam',
];

// Biaya air battery adalah bagian dari routine Lead Acid care, bukan biaya charging.
const MAINTENANCE_LABELS = [
  'maintenance lead acid / unit / bulan',
  'biaya maintenance lead acid / unit / bulan',
  'biaya perawatan lead acid / unit / bulan',
  'biaya air battery / unit / bulan',
  'biaya air battery per bulan',
  'biaya air battery perbulan',
];

// Field lama disembunyikan dari Step 8. Charging tetap dipakai sebagai data durasi/operasional.
const LEGACY_CHARGING_COST_LABELS = [
  'charging / listrik / unit / bulan',
  'biaya charging / listrik / unit / bulan',
  'biaya pengisian / unit / bulan',
  'pengisian / unit / bulan',
];

type FinancialMode = 'unknown' | 'partial' | 'full' | 'undetected';

type FinancialContext = {
  actualDowntimeHoursPerUnitMonth: number | null;
  downtimeCostPerHour: number;
  maintenanceCostPerUnitMonth: number;
  // Legacy compatibility only. Selalu 0 dan tidak termasuk model finansial BIP.
  chargingCostPerUnitMonth: number;
  fleetSize: number;
};

type DirectFinancialContext = Partial<Pick<
  FinancialContext,
  'downtimeCostPerHour' | 'maintenanceCostPerUnitMonth' | 'chargingCostPerUnitMonth' | 'fleetSize'
>>;

function normalizeLabel(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function matchesAnyLabel(labelText: string, aliases: string[]): boolean {
  const normalized = normalizeLabel(labelText);
  return aliases.some((alias) => normalized.includes(normalizeLabel(alias)));
}

function leaf(root: ParentNode, text: string): HTMLElement | null {
  return Array.from(root.querySelectorAll<HTMLElement>('*')).find(
    (node) => node.children.length === 0 && node.textContent?.trim() === text,
  ) ?? null;
}

function stepEight(): HTMLElement | null {
  return Array.from(document.querySelectorAll<HTMLElement>('section')).find((section) => {
    const title = section.querySelector('h1')?.textContent ?? '';
    return title.includes('Validasi Kebutuhan Operasional') || title.includes('Hitung Potensi Efisiensi');
  }) ?? null;
}

function stepOne(): HTMLElement | null {
  return Array.from(document.querySelectorAll<HTMLElement>('section')).find((section) =>
    section.querySelector('h1')?.textContent?.includes('Pilih Bidang Industri & Model Forklift'),
  ) ?? null;
}

function activeFinancialMode(section: HTMLElement): FinancialMode {
  const buttons = Array.from(section.querySelectorAll<HTMLButtonElement>('button'));
  const activeButton = buttons.find((button) => {
    const className = typeof button.className === 'string' ? button.className : '';
    return className.includes('bg-[#0A0A0A]') && (
      button.textContent?.includes('Saya tidak tahu biaya internal')
      || button.textContent?.includes('Saya tahu sebagian biaya')
      || button.textContent?.includes('Saya memiliki data lengkap')
    );
  });

  const text = activeButton?.textContent ?? '';
  if (text.includes('Saya tidak tahu biaya internal')) return 'unknown';
  if (text.includes('Saya tahu sebagian biaya')) return 'partial';
  if (text.includes('Saya memiliki data lengkap')) return 'full';
  return 'undetected';
}

function readDirectContext(): DirectFinancialContext {
  try {
    const raw = window.sessionStorage.getItem(DIRECT_FINANCIAL_CONTEXT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as DirectFinancialContext;
    return {
      downtimeCostPerHour: typeof parsed.downtimeCostPerHour === 'number'
        ? Math.max(0, parsed.downtimeCostPerHour)
        : undefined,
      maintenanceCostPerUnitMonth: typeof parsed.maintenanceCostPerUnitMonth === 'number'
        ? Math.max(0, parsed.maintenanceCostPerUnitMonth)
        : undefined,
      chargingCostPerUnitMonth: 0,
      fleetSize: typeof parsed.fleetSize === 'number' ? Math.max(1, parsed.fleetSize) : undefined,
    };
  } catch {
    return {};
  }
}

function writeDirectContext(patch: DirectFinancialContext) {
  try {
    const current = readDirectContext();
    window.sessionStorage.setItem(
      DIRECT_FINANCIAL_CONTEXT_KEY,
      JSON.stringify({ ...current, ...patch, chargingCostPerUnitMonth: 0 }),
    );
  } catch {
    // State React tetap menjadi fallback bila sessionStorage diblokir.
  }
}

function readExisting(): FinancialContext {
  let parsed: Partial<FinancialContext> = {};
  try {
    const raw = window.sessionStorage.getItem(FINANCIAL_CONTEXT_KEY);
    if (raw) parsed = JSON.parse(raw) as Partial<FinancialContext>;
  } catch {
    parsed = {};
  }

  const direct = readDirectContext();
  return {
    actualDowntimeHoursPerUnitMonth: typeof parsed.actualDowntimeHoursPerUnitMonth === 'number'
      ? Math.max(0, parsed.actualDowntimeHoursPerUnitMonth)
      : null,
    downtimeCostPerHour: direct.downtimeCostPerHour
      ?? Math.max(0, Number(parsed.downtimeCostPerHour) || 0),
    maintenanceCostPerUnitMonth: direct.maintenanceCostPerUnitMonth
      ?? Math.max(0, Number(parsed.maintenanceCostPerUnitMonth) || 0),
    chargingCostPerUnitMonth: 0,
    fleetSize: direct.fleetSize ?? Math.max(1, Number(parsed.fleetSize) || 1),
  };
}

function readStableDowntime(): number | null {
  try {
    const raw = window.sessionStorage.getItem(STABLE_DOWNTIME_KEY);
    if (!raw) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? Math.max(0, value) : null;
  } catch {
    return null;
  }
}

function inputNumberByLabels(section: HTMLElement, aliases: string[]): number | null {
  const label = Array.from(section.querySelectorAll<HTMLLabelElement>('label')).find((node) =>
    matchesAnyLabel(node.textContent ?? '', aliases),
  );
  const input = label?.querySelector<HTMLInputElement>('input[type="number"]');
  if (!input) return null;

  const raw = input.value.trim();
  if (raw === '') return null;
  return Math.max(0, Number(raw) || 0);
}

function fleetSize(section: HTMLElement, fallback: number): number {
  const text = Array.from(section.querySelectorAll<HTMLElement>('*')).find((node) =>
    node.children.length === 0 && /Jumlah Forklift:\s*\d+/i.test(node.textContent ?? ''),
  )?.textContent ?? '';
  const match = text.match(/Jumlah Forklift:\s*(\d+)/i);
  return Math.max(1, Number(match?.[1]) || fallback || 1);
}

function hideLegacyChargingCostField(section: HTMLElement) {
  Array.from(section.querySelectorAll<HTMLLabelElement>('label')).forEach((label) => {
    if (!matchesAnyLabel(label.textContent ?? '', LEGACY_CHARGING_COST_LABELS)) return;

    label.dataset.drrkobeLegacyChargingCost = '1';
    label.style.display = 'none';
    label.setAttribute('aria-hidden', 'true');

    const input = label.querySelector<HTMLInputElement>('input[type="number"]');
    if (input) {
      input.value = '';
      input.disabled = true;
      input.tabIndex = -1;
    }
  });
}

function writeFinancialContext(context: FinancialContext) {
  try {
    window.sessionStorage.setItem(
      FINANCIAL_CONTEXT_KEY,
      JSON.stringify({ ...context, chargingCostPerUnitMonth: 0 }),
    );
  } catch {
    // Tidak memblokir assessment.
  }
}

function writeLithiumScenario(context: FinancialContext) {
  const scenario = {
    downtimeHoursPerUnitMonth: context.actualDowntimeHoursPerUnitMonth === null
      ? null
      : context.actualDowntimeHoursPerUnitMonth * 0.25,
    maintenanceCostPerUnitMonth: context.maintenanceCostPerUnitMonth * 0.10,
    // Compatibility untuk guard lama; charging tidak dihitung sebagai Rupiah.
    chargingCostPerUnitMonth: 0,
  };

  try {
    window.sessionStorage.setItem(LITHIUM_SCENARIO_KEY, JSON.stringify(scenario));
  } catch {
    // Tidak memblokir assessment.
  }
}

function persistContext(context: FinancialContext) {
  const safeContext = { ...context, chargingCostPerUnitMonth: 0 };
  writeFinancialContext(safeContext);
  writeLithiumScenario(safeContext);
}

function directPatchForMode(
  mode: FinancialMode,
  nextFleetSize: number,
  downtime: number | null,
  maintenance: number | null,
): DirectFinancialContext {
  const patch: DirectFinancialContext = {
    fleetSize: nextFleetSize,
    chargingCostPerUnitMonth: 0,
  };

  if (mode === 'unknown') {
    patch.downtimeCostPerHour = 0;
    patch.maintenanceCostPerUnitMonth = 0;
    return patch;
  }

  if (mode === 'partial') {
    patch.downtimeCostPerHour = downtime ?? 0;
    patch.maintenanceCostPerUnitMonth = 0;
    return patch;
  }

  if (mode === 'full') {
    patch.downtimeCostPerHour = downtime ?? 0;
    patch.maintenanceCostPerUnitMonth = maintenance ?? 0;
    return patch;
  }

  if (downtime !== null) patch.downtimeCostPerHour = downtime;
  if (maintenance !== null) patch.maintenanceCostPerUnitMonth = maintenance;
  return patch;
}

function setText(node: Element | null | undefined, value: string) {
  if (node && node.textContent !== value) node.textContent = value;
}

function rewriteKeyValue(root: ParentNode, label: string, value: string) {
  const labelNode = leaf(root, label);
  const parent = labelNode?.parentElement;
  if (!parent || parent.children.length < 2) return;
  setText(parent.children[parent.children.length - 1], value);
}

function formatRupiah(value: number): string {
  return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
}

function updateFinancialPreview(section: HTMLElement, context: FinancialContext) {
  const downtimeKnown = context.actualDowntimeHoursPerUnitMonth !== null && context.downtimeCostPerHour > 0;
  const monthlyDowntime = downtimeKnown
    ? (context.actualDowntimeHoursPerUnitMonth || 0) * context.downtimeCostPerHour * context.fleetSize
    : 0;
  const monthlyMaintenance = context.maintenanceCostPerUnitMonth * context.fleetSize;
  const subtotal = monthlyDowntime + monthlyMaintenance;

  const operational = leaf(section, 'OPERATIONAL IMPACT')?.parentElement;
  if (operational) {
    rewriteKeyValue(
      operational,
      'Downtime',
      context.actualDowntimeHoursPerUnitMonth !== null
        ? `${context.actualDowntimeHoursPerUnitMonth} jam/bulan`
        : 'Gunakan frekuensi diagnosis',
    );
    rewriteKeyValue(operational, 'Charging', 'Lihat durasi diagnosis');
    rewriteKeyValue(operational, 'Maintenance', 'Lihat input perawatan');
    rewriteKeyValue(operational, 'Productivity', 'Berdasarkan gejala');
  }

  const financial = leaf(section, 'FINANCIAL STATUS')?.parentElement;
  if (!financial || financial.children.length < 3) return;

  if (subtotal <= 0) {
    setText(financial.children[1], 'Menunggu Data Biaya');
    setText(financial.children[2], 'Isi biaya downtime dan/atau Maintenance Lead Acid yang benar-benar diketahui. Charging tidak dikonversi menjadi Rupiah.');
    return;
  }

  if (downtimeKnown) {
    setText(financial.children[1], `${formatRupiah(subtotal)} / bulan`);
    setText(
      financial.children[2],
      `Total biaya teridentifikasi: downtime + Maintenance Lead Acid. Estimasi tahunan ${formatRupiah(subtotal * 12)}. Charging tetap dinilai sebagai dampak operasional, bukan komponen Rupiah.`,
    );
    return;
  }

  setText(financial.children[1], `Subtotal ${formatRupiah(subtotal)} / bulan`);
  setText(
    financial.children[2],
    'Subtotal berasal dari Maintenance Lead Acid yang diketahui. Biaya downtime belum termasuk sampai biaya/jam tersedia. Charging tidak dimasukkan sebagai biaya Rupiah.',
  );
}

function removeChargingFromWhatsappLinks() {
  document.querySelectorAll<HTMLAnchorElement>('a[href*="wa.me/"]').forEach((anchor) => {
    try {
      const url = new URL(anchor.href);
      const message = url.searchParams.get('text');
      if (!message) return;

      const cleaned = message
        .split('\n')
        .filter((line) => !/^\s*(Charging\/listrik|Biaya charging|Biaya pengisian)\s*:/i.test(line))
        .join('\n');

      if (cleaned === message) return;
      url.searchParams.set('text', cleaned);
      anchor.href = url.toString();
    } catch {
      // Link WhatsApp tidak boleh mengganggu assessment.
    }
  });
}

function syncNow() {
  const section = stepEight();
  if (!section) {
    removeChargingFromWhatsappLinks();
    return;
  }

  hideLegacyChargingCostField(section);

  const existing = readExisting();
  const mode = activeFinancialMode(section);
  const downtime = inputNumberByLabels(section, DOWNTIME_LABELS);
  const maintenance = inputNumberByLabels(section, MAINTENANCE_LABELS);
  const stableDowntime = readStableDowntime();
  const nextFleetSize = fleetSize(section, existing.fleetSize);

  const directPatch = directPatchForMode(mode, nextFleetSize, downtime, maintenance);
  writeDirectContext(directPatch);

  const direct = readDirectContext();
  const context: FinancialContext = {
    actualDowntimeHoursPerUnitMonth: stableDowntime ?? existing.actualDowntimeHoursPerUnitMonth,
    downtimeCostPerHour: direct.downtimeCostPerHour ?? downtime ?? existing.downtimeCostPerHour,
    maintenanceCostPerUnitMonth: direct.maintenanceCostPerUnitMonth ?? maintenance ?? existing.maintenanceCostPerUnitMonth,
    chargingCostPerUnitMonth: 0,
    fleetSize: direct.fleetSize ?? nextFleetSize,
  };

  persistContext(context);
  updateFinancialPreview(section, context);
  removeChargingFromWhatsappLinks();
}

function clearAssessmentFinancialStorage() {
  try {
    window.sessionStorage.removeItem(DIRECT_FINANCIAL_CONTEXT_KEY);
    window.sessionStorage.removeItem(FINANCIAL_CONTEXT_KEY);
    window.sessionStorage.removeItem(LITHIUM_SCENARIO_KEY);
  } catch {
    // Tidak memblokir assessment.
  }
}

export default function FinancialContextSync() {
  useEffect(() => {
    let stepOneResetDone = false;
    let queued = false;

    const sync = () => {
      queued = false;
      const onStepOne = Boolean(stepOne());
      if (onStepOne && !stepOneResetDone) {
        clearAssessmentFinancialStorage();
        stepOneResetDone = true;
      } else if (!onStepOne) {
        stepOneResetDone = false;
      }
      syncNow();
    };

    const queue = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(sync);
    };

    const onInput = () => queue();
    const onChange = () => queue();
    const onClickCapture = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('button')) return;
      // Simpan angka final sebelum React memindahkan Step 8 ke Step 9.
      syncNow();
    };

    queue();
    const observer = new MutationObserver(queue);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('input', onInput, true);
    document.addEventListener('change', onChange, true);
    document.addEventListener('click', onClickCapture, true);

    return () => {
      observer.disconnect();
      document.removeEventListener('input', onInput, true);
      document.removeEventListener('change', onChange, true);
      document.removeEventListener('click', onClickCapture, true);
    };
  }, []);

  return <style jsx global>{`[data-drrkobe-legacy-charging-cost="1"]{display:none!important}`}</style>;
}
