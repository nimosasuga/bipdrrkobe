'use client';

import { useEffect } from 'react';

const FINANCIAL_CONTEXT_KEY = 'drrkobe_bip_pdf_financial_context';
const DIRECT_FINANCIAL_CONTEXT_KEY = 'drrkobe_bip_pdf_financial_direct';
const LITHIUM_SCENARIO_KEY = 'drrkobe_bip_lithium_scenario';
const STABLE_DOWNTIME_KEY = 'drrkobe_bip_stable_downtime_baseline';

const DOWNTIME_REDUCTION_FACTOR = 0.75;
const MAINTENANCE_REDUCTION_FACTOR = 0.90;
const CHARGING_COST_REDUCTION_FACTOR = 0.28;

const DOWNTIME_LABELS = [
  'biaya downtime 1 forklift / jam',
  'estimasi biaya downtime 1 forklift / jam',
];
const MAINTENANCE_LABELS = [
  'maintenance lead acid / unit / bulan',
  'biaya maintenance lead acid / unit / bulan',
  'biaya perawatan lead acid / unit / bulan',
];
const CHARGING_LABELS = [
  'charging / listrik / unit / bulan',
  'biaya charging / listrik / unit / bulan',
  'biaya pengisian / unit / bulan',
  'pengisian / unit / bulan',
  'biaya air battery / unit / bulan',
  'biaya air battery per bulan',
  'biaya air battery perbulan',
];

type FinancialMode = 'unknown' | 'partial' | 'full' | 'undetected';

type FinancialContext = {
  actualDowntimeHoursPerUnitMonth: number | null;
  downtimeCostPerHour: number;
  maintenanceCostPerUnitMonth: number;
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

function stepEight(): HTMLElement | null {
  return Array.from(document.querySelectorAll<HTMLElement>('section')).find((section) => {
    const title = section.querySelector('h1')?.textContent ?? '';
    return title.includes('Validasi Kebutuhan Operasional') || title.includes('Hitung Potensi Efisiensi');
  }) ?? null;
}

function stepOne(): HTMLElement | null {
  return Array.from(document.querySelectorAll<HTMLElement>('section')).find((section) => {
    const title = section.querySelector('h1')?.textContent ?? '';
    return title.includes('Pilih Bidang Industri & Model Forklift');
  }) ?? null;
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
    const direct: DirectFinancialContext = {};

    if (typeof parsed.downtimeCostPerHour === 'number') {
      direct.downtimeCostPerHour = Math.max(0, parsed.downtimeCostPerHour);
    }
    if (typeof parsed.maintenanceCostPerUnitMonth === 'number') {
      direct.maintenanceCostPerUnitMonth = Math.max(0, parsed.maintenanceCostPerUnitMonth);
    }
    if (typeof parsed.chargingCostPerUnitMonth === 'number') {
      direct.chargingCostPerUnitMonth = Math.max(0, parsed.chargingCostPerUnitMonth);
    }
    if (typeof parsed.fleetSize === 'number') {
      direct.fleetSize = Math.max(1, parsed.fleetSize);
    }

    return direct;
  } catch {
    return {};
  }
}

function writeDirectContext(patch: DirectFinancialContext) {
  try {
    const current = readDirectContext();
    window.sessionStorage.setItem(DIRECT_FINANCIAL_CONTEXT_KEY, JSON.stringify({ ...current, ...patch }));
  } catch {
    // Nilai utama masih tersedia dari state React bila sessionStorage diblokir.
  }
}

function clearDirectContext() {
  try {
    window.sessionStorage.removeItem(DIRECT_FINANCIAL_CONTEXT_KEY);
  } catch {
    // Tidak memblokir assessment.
  }
}

function readExisting(): FinancialContext {
  const fallback: FinancialContext = {
    actualDowntimeHoursPerUnitMonth: null,
    downtimeCostPerHour: 0,
    maintenanceCostPerUnitMonth: 0,
    chargingCostPerUnitMonth: 0,
    fleetSize: 1,
  };

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
      ?? Math.max(0, Number(parsed.downtimeCostPerHour) || fallback.downtimeCostPerHour),
    maintenanceCostPerUnitMonth: direct.maintenanceCostPerUnitMonth
      ?? Math.max(0, Number(parsed.maintenanceCostPerUnitMonth) || fallback.maintenanceCostPerUnitMonth),
    chargingCostPerUnitMonth: direct.chargingCostPerUnitMonth
      ?? Math.max(0, Number(parsed.chargingCostPerUnitMonth) || fallback.chargingCostPerUnitMonth),
    fleetSize: direct.fleetSize
      ?? Math.max(1, Number(parsed.fleetSize) || fallback.fleetSize),
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

function writeFinancialContext(context: FinancialContext) {
  try {
    window.sessionStorage.setItem(FINANCIAL_CONTEXT_KEY, JSON.stringify(context));
  } catch {
    // PDF tetap dapat dibuat jika sessionStorage diblokir browser.
  }
}

function writeLithiumScenario(context: FinancialContext) {
  const scenario = {
    downtimeHoursPerUnitMonth: context.actualDowntimeHoursPerUnitMonth === null
      ? null
      : context.actualDowntimeHoursPerUnitMonth * (1 - DOWNTIME_REDUCTION_FACTOR),
    maintenanceCostPerUnitMonth: context.maintenanceCostPerUnitMonth * (1 - MAINTENANCE_REDUCTION_FACTOR),
    chargingCostPerUnitMonth: context.chargingCostPerUnitMonth * (1 - CHARGING_COST_REDUCTION_FACTOR),
  };

  try {
    window.sessionStorage.setItem(LITHIUM_SCENARIO_KEY, JSON.stringify(scenario));
  } catch {
    // Tidak memblokir assessment.
  }
}

function persistContext(context: FinancialContext) {
  writeFinancialContext(context);
  writeLithiumScenario(context);
}

function directPatchForMode(
  mode: FinancialMode,
  nextFleetSize: number,
  downtime: number | null,
  maintenance: number | null,
  charging: number | null,
): DirectFinancialContext {
  const patch: DirectFinancialContext = { fleetSize: nextFleetSize };

  if (mode === 'unknown') {
    patch.downtimeCostPerHour = 0;
    patch.maintenanceCostPerUnitMonth = 0;
    patch.chargingCostPerUnitMonth = 0;
    return patch;
  }

  if (mode === 'partial') {
    patch.maintenanceCostPerUnitMonth = 0;
    patch.chargingCostPerUnitMonth = 0;
    if (downtime !== null) patch.downtimeCostPerHour = downtime;
    return patch;
  }

  if (downtime !== null) patch.downtimeCostPerHour = downtime;
  if (maintenance !== null) patch.maintenanceCostPerUnitMonth = maintenance;
  if (charging !== null) patch.chargingCostPerUnitMonth = charging;
  return patch;
}

function syncNow() {
  const section = stepEight();
  if (!section) return;

  const existing = readExisting();
  const mode = activeFinancialMode(section);
  const downtime = inputNumberByLabels(section, DOWNTIME_LABELS);
  const maintenance = inputNumberByLabels(section, MAINTENANCE_LABELS);
  const charging = inputNumberByLabels(section, CHARGING_LABELS);
  const stableDowntime = readStableDowntime();
  const nextFleetSize = fleetSize(section, existing.fleetSize);

  writeDirectContext(directPatchForMode(mode, nextFleetSize, downtime, maintenance, charging));

  const direct = readDirectContext();
  const context: FinancialContext = {
    actualDowntimeHoursPerUnitMonth: stableDowntime ?? existing.actualDowntimeHoursPerUnitMonth,
    downtimeCostPerHour: direct.downtimeCostPerHour ?? downtime ?? existing.downtimeCostPerHour,
    maintenanceCostPerUnitMonth: direct.maintenanceCostPerUnitMonth ?? maintenance ?? existing.maintenanceCostPerUnitMonth,
    chargingCostPerUnitMonth: direct.chargingCostPerUnitMonth ?? charging ?? existing.chargingCostPerUnitMonth,
    fleetSize: direct.fleetSize ?? nextFleetSize,
  };

  persistContext(context);
}

function syncDirectInput(target: EventTarget | null) {
  const input = target instanceof HTMLInputElement ? target : null;
  if (!input || input.type !== 'number') return;

  const section = stepEight();
  if (!section || !section.contains(input)) return;

  const labelText = input.closest('label')?.textContent ?? '';
  if (!labelText) return;

  const raw = input.value.trim();
  const value = raw === '' ? 0 : Math.max(0, Number(raw) || 0);
  const context = readExisting();
  const stableDowntime = readStableDowntime();
  const nextFleetSize = fleetSize(section, context.fleetSize);

  context.actualDowntimeHoursPerUnitMonth = stableDowntime ?? context.actualDowntimeHoursPerUnitMonth;
  context.fleetSize = nextFleetSize;

  const directPatch: DirectFinancialContext = { fleetSize: nextFleetSize };

  if (matchesAnyLabel(labelText, DOWNTIME_LABELS)) {
    context.downtimeCostPerHour = value;
    directPatch.downtimeCostPerHour = value;
  } else if (matchesAnyLabel(labelText, MAINTENANCE_LABELS)) {
    context.maintenanceCostPerUnitMonth = value;
    directPatch.maintenanceCostPerUnitMonth = value;
  } else if (matchesAnyLabel(labelText, CHARGING_LABELS)) {
    context.chargingCostPerUnitMonth = value;
    directPatch.chargingCostPerUnitMonth = value;
  } else {
    return;
  }

  // Event input adalah sumber kebenaran: angka positif, nol, maupun field yang sengaja dikosongkan.
  writeDirectContext(directPatch);
  persistContext(context);
}

export default function FinancialContextSync() {
  useEffect(() => {
    let stepOneResetDone = false;

    const sync = () => {
      const onStepOne = Boolean(stepOne());
      if (onStepOne && !stepOneResetDone) {
        clearDirectContext();
        stepOneResetDone = true;
      } else if (!onStepOne) {
        stepOneResetDone = false;
      }

      syncNow();
    };

    const onInput = (event: Event) => {
      syncDirectInput(event.target);
      syncNow();
    };
    const onChange = (event: Event) => {
      syncDirectInput(event.target);
      syncNow();
    };
    const onClickCapture = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('button')) return;
      // Capture-phase: simpan angka final sebelum React memindahkan Step 8 ke Step 9.
      syncNow();
    };

    sync();
    const observer = new MutationObserver(sync);
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

  return null;
}
