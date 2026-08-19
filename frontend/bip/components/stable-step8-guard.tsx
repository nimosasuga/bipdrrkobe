'use client';

import { useEffect } from 'react';

const FINANCIAL_CONTEXT_KEY = 'drrkobe_bip_pdf_financial_context';
const STABLE_DOWNTIME_KEY = 'drrkobe_bip_stable_downtime_baseline';

type FinancialContext = {
  actualDowntimeHoursPerUnitMonth: number | null;
  downtimeCostPerHour: number;
  maintenanceCostPerUnitMonth: number;
  chargingCostPerUnitMonth: number;
  fleetSize: number;
};

function sectionByTitle(title: string): HTMLElement | null {
  return Array.from(document.querySelectorAll<HTMLElement>('section')).find(
    (section) => section.querySelector('h1')?.textContent?.includes(title),
  ) ?? null;
}

function readContext(): FinancialContext {
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

function writeContext(context: FinancialContext) {
  try {
    window.sessionStorage.setItem(FINANCIAL_CONTEXT_KEY, JSON.stringify(context));
  } catch {
    // Assessment tetap berjalan bila sessionStorage tidak tersedia.
  }
}

function readBaseline(): number | null {
  try {
    const raw = window.sessionStorage.getItem(STABLE_DOWNTIME_KEY);
    if (!raw) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? Math.max(0, value) : null;
  } catch {
    return null;
  }
}

function writeBaseline(value: number) {
  try {
    window.sessionStorage.setItem(STABLE_DOWNTIME_KEY, String(value));
  } catch {
    // Tidak memblokir assessment.
  }
}

function clearBaseline() {
  try {
    window.sessionStorage.removeItem(STABLE_DOWNTIME_KEY);
  } catch {
    // Tidak memblokir assessment.
  }
}

function captureStableBaselineFromStep4() {
  const section = sectionByTitle('Lengkapi Kondisi Operasional');
  if (!section) return;

  const ageText = Array.from(section.querySelectorAll<HTMLElement>('*')).find((node) =>
    node.children.length === 0 && node.textContent?.trim().startsWith('Perkiraan umur battery:'),
  )?.textContent ?? '';
  const ageMatch = ageText.match(/Perkiraan umur battery:\s*(\d+(?:[.,]\d+)?)\s*tahun/i);
  const age = ageMatch ? Number(ageMatch[1].replace(',', '.')) : null;

  const shiftLabel = Array.from(section.querySelectorAll<HTMLElement>('*')).find((node) =>
    node.children.length === 0 && node.textContent?.trim() === 'Berapa shift operasional per hari?',
  );
  const shiftPanel = shiftLabel?.parentElement;
  const selectedShiftButton = Array.from(shiftPanel?.querySelectorAll<HTMLButtonElement>('button') ?? []).find((button) => {
    const className = typeof button.className === 'string' ? button.className : '';
    return className.includes('bg-black');
  });
  const shiftMatch = selectedShiftButton?.textContent?.match(/(\d+)\s*Shift/i);
  const shift = shiftMatch ? Number(shiftMatch[1]) : null;

  if (age === null || shift === null) return;

  const baseline = Math.round(((age * 1.5 + shift * 2) * 1.2) * 10) / 10;
  writeBaseline(baseline);
}

function neutralizeInjectedDowntimeField() {
  const injected = document.querySelector<HTMLElement>('[data-actual-downtime-field="1"]');
  if (!injected) return;

  if (injected.childElementCount > 0) injected.replaceChildren();
  injected.style.display = 'none';
  injected.setAttribute('aria-hidden', 'true');
}

function restoreStableContext() {
  const stepEight = sectionByTitle('Hitung Potensi Efisiensi') || sectionByTitle('Validasi Kebutuhan Operasional');
  if (!stepEight) return;

  neutralizeInjectedDowntimeField();

  const baseline = readBaseline();
  if (baseline === null) return;

  const current = readContext();
  if (current.actualDowntimeHoursPerUnitMonth === baseline) return;

  writeContext({
    ...current,
    actualDowntimeHoursPerUnitMonth: baseline,
  });
}

export default function StableStep8Guard() {
  useEffect(() => {
    let queued = false;
    let stepOneSeen = false;

    const apply = () => {
      queued = false;

      const stepOne = sectionByTitle('Pilih Bidang Industri & Model Forklift');
      if (stepOne && !stepOneSeen) {
        stepOneSeen = true;
        clearBaseline();
      }

      captureStableBaselineFromStep4();
      restoreStableContext();
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

  return <style jsx global>{`[data-actual-downtime-field="1"]{display:none!important}`}</style>;
}
