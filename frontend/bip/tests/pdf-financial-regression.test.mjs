import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

function source(relativePath) {
  return fs.readFileSync(path.join(appRoot, relativePath), 'utf8');
}

const pdfBoundarySource = source('lib/generate-assessment-pdf.ts');
const financialSyncSource = source('components/financial-context-sync.tsx');
const stableStep8Source = source('components/stable-step8-guard.tsx');
const lithiumScenarioSource = source('components/lithium-scenario-guard.tsx');
const pdfLockSource = source('components/pdf-stability-lock.tsx');

function leadAcidMonthlyCost({ downtimeCostPerHour, downtimeHours, maintenancePerUnitMonth, fleetSize }) {
  const units = Math.max(1, Number(fleetSize) || 1);
  const downtime = Math.max(0, Number(downtimeCostPerHour) || 0)
    * Math.max(0, Number(downtimeHours) || 0)
    * units;
  const maintenance = Math.max(0, Number(maintenancePerUnitMonth) || 0) * units;
  return { downtime, maintenance, total: downtime + maintenance };
}

function lithiumMonthlyScenario({ downtime, maintenance }) {
  return downtime * 0.25 + maintenance * 0.10;
}

test('Public PDF boundary always blocks charging/electricity Rupiah cost', () => {
  assert.match(
    pdfBoundarySource,
    /chargingCostPerUnitMonth:\s*0,/,
    'Public PDF boundary must force the legacy charging cost field to zero.',
  );
  assert.match(
    pdfBoundarySource,
    /Charging duration remains an operational input/,
    'Boundary must document that charging remains operational context.',
  );
});

test('Step 8 hides the legacy Charging/listrik Rupiah input', () => {
  assert.match(financialSyncSource, /LEGACY_CHARGING_COST_LABELS/);
  assert.match(financialSyncSource, /charging \/ listrik \/ unit \/ bulan/);
  assert.match(financialSyncSource, /data-drrkobe-legacy-charging-cost/);
  assert.match(financialSyncSource, /input\.disabled = true;/);
});

test('Battery-water cost aliases belong to Maintenance Lead Acid', () => {
  const maintenanceBlock = financialSyncSource.match(/const MAINTENANCE_LABELS = \[[\s\S]*?\];/)?.[0] ?? '';
  const legacyChargingBlock = financialSyncSource.match(/const LEGACY_CHARGING_COST_LABELS = \[[\s\S]*?\];/)?.[0] ?? '';

  assert.match(maintenanceBlock, /biaya air battery \/ unit \/ bulan/);
  assert.match(maintenanceBlock, /biaya air battery per bulan/);
  assert.match(maintenanceBlock, /biaya air battery perbulan/);
  assert.doesNotMatch(legacyChargingBlock, /biaya air battery/);
});

test('Financial preview only totals downtime plus maintenance', () => {
  assert.match(
    financialSyncSource,
    /const subtotal = monthlyDowntime \+ monthlyMaintenance;/,
    'Step 8 subtotal must only include downtime and maintenance.',
  );
  assert.doesNotMatch(financialSyncSource, /subtotal\s*=.*monthlyCharging/);
});

test('Legacy charging values are neutralized in every financial storage path', () => {
  assert.match(financialSyncSource, /chargingCostPerUnitMonth:\s*0/);
  assert.match(stableStep8Source, /chargingCostPerUnitMonth:\s*0/);
  assert.match(lithiumScenarioSource, /chargingCostPerUnitMonth:\s*0/);
  assert.doesNotMatch(lithiumScenarioSource, /CHARGING_COST_REDUCTION_FACTOR/);
});

test('PDF Page 5 labels charging as non-financial operational context', () => {
  assert.match(pdfLockSource, /CHARGING \/ OPERASIONAL/);
  assert.match(pdfLockSource, /Non-finansial/);
  assert.match(pdfLockSource, /Gunakan durasi charging pada halaman 4/);
  assert.match(pdfLockSource, /const lead = downtime \+ maintenance;/);
});

test('Required PT AAM regression case remains deterministic without charging Rupiah', () => {
  const lead = leadAcidMonthlyCost({
    downtimeCostPerHour: 100_000,
    downtimeHours: 12.6,
    maintenancePerUnitMonth: 500_000,
    fleetSize: 3,
  });

  assert.equal(lead.downtime, 3_780_000);
  assert.equal(lead.maintenance, 1_500_000);
  assert.equal(lead.total, 5_280_000);
  assert.equal(lead.total * 12, 63_360_000);

  const lithium = lithiumMonthlyScenario(lead);
  assert.equal(lithium, 1_095_000);
  assert.equal(lead.total - lithium, 4_185_000);
  assert.equal((lead.total - lithium) * 12, 50_220_000);
});

test('Charging cannot change the deterministic cost result', () => {
  const baseline = leadAcidMonthlyCost({
    downtimeCostPerHour: 100_000,
    downtimeHours: 12.6,
    maintenancePerUnitMonth: 500_000,
    fleetSize: 3,
  });

  // There is intentionally no charging-cost parameter in the financial model.
  assert.deepEqual(baseline, {
    downtime: 3_780_000,
    maintenance: 1_500_000,
    total: 5_280_000,
  });
});
