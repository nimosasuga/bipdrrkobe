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
const revisionReader = read('lib/server-build-revision.ts');
const dockerfile = read('Dockerfile');
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

test('generated PDFs carry the active Docker renderer revision for forensic verification', () => {
  assert.match(bounds, /activeRendererRevision/);
  assert.match(bounds, /creator: `DRRKOBE BIP \$\{activeRendererRevision\}`/);
  assert.match(bounds, /subject: `DRRKOBE BIP PDF renderer \$\{activeRendererRevision\}`/);
  assert.match(rootLayout, /<PdfFinalBoundsGuard revision=\{buildRevision\} \/>/);
});

test('each frontend Docker build creates and preserves a unique revision file', () => {
  assert.match(dockerfile, /date -u \+%Y%m%dT%H%M%SZ/);
  assert.match(dockerfile, /\/proc\/sys\/kernel\/random\/uuid/);
  assert.match(dockerfile, /> \/app\/build-revision\.txt/);
  assert.match(dockerfile, /COPY --from=builder --chown=nextjs:nodejs \/app\/build-revision\.txt \.\/build-revision\.txt/);
  assert.match(revisionReader, /readFileSync\(path\.join\(process\.cwd\(\), REVISION_FILE\)/);
});

test('stale browser tabs detect a newer deployed frontend and force a reload', () => {
  assert.match(buildGuard, /initialRevision/);
  assert.match(buildGuard, /const loadedRevision = initialRevision/);
  assert.match(buildGuard, /\/api\/build-revision\?t=\$\{Date\.now\(\)\}/);
  assert.match(buildGuard, /cache: 'no-store'/);
  assert.match(buildGuard, /serverRevision === loadedRevision/);
  assert.match(buildGuard, /window\.location\.replace/);
  assert.match(revisionRoute, /getBuildRevision\(\)/);
  assert.match(revisionRoute, /dynamic = 'force-dynamic'/);
  assert.match(revisionRoute, /no-store, no-cache, must-revalidate/);
});

test('root layout injects one server revision into both stale-tab and PDF guards', () => {
  assert.match(rootLayout, /const buildRevision = getBuildRevision\(\)/);
  assert.match(rootLayout, /<BuildRevisionGuard initialRevision=\{buildRevision\} \/>/);
  assert.match(rootLayout, /<PdfFinalBoundsGuard revision=\{buildRevision\} \/>/);
  const boundsIndex = rootLayout.indexOf('<PdfFinalBoundsGuard');
  const safetyIndex = rootLayout.indexOf('<PdfTextSafety />');
  assert.ok(boundsIndex >= 0);
  assert.ok(safetyIndex > boundsIndex);
});

test('old overflowing Lifetime Advantage copy is no longer present in consultant positioning', () => {
  assert.doesNotMatch(consultant, /Ini memperkuat nilai investasi jangka panjang/);
  assert.match(consultant, /wrappedText\(instance, lifetimeNarrative\(state\.batteryAgeYears\), 138, 5\)/);
});
