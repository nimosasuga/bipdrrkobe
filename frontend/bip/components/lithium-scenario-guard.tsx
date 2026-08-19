'use client';

import { useEffect } from 'react';

const FINANCIAL_CONTEXT_KEY = 'drrkobe_bip_pdf_financial_context';
const LITHIUM_SCENARIO_KEY = 'drrkobe_bip_lithium_scenario';

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

const EMPTY_SCENARIO: LithiumScenario = {
  downtimeHoursPerUnitMonth: null,
  maintenanceCostPerUnitMonth: null,
  chargingCostPerUnitMonth: null,
};

function sectionByTitle(title: string): HTMLElement | null {
  return Array.from(document.querySelectorAll<HTMLElement>('section')).find(
    (section) => section.querySelector('h1')?.textContent?.includes(title),
  ) ?? null;
}

function leaf(root: ParentNode, text: string): HTMLElement | null {
  return Array.from(root.querySelectorAll<HTMLElement>('*')).find(
    (node) => node.children.length === 0 && node.textContent?.trim() === text,
  ) ?? null;
}

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

function readScenario(): LithiumScenario {
  try {
    const raw = window.sessionStorage.getItem(LITHIUM_SCENARIO_KEY);
    if (!raw) return { ...EMPTY_SCENARIO };
    const parsed = JSON.parse(raw) as Partial<LithiumScenario>;
    return {
      downtimeHoursPerUnitMonth: typeof parsed.downtimeHoursPerUnitMonth === 'number'
        ? Math.max(0, parsed.downtimeHoursPerUnitMonth)
        : null,
      maintenanceCostPerUnitMonth: typeof parsed.maintenanceCostPerUnitMonth === 'number'
        ? Math.max(0, parsed.maintenanceCostPerUnitMonth)
        : null,
      chargingCostPerUnitMonth: typeof parsed.chargingCostPerUnitMonth === 'number'
        ? Math.max(0, parsed.chargingCostPerUnitMonth)
        : null,
    };
  } catch {
    return { ...EMPTY_SCENARIO };
  }
}

function writeScenario(scenario: LithiumScenario) {
  try {
    window.sessionStorage.setItem(LITHIUM_SCENARIO_KEY, JSON.stringify(scenario));
  } catch {
    // Assessment tidak boleh gagal bila browser memblokir sessionStorage.
  }
}

function clearScenario() {
  try {
    window.sessionStorage.removeItem(LITHIUM_SCENARIO_KEY);
  } catch {
    // Tidak memblokir assessment.
  }
}

function parseOptionalNumber(input: HTMLInputElement | null): number | null {
  const raw = input?.value.trim() ?? '';
  if (raw === '') return null;
  return Math.max(0, Number(raw) || 0);
}

function rupiah(value: number): string {
  return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
}

function calculateCurrent(context: FinancialContext): number | null {
  if (context.actualDowntimeHoursPerUnitMonth === null || context.downtimeCostPerHour <= 0) return null;
  return (
    context.actualDowntimeHoursPerUnitMonth * context.downtimeCostPerHour * context.fleetSize
    + context.maintenanceCostPerUnitMonth * context.fleetSize
    + context.chargingCostPerUnitMonth * context.fleetSize
  );
}

function calculateLithium(context: FinancialContext, scenario: LithiumScenario): number | null {
  if (
    context.downtimeCostPerHour <= 0
    || scenario.downtimeHoursPerUnitMonth === null
    || scenario.maintenanceCostPerUnitMonth === null
    || scenario.chargingCostPerUnitMonth === null
  ) return null;

  return (
    scenario.downtimeHoursPerUnitMonth * context.downtimeCostPerHour * context.fleetSize
    + scenario.maintenanceCostPerUnitMonth * context.fleetSize
    + scenario.chargingCostPerUnitMonth * context.fleetSize
  );
}

function ensureScenarioPanel(section: HTMLElement) {
  const financialMarker = leaf(section, 'DATA FINANSIAL — OPSIONAL');
  const financialPanel = financialMarker?.parentElement;
  if (!financialPanel || financialPanel.querySelector('[data-lithium-scenario-panel="1"]')) return;

  const stored = readScenario();
  const panel = document.createElement('div');
  panel.dataset.lithiumScenarioPanel = '1';
  panel.className = 'mt-6 rounded-[22px] border border-zinc-900 bg-zinc-950 p-5 text-white';
  panel.innerHTML = `
    <div class="font-mono text-[10px] font-bold tracking-[.14em] text-[#FFCC00]">PEMBANDING OPERASIONAL LITHIUM-ION — OPSIONAL</div>
    <h4 class="mt-3 text-lg font-black">Bandingkan biaya Lead Acid saat ini dengan skenario Lithium-ion</h4>
    <p class="mt-2 text-xs leading-5 text-zinc-300">Isi hanya bila Anda memiliki target, benchmark internal, pilot, atau angka dari proposal teknis. DRRKOBE tidak mengisi angka Lithium-ion secara otomatis dan harga battery tidak termasuk.</p>

    <div class="mt-5 grid gap-4 md:grid-cols-3">
      <label class="block text-xs font-bold text-zinc-200">Target downtime battery / charging per forklift / bulan (jam)
        <input data-lithium-downtime="1" class="drr-input mt-2" type="number" min="0" step="0.1" inputmode="decimal" placeholder="Contoh: 10" value="${stored.downtimeHoursPerUnitMonth ?? ''}">
      </label>
      <label class="block text-xs font-bold text-zinc-200">Maintenance Lithium-ion / unit / bulan (Rp)
        <input data-lithium-maintenance="1" class="drr-input mt-2" type="number" min="0" step="1000" inputmode="numeric" placeholder="Isi jika diketahui" value="${stored.maintenanceCostPerUnitMonth ?? ''}">
      </label>
      <label class="block text-xs font-bold text-zinc-200">Charging / listrik Lithium-ion / unit / bulan (Rp)
        <input data-lithium-charging="1" class="drr-input mt-2" type="number" min="0" step="1000" inputmode="numeric" placeholder="Isi jika diketahui" value="${stored.chargingCostPerUnitMonth ?? ''}">
      </label>
    </div>

    <div data-lithium-preview="1" class="mt-5 rounded-[16px] border border-zinc-700 bg-zinc-900 p-4 text-sm leading-6 text-zinc-200">Menunggu data pembanding Lithium-ion.</div>
    <p class="mt-3 text-[11px] leading-5 text-zinc-400">Perbandingan ini adalah operating-cost scenario berdasarkan angka yang Anda masukkan. Nilainya bukan jaminan saving dan tidak menggantikan verifikasi charger, BMS, konektor, dimensi, kapasitas, temperatur, serta duty cycle.</p>
  `;

  financialPanel.appendChild(panel);
}

function captureScenario(section: HTMLElement): LithiumScenario {
  const scenario: LithiumScenario = {
    downtimeHoursPerUnitMonth: parseOptionalNumber(section.querySelector<HTMLInputElement>('[data-lithium-downtime="1"]')),
    maintenanceCostPerUnitMonth: parseOptionalNumber(section.querySelector<HTMLInputElement>('[data-lithium-maintenance="1"]')),
    chargingCostPerUnitMonth: parseOptionalNumber(section.querySelector<HTMLInputElement>('[data-lithium-charging="1"]')),
  };
  writeScenario(scenario);
  return scenario;
}

function updatePreview(section: HTMLElement, scenario: LithiumScenario) {
  const preview = section.querySelector<HTMLElement>('[data-lithium-preview="1"]');
  if (!preview) return;

  const current = readFinancialContext();
  const leadAcidMonthly = calculateCurrent(current);
  const lithiumMonthly = calculateLithium(current, scenario);

  if (leadAcidMonthly === null) {
    preview.textContent = 'Lengkapi downtime aktual dan biaya Lead Acid terlebih dahulu agar biaya saat ini dapat dibandingkan.';
    return;
  }

  if (lithiumMonthly === null) {
    preview.textContent = `Lead Acid saat ini: ${rupiah(leadAcidMonthly)} / bulan. Lengkapi 3 input skenario Lithium-ion untuk menghasilkan perbandingan biaya bulanan dan tahunan di PDF.`;
    return;
  }

  const gap = leadAcidMonthly - lithiumMonthly;
  const monthlyMessage = gap >= 0
    ? `Potensi selisih operating cost: ${rupiah(gap)} / bulan (${rupiah(gap * 12)} / tahun).`
    : `Skenario Lithium-ion lebih tinggi ${rupiah(Math.abs(gap))} / bulan dibanding data Lead Acid saat ini.`;

  preview.textContent = `Lead Acid: ${rupiah(leadAcidMonthly)} / bulan • Skenario Lithium-ion: ${rupiah(lithiumMonthly)} / bulan • ${monthlyMessage}`;
}

export default function LithiumScenarioGuard() {
  useEffect(() => {
    let queued = false;
    let stepOneSeen = false;

    const apply = () => {
      queued = false;

      const stepOne = sectionByTitle('Pilih Bidang Industri & Model Forklift');
      if (stepOne && !stepOneSeen) {
        stepOneSeen = true;
        clearScenario();
      }

      const stepEight = sectionByTitle('Hitung Potensi Efisiensi') || sectionByTitle('Validasi Kebutuhan Operasional');
      if (!stepEight) return;

      ensureScenarioPanel(stepEight);
      const scenario = captureScenario(stepEight);
      updatePreview(stepEight, scenario);
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
