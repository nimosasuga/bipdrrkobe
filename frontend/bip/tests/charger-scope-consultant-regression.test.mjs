import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const repoRoot = path.resolve(appRoot, '..', '..');

function frontendSource(relativePath) {
  return fs.readFileSync(path.join(appRoot, relativePath), 'utf8');
}

function repoSource(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

const uiGuard = frontendSource('components/charger-diagnosis-scope-guard.tsx');
const pdfPositioning = frontendSource('components/pdf-consultant-positioning.tsx');
const diagnosisLayout = frontendSource('app/diagnosis/form/layout.tsx');
const diagnosisController = repoSource('backend/api/app/Http/Controllers/Api/V1/DiagnosisController.php');
const healthScoreService = repoSource('backend/api/app/Services/HealthScoreService.php');

test('charger fault/error is outside the BIP diagnosis API contract', () => {
  assert.doesNotMatch(diagnosisController, /'answers\.charger_error'\s*=>/);
  assert.doesNotMatch(diagnosisController, /'answers\.charger_error_frequency'\s*=>/);
  assert.match(diagnosisController, /unset\(\$answers\['charger_error'\], \$answers\['charger_error_frequency'\]\);/);
});

test('charging duration remains operational evidence', () => {
  assert.match(diagnosisController, /'answers\.charging_duration'\s*=>/);
  assert.match(diagnosisController, /'answers\.charging_lama'\s*=>/);
  assert.match(healthScoreService, /\$answers\['charging_lama'\]/);
});

test('charger fault no longer contributes to diagnosis confidence or mock causes', () => {
  const causeBlock = diagnosisController.match(/private function generateMockCauses[\s\S]*?private function calculateConfidence/)?.[0] ?? '';
  const confidenceBlock = diagnosisController.match(/private function calculateConfidence[\s\S]*?public function result/)?.[0] ?? '';

  assert.doesNotMatch(causeBlock, /charger_error/);
  assert.doesNotMatch(confidenceBlock, /charger_error/);
});

test('frontend hides charger error question and rewrites charger-fault issue copy', () => {
  assert.match(uiGuard, /Seberapa sering charger menampilkan kode gangguan\?/);
  assert.match(uiGuard, /data\.drrkobeChargerFaultQuestion/);
  assert.match(uiGuard, /Pengisian Battery Terlalu Lama/);
  assert.match(uiGuard, /Forklift Sering Berhenti Karena Battery \/ Proses Pengisian/);
  assert.match(diagnosisLayout, /<ChargerDiagnosisScopeGuard \/>/);
});

test('PDF contains dynamic Lifetime Advantage positioning', () => {
  assert.match(pdfPositioning, /LIFETIME ADVANTAGE/);
  assert.match(pdfPositioning, /batteryAgeYears/);
  assert.match(pdfPositioning, /Lead Acid saat ini \$\{age\} tahun/);
  assert.match(pdfPositioning, /Potensi cycle life lebih panjang/);
});

test('PDF positions DRRKOBE as technical consultant before final commercial offer', () => {
  assert.match(pdfPositioning, /Technical Assessment Lithium-ion/);
  assert.match(pdfPositioning, /harga final belum ditentukan/);
  assert.match(pdfPositioning, /Proposal teknis dan penawaran harga final disusun setelah kompatibilitas unit dan kebutuhan site tervalidasi/);
  assert.match(pdfPositioning, /kompatibilitas charger/);
});
