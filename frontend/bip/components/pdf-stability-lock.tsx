'use client';

import { jsPDF } from 'jspdf';

const FINANCIAL_CONTEXT_KEY = 'drrkobe_bip_pdf_financial_context';
const DIRECT_FINANCIAL_CONTEXT_KEY = 'drrkobe_bip_pdf_financial_direct';

const DOWNTIME_REDUCTION_FACTOR = 0.75;
const MAINTENANCE_REDUCTION_FACTOR = 0.90;

type FinancialContext = {
  actualDowntimeHoursPerUnitMonth: number | null;
  downtimeCostPerHour: number;
  maintenanceCostPerUnitMonth: number;
  // Compatibility only. Charging is not part of the Rupiah model.
  chargingCostPerUnitMonth: number;
  fleetSize: number;
};

type DirectFinancialContext = Partial<Pick<
  FinancialContext,
  'downtimeCostPerHour' | 'maintenanceCostPerUnitMonth' | 'chargingCostPerUnitMonth' | 'fleetSize'
>>;

type PdfLockState = {
  page5Metric: 'downtime' | 'maintenance' | 'chargingOperational' | 'total' | null;
  page5ChargingNotePending: boolean;
  page5ChartChargingPending: boolean;
  page5FallbackActive: boolean;
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
    state = {
      page5Metric: null,
      page5ChargingNotePending: false,
      page5ChartChargingPending: false,
      page5FallbackActive: false,
      page7Metric: null,
    };
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

function readDirectFinancialContext(): DirectFinancialContext {
  if (typeof window === 'undefined') return {};

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

  if (typeof window === 'undefined') return fallback;

  let parsed: Partial<FinancialContext> = {};
  try {
    const raw = window.sessionStorage.getItem(FINANCIAL_CONTEXT_KEY);
    if (raw) parsed = JSON.parse(raw) as Partial<FinancialContext>;
  } catch {
    parsed = {};
  }

  const direct = readDirectFinancialContext();
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

function totals() {
  const context = readFinancialContext();
  const downtimeHours = context.actualDowntimeHoursPerUnitMonth ?? 0;
  const downtime = downtimeHours * context.downtimeCostPerHour * context.fleetSize;
  const maintenance = context.maintenanceCostPerUnitMonth * context.fleetSize;

  // Financial baseline BIP: downtime + routine Lead Acid maintenance only.
  const lead = downtime + maintenance;
  const lithiumDowntime = downtime * (1 - DOWNTIME_REDUCTION_FACTOR);
  const lithiumMaintenance = maintenance * (1 - MAINTENANCE_REDUCTION_FACTOR);
  const lithium = lithiumDowntime + lithiumMaintenance;
  const gap = Math.max(0, lead - lithium);

  return {
    context,
    downtime,
    maintenance,
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

function isPage5Amount(value: string): boolean {
  return /^Rp\s/i.test(value) || /^(Belum diketahui|Belum dihitung|Belum final|Non-finansial)$/i.test(value);
}

function transformLockedText(instance: jsPDF, input: string | string[]): string | string[] {
  const page = currentPage(instance);
  const joined = normalizeInput(input);
  const state = stateFor(instance);

  // PAGE 4: charging tetap merupakan data operasional.
  if (page === 4 && /\s\/\s*siklus$/i.test(joined) && /jam/i.test(joined)) {
    return joined.replace(/\s*\/\s*siklus$/i, '');
  }

  if (page === 5) {
    const value = totals();

    if (joined === 'WAKTU HENTI / BULAN') state.page5Metric = 'downtime';
    if (joined === 'PERAWATAN / BULAN') state.page5Metric = 'maintenance';
    if (joined === 'TOTAL BIAYA OPERASIONAL / BULAN') state.page5Metric = 'total';

    if (joined === 'PENGISIAN / BULAN') {
      state.page5Metric = 'chargingOperational';
      return 'CHARGING / OPERASIONAL';
    }

    if (state.page5Metric && isPage5Amount(joined)) {
      const metric = state.page5Metric;
      state.page5Metric = null;

      if (metric === 'downtime' && value.downtime > 0) return rupiah(value.downtime);
      if (metric === 'maintenance' && value.maintenance > 0) return rupiah(value.maintenance);
      if (metric === 'total' && value.lead > 0) return rupiah(value.lead);
      if (metric === 'chargingOperational') {
        state.page5ChargingNotePending = true;
        return 'Non-finansial';
      }
    }

    if (
      state.page5ChargingNotePending
      && /^(Menunggu biaya pengisian|Menunggu data pengisian|Berdasarkan data perusahaan)$/i.test(joined)
    ) {
      state.page5ChargingNotePending = false;
      return 'Gunakan durasi charging pada halaman 4';
    }

    // Generator lama dapat masuk ke status menunggu walau ada maintenance/downtime yang valid.
    if (joined === 'STATUS DATA BIAYA' && value.lead > 0) {
      state.page5FallbackActive = true;
      return 'TOTAL BIAYA OPERASIONAL / BULAN';
    }

    if (state.page5FallbackActive && joined === 'Menunggu data biaya perusahaan' && value.lead > 0) {
      return rupiah(value.lead);
    }

    if (
      state.page5FallbackActive
      && joined.startsWith('Tidak mengetahui biaya internal bukan masalah.')
      && value.lead > 0
    ) {
      state.page5FallbackActive = false;
      return `Berdasarkan biaya downtime dan/atau Maintenance Lead Acid yang diberikan perusahaan. Total teridentifikasi ${rupiah(value.lead)} / bulan.`;
    }

    if (joined.startsWith('Estimasi tahunan berdasarkan data user:') && value.lead > 0) {
      return `Estimasi tahunan berdasarkan data user: ${rupiah(value.annualLead)}.`;
    }

    if (joined === 'Pengisian') {
      state.page5ChartChargingPending = true;
      return 'Charging (operasional)';
    }

    if (state.page5ChartChargingPending && isPage5Amount(joined)) {
      state.page5ChartChargingPending = false;
      return 'Non-finansial';
    }
  }

  // PAGE 7: perbandingan biaya hanya memakai downtime + maintenance.
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
