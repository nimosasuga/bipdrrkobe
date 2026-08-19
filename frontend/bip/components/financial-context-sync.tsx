'use client';

import { useEffect } from 'react';

const FINANCIAL_CONTEXT_KEY = 'drrkobe_bip_pdf_financial_context';
const LITHIUM_SCENARIO_KEY = 'drrkobe_bip_lithium_scenario';
const STABLE_DOWNTIME_KEY = 'drrkobe_bip_stable_downtime_baseline';

const DOWNTIME_REDUCTION_FACTOR = 0.75;
const MAINTENANCE_REDUCTION_FACTOR = 0.90;
const CHARGING_COST_REDUCTION_FACTOR = 0.28;

type FinancialContext = {
  actualDowntimeHoursPerUnitMonth: number | null;
  downtimeCostPerHour: number;
  maintenanceCostPerUnitMonth: number;
  chargingCostPerUnitMonth: number;
  fleetSize: number;
};

function stepEight(): HTMLElement | null {
  return Array.from(document.querySelectorAll<HTMLElement>('section')).find((section) => {
    const title = section.querySelector('h1')?.textContent ?? '';
    return title.includes('Validasi Kebutuhan Operasional') || title.includes('Hitung Potensi Efisiensi');
  }) ?? null;
}

function readExisting(): FinancialContext {
  const fallback: FinancialContext = {
    actualDowntimeHoursPerUnitMonth: null,
    downtimeCostPerHour: 0,
    maintenanceCostPerUnitMonth: 0,
    chargingCostPerUnitMonth: 0,
    fleetSize: 1,
  };

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

function inputNumberByLabel(section: HTMLElement, labelText: string): number | null {
  const target = labelText.toLowerCase();
  const label = Array.from(section.querySelectorAll<HTMLLabelElement>('label')).find((node) =>
    (node.textContent ?? '').toLowerCase().includes(target),
  );
  const input = label?.querySelector<HTMLInputElement>('input[type="number"]');
  if (!input) return null;
  const raw = input.value.trim();

  // Jangan menimpa nilai yang sudah dikunci dengan 0 hanya karena controlled input
  // sedang transient/blank ketika React melakukan render ulang.
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

function syncNow() {
  const section = stepEight();
  if (!section) return;

  const existing = readExisting();
  const downtime = inputNumberByLabel(section, 'biaya downtime 1 forklift / jam');
  const maintenance = inputNumberByLabel(section, 'maintenance lead acid / unit / bulan');
  const charging = inputNumberByLabel(section, 'charging / listrik / unit / bulan');
  const stableDowntime = readStableDowntime();

  const context: FinancialContext = {
    actualDowntimeHoursPerUnitMonth: stableDowntime ?? existing.actualDowntimeHoursPerUnitMonth,
    downtimeCostPerHour: downtime ?? existing.downtimeCostPerHour,
    maintenanceCostPerUnitMonth: maintenance ?? existing.maintenanceCostPerUnitMonth,
    chargingCostPerUnitMonth: charging ?? existing.chargingCostPerUnitMonth,
    fleetSize: fleetSize(section, existing.fleetSize),
  };

  persistContext(context);
}

function syncDirectInput(target: EventTarget | null) {
  const input = target instanceof HTMLInputElement ? target : null;
  if (!input || input.type !== 'number') return;

  const section = stepEight();
  if (!section || !section.contains(input)) return;

  const labelText = (input.closest('label')?.textContent ?? '').toLowerCase();
  if (!labelText) return;

  const raw = input.value.trim();
  if (raw === '') return;

  const value = Math.max(0, Number(raw) || 0);
  const context = readExisting();
  const stableDowntime = readStableDowntime();

  context.actualDowntimeHoursPerUnitMonth = stableDowntime ?? context.actualDowntimeHoursPerUnitMonth;
  context.fleetSize = fleetSize(section, context.fleetSize);

  if (labelText.includes('biaya downtime 1 forklift / jam')) {
    context.downtimeCostPerHour = value;
  } else if (labelText.includes('maintenance lead acid / unit / bulan')) {
    context.maintenanceCostPerUnitMonth = value;
  } else if (labelText.includes('charging / listrik / unit / bulan')) {
    context.chargingCostPerUnitMonth = value;
  } else {
    return;
  }

  // Lock nilai dari event input itu sendiri. Ini mencegah nilai charging terakhir
  // hilang ketika user langsung menekan tombol menuju Step 9.
  persistContext(context);
}

export default function FinancialContextSync() {
  useEffect(() => {
    const sync = () => syncNow();

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
