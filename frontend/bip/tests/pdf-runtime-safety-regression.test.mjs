import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const read = (relative) => fs.readFileSync(path.join(appRoot, relative), 'utf8');

const bounds = read('components/pdf-final-bounds-guard.tsx');
const buildGuard = read('components/build-revision-guard.tsx');
const rootLayout = read('app/layout.tsx');
const revisionRoute = read('app/api/build-revision/route.ts');
const consultant = read('components/pdf-consultant-positioning.tsx');

test('final PDF bounds guard is installed as the innermost jsPDF text wrapper', () => {
  assert.match(bounds, /api\.events\.unshift\(/);
  assert.match(bounds, /function enforceBounds\(/);
  assert.match(bounds, /safeWidthFor\(x, options\.align\)/);
  assert.match(bounds, /splitTextToSize\(line, width \* 0\.94\)/);
});

test('known fixed-height PDF regions have explicit line caps', () => {
  assert.match(bounds, /page === 3.*return 7/);
  assert.match(bounds, /page === 6.*return y >= 180 \? 5 : 4/);
  assert.match(bounds, /page === 7.*return 5/);
  assert.match(bounds, /page === 8.*return 4/);
  assert.match(bounds, /page === 8.*return 3/);
});

test('generated PDFs carry a renderer revision for forensic verification', () => {
  assert.match(bounds, /PDF_RENDERER_REVISION/);
  assert.match(bounds, /creator: `DRRKOBE BIP \$\{PDF_RENDERER_REVISION\}`/);
  assert.match(bounds, /subject: `DRRKOBE BIP PDF renderer \$\{PDF_RENDERER_REVISION\}`/);
});

test('stale browser tabs detect a newer deployed frontend and force a reload', () => {
  assert.match(buildGuard, /\/api\/build-revision\?t=\$\{Date\.now\(\)\}/);
  assert.match(buildGuard, /cache: 'no-store'/);
  assert.match(buildGuard, /serverRevision === BUILD_REVISION/);
  assert.match(buildGuard, /window\.location\.replace/);
  assert.match(revisionRoute, /dynamic = 'force-dynamic'/);
  assert.match(revisionRoute, /no-store, no-cache, must-revalidate/);
});

test('root layout loads final bounds protection before the existing PDF text safety layer', () => {
  const boundsIndex = rootLayout.indexOf('<PdfFinalBoundsGuard />');
  const safetyIndex = rootLayout.indexOf('<PdfTextSafety />');
  assert.ok(boundsIndex >= 0);
  assert.ok(safetyIndex > boundsIndex);
});

test('old overflowing Lifetime Advantage copy is no longer present in consultant positioning', () => {
  assert.doesNotMatch(consultant, /Ini memperkuat nilai investasi jangka panjang/);
  assert.match(consultant, /wrappedText\(instance, lifetimeNarrative\(state\.batteryAgeYears\), 138, 5\)/);
});
