import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const positioningSource = fs.readFileSync(
  path.join(appRoot, 'components/pdf-consultant-positioning.tsx'),
  'utf8',
);

test('consultant copy replacements are re-wrapped after core layout measurement', () => {
  assert.match(positioningSource, /function wrappedText\(/);
  assert.match(positioningSource, /splitTextToSize\(text, width\)/);
  assert.match(positioningSource, /Returning a raw long string here can bypass/);
});

test('page 3 operational replacement is constrained to the right-column width', () => {
  assert.match(positioningSource, /if \(page === 3\) return wrappedText\(instance, text, 92, 7\);/);
  assert.match(positioningSource, /operationalReplacement\(instance, page, input, sanitized\)/);
});

test('Lifetime Advantage table and quote copy are constrained on page 6', () => {
  assert.match(positioningSource, /lifetimeLeadText\(state\.batteryAgeYears\), 47, 4/);
  assert.match(positioningSource, /Baseline BIP ~3\.000\+ siklus; >2x cycle potential', 50, 4/);
  assert.match(positioningSource, /lifetimeNarrative\(state\.batteryAgeYears\), 138, 5/);
});

test('page 7 consultant business-case copy is constrained', () => {
  assert.match(positioningSource, /return wrappedText\(instance, replacement, 138, 5\);/);
});

test('page 8 recommendation and closing CTA are constrained', () => {
  const pageEight = positioningSource.match(/if \(page === 8\) \{[\s\S]*?\n  \}\n\n  return input;/)?.[0] ?? '';
  assert.match(pageEight, /Technical Assessment Lithium-ion', 150, 2/);
  assert.match(pageEight, /return wrappedText\(instance, replacement, 150, 4\);/);
  assert.match(pageEight, /return wrappedText\(instance, replacement, 148, 3\);/);
  assert.doesNotMatch(pageEight, /return 'Assessment awal memberi dasar untuk Technical Assessment/);
});
