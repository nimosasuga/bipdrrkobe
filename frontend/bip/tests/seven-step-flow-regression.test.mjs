import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const read = (relative) => fs.readFileSync(path.join(appRoot, relative), 'utf8');

const flow = read('app/diagnosis/form/seven-step-page.tsx');
const route = read('app/diagnosis/form/page.tsx');
const home = read('app/page.tsx');
const start = read('app/diagnosis/start/page.tsx');
const layout = read('app/layout.tsx');
const tracker = read('components/diagnosis-funnel-tracker.tsx');
const stableDowntime = read('components/stable-step8-guard.tsx');

test('diagnosis route uses the native seven-step implementation', () => {
  assert.match(route, /import SevenStepDiagnosisPage from '\.\/seven-step-page';/);
  assert.match(route, /return <SevenStepDiagnosisPage \/>/);
  assert.match(flow, /const TOTAL_STEPS = 7;/);
  assert.match(flow, /Array\.from\(\{ length: TOTAL_STEPS \}/);
  assert.doesNotMatch(flow, /STEP \d+ \/ 9/);
  assert.doesNotMatch(flow, /step === 8|step === 9/);
});

test('model, operating hours, and shift are combined on the first screen', () => {
  const stepOne = flow.match(/\{step === 1[\s\S]*?\{step === 2/)?.[0] ?? '';
  assert.match(stepOne, /Model Forklift/);
  assert.match(stepOne, /DRRKOBE OPERATION CONTEXT/);
  assert.match(stepOne, /Shift Operasional/);
  assert.match(stepOne, /Jam Operasi \/ Hari/);
  assert.match(stepOne, /setPrimaryShift/);
  assert.match(stepOne, /setPrimaryOperatingHours/);
  assert.match(stepOne, /LEAD ACID/);
});

test('redundant current-battery and standalone aggregated-impact screens are removed', () => {
  assert.doesNotMatch(flow, /Konfigurasi Battery Saat Ini/);
  assert.doesNotMatch(flow, /Dampak Operasional Gabungan/);
  assert.match(flow, /STEP 6 \/ 7 — BUSINESS IMPACT & COST CONTEXT/);
});

test('diagnosis result is premium branded without changing Health Score inputs', () => {
  const diagnosisStep = flow.match(/\{step === 4[\s\S]*?\{step === 5/)?.[0] ?? '';
  assert.match(diagnosisStep, /STEP 4 \/ 7 — AI DIAGNOSIS RESULT/);
  assert.match(diagnosisStep, /ANALYZED BY/);
  assert.match(diagnosisStep, /DRRKOBE Diagnostic Engine/);
  assert.match(diagnosisStep, /DRRKOBE\.COM\/BIP/);
  assert.match(diagnosisStep, /HealthGauge value=\{health\}/);
  assert.match(diagnosisStep, /Tingkat keyakinan/);
});

test('charger fault diagnosis does not re-enter the new form', () => {
  assert.doesNotMatch(flow, /chargerErrorFrequency/);
  assert.doesNotMatch(flow, /Seberapa sering charger menampilkan kode gangguan/);
  assert.doesNotMatch(flow, /Charger Bermasalah/);
  assert.match(flow, /chargerError: false/);
  assert.match(flow, /kompatibilitas charger/);
});

test('charging electricity remains excluded from the Rupiah input model', () => {
  assert.doesNotMatch(flow, /Charging \/ listrik \/ unit \/ bulan \(Rp\)/);
  assert.doesNotMatch(flow, /setChargingCostPerUnitMonth/);
  assert.match(flow, /chargingCostPerUnitMonth: 0/);
  assert.match(flow, /monthlyDowntimeCost \+ monthlyMaintenanceCost/);
});

test('stable downtime guard reads shift from the new Step 3 operation summary', () => {
  assert.match(stableDowntime, /function selectedShiftFromDetail/);
  assert.match(stableDowntime, /leaf\(section, 'Shift'\)/);
  assert.match(stableDowntime, /summaryValue\.match\(\/\(\\d\+\)\\s\*shift\/i\)/);
  assert.match(stableDowntime, /captureStableBaselineFromDetailStep\(\)/);
  assert.match(stableDowntime, /chargingCostPerUnitMonth: 0/);
});

test('homepage, start page, footer, and analytics agree on seven-step journey', () => {
  assert.match(home, /7 LANGKAH ASSESSMENT/);
  assert.doesNotMatch(home, /9 LANGKAH ASSESSMENT/);
  assert.equal((home.match(/\['0[1-7]'/g) ?? []).length, 7);
  assert.match(start, /7-STEP JOURNEY/);
  assert.match(start, /Mulai 7-Step Diagnosis/);
  assert.doesNotMatch(start, /9-STEP JOURNEY|Mulai 9-Step Diagnosis/);
  assert.match(layout, /BIP • 7 LANGKAH/);
  assert.match(tracker, /STEP 4 \/ 7/);
  assert.match(tracker, /STEP 5 \/ 7/);
  assert.match(tracker, /STEP 6 \/ 7/);
  assert.match(tracker, /flow_version: '7-step'/);
});

test('native forward transitions land on the new visible steps', () => {
  assert.match(flow, /setStep\(4\);/);
  assert.match(flow, /setStep\(7\);/);
  assert.match(flow, /onBack=\{\(\) => setStep\(3\)\} onNext=\{\(\) => setStep\(5\)\}/);
  assert.match(flow, /onBack=\{\(\) => setStep\(4\)\} onNext=\{\(\) => setStep\(6\)\}/);
  assert.match(flow, /onBack=\{\(\) => setStep\(5\)\}/);
});
