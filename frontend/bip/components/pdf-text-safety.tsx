'use client';

import { jsPDF } from 'jspdf';

type JsPdfApiWithGuard = typeof jsPDF.API & {
  __drrkobePdfTextSafetyRegistered?: boolean;
};

type JsPdfInstanceWithGuard = jsPDF & {
  __drrkobePdfTextSafetyPatched?: boolean;
};

function normalizePdfText(value: string): string {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/[\u200b-\u200d\ufeff]/g, '')
    .replace(/[‐‑‒–—―]/g, '-')
    .replace(/≥/g, '>=')
    .replace(/≤/g, '<=')
    .replace(/[“”„]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, '...');
}

const api = jsPDF.API as JsPdfApiWithGuard;

if (!api.__drrkobePdfTextSafetyRegistered) {
  api.__drrkobePdfTextSafetyRegistered = true;

  api.events.push([
    'initialized',
    function patchPdfTextSafety(this: jsPDF) {
      const instance = this as JsPdfInstanceWithGuard;

      if (instance.__drrkobePdfTextSafetyPatched) return;
      instance.__drrkobePdfTextSafetyPatched = true;

      const originalText = instance.text;
      const originalGetTextWidth = instance.getTextWidth;

      instance.getTextWidth = ((text: string) => {
        return originalGetTextWidth.call(instance, normalizePdfText(String(text)));
      }) as jsPDF['getTextWidth'];

      instance.text = ((text: string | string[], ...args: unknown[]) => {
        const safeText = Array.isArray(text)
          ? text.map((line) => normalizePdfText(String(line)))
          : normalizePdfText(String(text));

        return (originalText as (...params: unknown[]) => jsPDF).call(instance, safeText, ...args);
      }) as jsPDF['text'];
    },
  ]);
}

export default function PdfTextSafety() {
  return null;
}
