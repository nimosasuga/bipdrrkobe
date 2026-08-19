'use client';

import { jsPDF } from 'jspdf';

const FINANCIAL_CONTEXT_KEY = 'drrkobe_bip_pdf_financial_context';

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

type PdfLockState = {
  page5Metric: 'downtime' | 'maintenance' | 'charging' | 'total' | null;
  page5ChartRow: 'charging' | null;
  page7Metric: 'lead' | 'lithium' | 'gap' | 'status' | null;
};

type JsPdfApiWithLock = typeof jsPDF.API & {
  __drrkobePdfStabilityLockRegistered?: boolean;
};

type JsPdfInstanceWithLock = jsPDF & {
  __drrkobePdfStabilityLockPatched?: boolean;
};

const states = new WeakMap<jsPDF, PdfLockState>();

function stateFor(instance: jsPDF): PdfLockState {
  let state = states.get(instance);
  if (!state) {
    state = { page5Metric: null, page5ChartRow: null, page7Metric: null };
    states.set(instance, state);
  }
  return state;
}

function currentPage(instance: jsPDF): number {
  return Number(
    (instance as any).getCurrentPageInfo?.()?.pageNumber
      || (instance as any).internal?.getCurrentPageInfo?.()?.pageNumber
      || 1,
  );
}

function readFinancialContext(): FinancialContext {
  const fallback: FinancialContext = {
    actualDowntimeHoursPerUnitMonth: null,
    downtimeCostPerHour: 0,
    maintenanceCostPerUnitMonth: 0,
    chargingCostPerUnitMonth: 0,
    fleetSize: 1,
  };

  if (typeof window === 'undefined') return fallback;

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

function totals() {
  const context = readFinancialContext();
  const downtimeHours = context.actualDowntimeHoursPerUnitMonth ?? 0;
  const downtime = downtimeHours * context.downtimeCostPerHour * context.fleetSize;
  const maintenance = context.maintenanceCostPerUnitMonth * context.fleetSize;
  const charging = context.chargingCostPerUnitMonth * context.fleetSize;
  const lead = downtime + maintenance + charging;

  const lithiumDowntime = downtime * (1 - DOWNTIME_REDUCTION_FACTOR);
  const lithiumMaintenance = maintenance * (1 - MAINTENANCE_REDUCTION_FACTOR);
  const lithiumCharging = charging * (1 - CHARGING_COST_REDUCTION_FACTOR);
  const lithium = lithiumDowntime + lithiumMaintenance + lithiumCharging;
  const gap = Math.max(0, lead - lithium);

  return {
    context,
    downtime,
    maintenance,
    charging,
    lead,
    annualLead: lead * 12,
    lithium,
    gap,
    annualGap: gap * 12,
  };
}

function rupiah(value: number): string {
  return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
}

function compactRupiah(value: number): string {
  const absolute = Math.abs(value);
  const format = (amount: number) => amount.toLocaleString('id-ID', { maximumFractionDigits: 1 });
  if (absolute >= 1_000_000_000) return `Rp ${format(value / 1_000_000_000)} M`;
  if (absolute >= 1_000_000) return `Rp ${format(value / 1_000_000)} jt`;
  if (absolute >= 1_000) return `Rp ${format(value / 1_000)} rb`;
  return rupiah(value);
}

function normalizeInput(input: string | string[]): string {
  const lines = Array.isArray(input) ? input.map(String) : [String(input)];
  return lines.join(' ').replace(/\s+/g, ' ').trim();
}

function transformLockedText(instance: jsPDF, input: string | string[]): string | string[] {
  const page = currentPage(instance);
  const joined = normalizeInput(input);
  const state = stateFor(instance);

  // LOCK PAGE 4: hanya perbaiki value PENGISIAN DAYA yang terbukti overflow.
  // Suffix "/ siklus" dihilangkan dari value; konteksnya sudah jelas dari label dan note card.
  if (page === 4 && /\s\/\s*siklus$/i.test(joined) && /jam/i.test(joined)) {
    return joined.replace(/\s*\/\s*siklus$/i, '');
  }

  // LOCK PAGE 5: hanya sinkronkan nominal yang berasal dari field finansial Step 8.
  if (page === 5) {
    if (joined === 'WAKTU HENTI / BULAN') state.page5Metric = 'downtime';
    if (joined === 'PERAWATAN / BULAN') state.page5Metric = 'maintenance';
    if (joined === 'PENGISIAN / BULAN') state.page5Metric = 'charging';
    if (joined === 'TOTAL BIAYA OPERASIONAL / BULAN') state.page5Metric = 'total';

    const value = totals();

    if (state.page5Metric && /^Rp\s/i.test(joined)) {
      const metric = state.page5Metric;
      state.page5Metric = null;

      if (metric === 'downtime' && value.downtime > 0) return rupiah(value.downtime);
      if (metric === 'maintenance' && value.maintenance > 0) return rupiah(value.maintenance);
      if (metric === 'charging' && value.charging > 0) return rupiah(value.charging);
      if (metric === 'total' && value.lead > 0) return rupiah(value.lead);
    }

    if (joined.startsWith('Estimasi tahunan berdasarkan data user:') && value.lead > 0) {
      return `Estimasi tahunan berdasarkan data user: ${rupiah(value.annualLead)}.`;
    }

    if (joined === 'Pengisian') {
      state.page5ChartRow = 'charging';
      return input;
    }

    if (state.page5ChartRow === 'charging' && (joined === 'Belum dihitung' || /^Rp\s/i.test(joined))) {
      state.page5ChartRow = null;
      if (value.charging > 0) return rupiah(value.charging);
    }
  }

  // LOCK PAGE 7: card tetap sama; hanya isi value dibuat aman terhadap box.
  // Mengembalikan value sebelum pdf-text-safety mengganti string pendek menjadi string panjang.
  if (page === 7) {
    if (joined === 'WAKTU HENTI') state.page7Metric = 'lead';
    if (joined === 'EFISIENSI ENERGI') state.page7Metric = 'lithium';
    if (joined === 'PERAWATAN') state.page7Metric = 'gap';
    if (joined === 'KESESUAIAN') state.page7Metric = 'status';

    const value = totals();

    if (state.page7Metric === 'lead' && /^-?\d+(?:[.,]\d+)?%$/.test(joined) && value.lead > 0) {
      state.page7Metric = null;
      return compactRupiah(value.lead);
    }

    if (state.page7Metric === 'lithium' && /^\+?\d+(?:[.,]\d+)?%$/.test(joined) && value.lead > 0) {
      state.page7Metric = null;
      return compactRupiah(value.lithium);
    }

    if (state.page7Metric === 'gap' && /^-?\d+(?:[.,]\d+)?%$/.test(joined) && value.lead > 0) {
      state.page7Metric = null;
      return compactRupiah(value.gap);
    }

    if (state.page7Metric === 'status' && /^(Tinggi|Sedang|Rendah|Layak evaluasi)$/i.test(joined)) {
      state.page7Metric = null;
      return value.gap > 0 ? 'Layak' : 'Kaji ulang';
    }
  }

  return input;
}

const api = jsPDF.API as JsPdfApiWithLock;

if (!api.__drrkobePdfStabilityLockRegistered) {
  api.__drrkobePdfStabilityLockRegistered = true;
  api.events.push([
    'initialized',
    function patchPdfStabilityLock(this: jsPDF) {
      const instance = this as JsPdfInstanceWithLock;
      if (instance.__drrkobePdfStabilityLockPatched) return;
      instance.__drrkobePdfStabilityLockPatched = true;

      const originalText = instance.text;
      instance.text = ((text: string | string[], ...args: unknown[]) => {
        const next = transformLockedText(instance, text);
        return (originalText as (...params: unknown[]) => jsPDF).call(instance, next, ...args);
      }) as jsPDF['text'];
    },
  ]);
}

export default function PdfStabilityLock() {
  return null;
}
