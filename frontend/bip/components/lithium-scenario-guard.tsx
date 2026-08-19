'use client';

import { useEffect } from 'react';

const FINANCIAL_CONTEXT_KEY = 'drrkobe_bip_pdf_financial_context';
const LITHIUM_SCENARIO_KEY = 'drrkobe_bip_lithium_scenario';

// Existing BIP scenario factors. These are applied only to the customer's
// own operating-cost baseline. They are not battery prices and not guarantees.
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

type LithiumScenario = {
  downtimeHoursPerUnitMonth: number | null;
  maintenanceCostPerUnitMonth: number | null;
  chargingCostPerUnitMonth: number | null;
};

function readFinancialContext(): FinancialContext {
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

function buildLithiumScenario(context: FinancialContext): LithiumScenario {
  return {
    downtimeHoursPerUnitMonth: context.actualDowntimeHoursPerUnitMonth === null
      ? null
      : Math.max(0, context.actualDowntimeHoursPerUnitMonth * (1 - DOWNTIME_REDUCTION_FACTOR)),
    maintenanceCostPerUnitMonth: Math.max(
      0,
      context.maintenanceCostPerUnitMonth * (1 - MAINTENANCE_REDUCTION_FACTOR),
    ),
    chargingCostPerUnitMonth: Math.max(
      0,
      context.chargingCostPerUnitMonth * (1 - CHARGING_COST_REDUCTION_FACTOR),
    ),
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
