import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

function source(relativePath) {
  return fs.readFileSync(path.join(appRoot, relativePath), 'utf8');
}

const pdfSource = source('lib/generate-assessment-pdf.ts');
const formSource = source('app/diagnosis/form/page.tsx');
const financialSyncSource = source('components/financial-context-sync.tsx');

function monthlyChargingCost(costPerUnitMonth, fleetSize) {
  const unitCost = Math.max(0, Number(costPerUnitMonth) || 0);
  const units = Math.max(1, Number(fleetSize) || 1);
  return unitCost * units;
}

test('Page 5 charging cost is independent from charging-duration knowledge', () => {
  assert.match(
    pdfSource,
    /const monthlyChargingCost = chargingCostProvided\s*\?\s*chargingCostPerUnitMonth \* fleetSize\s*:\s*0;/,
    'Production PDF formula must use customer charging cost x fleet size.',
  );

  assert.doesNotMatch(
    pdfSource,
    /const monthlyChargingCost\s*=\s*chargingKnown\s*\?/,
    'Charging cost must never be zeroed only because charging duration is unknown.',
  );
});

test('Page 5 card renders the customer charging amount when provided', () => {
  assert.match(
    pdfSource,
    /'Pengisian \/ bulan',[\s\S]{0,260}chargingCostProvided\s*\?\s*rupiah\(monthlyChargingCost\)\s*:\s*'Belum diketahui'/,
    'Page 5 card must be driven by chargingCostProvided, not chargingKnown.',
  );
});

test('Diagnosis form passes charging cost and fleet size directly to PDF generator', () => {
  assert.match(formSource, /fleetSize:\s*jumlahForklift,/);
  assert.match(formSource, /chargingCostPerUnitMonth,/);
  assert.match(
    formSource,
    /const monthlyChargingCost = chargingCostPerUnitMonth \* jumlahForklift;/,
    'UI preview and PDF payload must use the same charging-cost basis.',
  );
});

test('Financial sync clears stale charging values when user removes or rejects financial data', () => {
  assert.match(
    financialSyncSource,
    /if \(mode === 'unknown'\) \{[\s\S]{0,320}patch\.chargingCostPerUnitMonth = 0;/,
    'Unknown mode must clear stale charging values.',
  );

  assert.match(
    financialSyncSource,
    /const value = raw === '' \? 0 : Math\.max\(0, Number\(raw\) \|\| 0\);/,
    'Clearing a financial input must persist zero instead of restoring a stale value.',
  );
});

test('Required charging-cost regression cases remain deterministic', () => {
  const cases = [
    [350_000, 1, 350_000],
    [350_000, 5, 1_750_000],
    [350_000, 10, 3_500_000],
    [0, 5, 0],
  ];

  for (const [cost, units, expected] of cases) {
    assert.equal(monthlyChargingCost(cost, units), expected, `${cost} x ${units} must equal ${expected}`);
  }
});
