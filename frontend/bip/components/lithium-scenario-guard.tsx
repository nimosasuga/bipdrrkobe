'use client';

import { useEffect } from 'react';

const FINANCIAL_CONTEXT_KEY = 'drrkobe_bip_pdf_financial_context';
const DIRECT_FINANCIAL_CONTEXT_KEY = 'drrkobe_bip_pdf_financial_direct';
const LITHIUM_SCENARIO_KEY = 'drrkobe_bip_lithium_scenario';

// Scenario factors only apply to validated customer cost baselines.
const DOWNTIME_REDUCTION_FACTOR = 0.75;
const MAINTENANCE_REDUCTION_FACTOR = 0.90;

type FinancialContext = {
  actualDowntimeHoursPerUnitMonth: number | null;
  downtimeCostPerHour: number;
  maintenanceCostPerUnitMonth: number;
  // Compatibility field only; always zero.
  chargingCostPerUnitMonth: number;
  fleetSize: number;
};

type DirectFinancialContext = Partial<Pick<
  FinancialContext,
  'downtimeCostPerHour' | 'maintenanceCostPerUnitMonth' | 'chargingCostPerUnitMonth' | 'fleetSize'
>>;

type LithiumScenario = {
  downtimeHoursPerUnitMonth: number | null;
  maintenanceCostPerUnitMonth: number | null;
  // Compatibility for PDF guards that still read this key. Never monetized.
  chargingCostPerUnitMonth: number;
};

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

function readFinancialContext(): FinancialContext {
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
    chargingCostPerUnitMonth: 0,
    fleetSize: direct.fleetSize ?? Math.max(1, Number(parsed.fleetSize) || fallback.fleetSize),
  };
}

function buildLithiumScenario(context: FinancialContext): LithiumScenario {
  return {
    downtimeHoursPerUnitMonth: context.actualDowntimeHoursPerUnitMonth === null
      ? null
      : Math.max(0, context.actualDowntimeHoursPerUnitMonth * (1 - DOWNTIME_REDUCTION_FACTOR)),
    maintenanceCostPerUnitMonth: Math.max(
      0,
      context.maintenanceCostPerUnitMonth * (1 - MAINTENANCE_REDUCTION_FACTOR),
    ),
    chargingCostPerUnitMonth: 0,
  };
}

function writeScenario(scenario: LithiumScenario) {
  try {
    window.sessionStorage.setItem(LITHIUM_SCENARIO_KEY, JSON.stringify(scenario));
  } catch {
    // Assessment tetap berjalan bila browser memblokir sessionStorage.
  }
}

export default function LithiumScenarioGuard() {
  useEffect(() => {
    let queued = false;

    const apply = () => {
      queued = false;
      const context = readFinancialContext();
      writeScenario(buildLithiumScenario(context));
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
