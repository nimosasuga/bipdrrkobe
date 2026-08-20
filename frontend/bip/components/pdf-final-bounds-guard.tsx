'use client';

import { jsPDF } from 'jspdf';

const PAGE_W = 210;
const MARGIN = 18;
const SAFE_RIGHT = PAGE_W - MARGIN;

let activeRendererRevision = 'unknown';

type JsPdfApiWithBounds = typeof jsPDF.API & {
  __drrkobePdfFinalBoundsRegistered?: boolean;
};

type JsPdfInstanceWithBounds = jsPDF & {
  __drrkobePdfFinalBoundsPatched?: boolean;
};

type TextOptions = {
  align?: 'left' | 'center' | 'right' | 'justify';
};

type PdfFinalBoundsGuardProps = {
  revision: string;
};

function currentPage(instance: jsPDF): number {
  return Number(
    (instance as any).getCurrentPageInfo?.()?.pageNumber
      || (instance as any).internal?.getCurrentPageInfo?.()?.pageNumber
      || 1,
  );
}

function safeWidthFor(x: number, align: TextOptions['align']): number {
  if (align === 'right') return Math.max(8, x - MARGIN);
  if (align === 'center') {
    return Math.max(8, 2 * Math.min(Math.max(0, x - MARGIN), Math.max(0, SAFE_RIGHT - x)));
  }
  return Math.max(8, SAFE_RIGHT - x);
}

function maxLinesFor(page: number, y: number): number {
  // Known fixed-height regions in the report. These caps keep wrapped copy from
  // overflowing vertically after a late text replacement.
  if (page === 3 && y >= 70 && y <= 135) return 7;
  if (page === 6) return y >= 180 ? 5 : 4;
  if (page === 7 && y >= 95 && y <= 175) return 5;
  if (page === 8 && y >= 70 && y <= 155) return 4;
  if (page === 8 && y >= 220 && y <= 265) return 3;
  return 12;
}

function sanitizeNonDiagnosticChargerCopy(value: string, page: number): string {
  if (page > 5) return value;

  return value
    .replace(/kapasitas battery,\s*kondisi charger,\s*dan charging window/gi, 'kapasitas battery dan charging window')
    .replace(/kapasitas battery dan charger diverifikasi/gi, 'kapasitas battery dan charging window diverifikasi')
    .replace(/frekuensi waktu henti terkait baterai atau charger/gi, 'frekuensi waktu henti terkait baterai / proses pengisian')
    .replace(/(?:battery|baterai)\s*(?:\/|atau)\s*charger/gi, 'baterai / proses pengisian')
    .replace(/penyebab battery,\s*charger,\s*dan unit/gi, 'penyebab battery, proses pengisian, dan unit')
    .replace(/uji kapasitas battery dan charger/gi, 'uji kapasitas battery dan charging window')
    .replace(/uji charger dan kapasitas battery/gi, 'verifikasi kapasitas battery dan charging window')
    .replace(/charger\s+(bermasalah|error|mengalami gangguan|failure|fault|issue|problem)/gi, 'charging window belum tervalidasi')
    .replace(/(gangguan|error|failure|fault)\s+(pada\s+)?charger/gi, 'charging window yang belum tervalidasi')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function ellipsize(instance: jsPDF, value: string, width: number): string {
  const suffix = '...';
  let text = value.trim();
  while (text.length > 2 && instance.getTextWidth(`${text}${suffix}`) > width * 0.94) {
    text = text.slice(0, -1);
  }
  return `${text.trim()}${suffix}`;
}

function enforceBounds(
  instance: jsPDF,
  input: string | string[],
  args: unknown[],
): string | string[] {
  const x = Number(args[0]);
  const y = Number(args[1]);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return input;

  const page = currentPage(instance);
  const options = (args[2] && typeof args[2] === 'object' ? args[2] : {}) as TextOptions;
  const width = safeWidthFor(x, options.align);
  const sourceLines = Array.isArray(input) ? input.map(String) : [String(input)];
  const wrapped: string[] = [];
  let changed = false;

  for (const source of sourceLines) {
    const sanitized = sanitizeNonDiagnosticChargerCopy(source, page);
    if (sanitized !== source) changed = true;

    const line = sanitized.replace(/\s+/g, ' ').trim();
    if (!line) {
      wrapped.push('');
      continue;
    }

    if (instance.getTextWidth(line) <= width * 0.98) {
      wrapped.push(line);
      continue;
    }

    changed = true;
    const result = (instance as any).splitTextToSize(line, width * 0.94);
    const pieces = Array.isArray(result) ? result.map(String) : [String(result)];
    wrapped.push(...pieces);
  }

  const maxLines = maxLinesFor(page, y);
  if (wrapped.length > maxLines) {
    changed = true;
    const limited = wrapped.slice(0, maxLines);
    limited[limited.length - 1] = ellipsize(instance, limited[limited.length - 1], width);
    return limited;
  }

  if (!changed) return input;
  return wrapped.length === 1 && !Array.isArray(input) ? wrapped[0] : wrapped;
}

const api = jsPDF.API as JsPdfApiWithBounds;

if (!api.__drrkobePdfFinalBoundsRegistered) {
  api.__drrkobePdfFinalBoundsRegistered = true;

  // IMPORTANT: install first. Other BIP guards can still rewrite text, but every
  // rewrite must pass through this innermost wrapper immediately before jsPDF draws it.
  api.events.unshift([
    'initialized',
    function patchPdfFinalBounds(this: jsPDF) {
      const instance = this as JsPdfInstanceWithBounds;
      if (instance.__drrkobePdfFinalBoundsPatched) return;
      instance.__drrkobePdfFinalBoundsPatched = true;

      try {
        (instance as any).setProperties?.({
          creator: `DRRKOBE BIP ${activeRendererRevision}`,
          subject: `DRRKOBE BIP PDF renderer ${activeRendererRevision}`,
          keywords: `DRRKOBE,BIP,${activeRendererRevision}`,
        });
      } catch {
        // Metadata is diagnostic only; PDF generation must never fail because of it.
      }

      const originalText = instance.text;
      instance.text = ((text: string | string[], ...args: unknown[]) => {
        const bounded = enforceBounds(instance, text, args);
        return (originalText as (...params: unknown[]) => jsPDF).call(instance, bounded, ...args);
      }) as jsPDF['text'];
    },
  ]);
}

export default function PdfFinalBoundsGuard({ revision }: PdfFinalBoundsGuardProps) {
  activeRendererRevision = revision || 'unknown';
  return null;
}
