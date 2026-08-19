'use client';

import { useEffect } from 'react';
import { jsPDF } from 'jspdf';
import kobexindoLogo from '../Desain-tanpa-judul-29-1-1030x548.png';

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 18;
const SAFE_RIGHT = PAGE_W - MARGIN;
const TOTAL_PAGES = 9;
const PAPER: [number, number, number] = [252, 252, 249];
const BLACK: [number, number, number] = [10, 10, 10];
const YELLOW: [number, number, number] = [255, 204, 0];
const GREY: [number, number, number] = [82, 82, 91];
const MID_GREY: [number, number, number] = [161, 161, 170];
const LIGHT: [number, number, number] = [228, 228, 231];
const WHITE: [number, number, number] = [255, 255, 255];
const WHATSAPP_DISPLAY = '0851 3333 1476';
const WHATSAPP_LINK = 'https://wa.me/6285133331476';

type JsPdfApiWithV3 = typeof jsPDF.API & {
  __drrkobePdfV3Registered?: boolean;
};

type JsPdfInstanceWithV3 = jsPDF & {
  __drrkobePdfV3Patched?: boolean;
  __drrkobePdfV3Finalized?: boolean;
};

let kobexindoImage: HTMLImageElement | null = null;

function currentPage(instance: jsPDF): number {
  return Number(
    (instance as any).getCurrentPageInfo?.()?.pageNumber
      || (instance as any).internal?.getCurrentPageInfo?.()?.pageNumber
      || 1,
  );
}

function managementNarrative(text: string): string | null {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized.startsWith('Kondisi battery menunjukkan risiko operasional tinggi.')) return null;

  const operation = normalized.match(/Pada pola\s+(\d+)\s+shift\s+dan\s+sekitar\s+(\d+)\s+jam operasi per hari/i);
  const shift = operation?.[1];
  const hours = operation?.[2];
  const operationText = shift && hours ? `${shift} shift / ${hours} jam operasi` : 'pola operasi yang dilaporkan';

  return `Assessment menunjukkan Lead Acid telah menjadi bottleneck kesiapan unit pada ${operationText}. Fokus keputusan adalah memastikan kapasitas battery, kondisi charger, dan charging window masih mampu mengikuti duty cycle. Bila keterbatasan tetap berasal dari battery dan charging, Lithium-ion layak masuk evaluasi teknis berikutnya.`;
}

function transformV3Text(instance: jsPDF, input: string | string[]): string | string[] {
  const page = currentPage(instance);
  const lines = Array.isArray(input) ? input.map(String) : [String(input)];
  const joined = lines.join(' ').replace(/\s+/g, ' ').trim();

  if (page === 1) {
    const executive = managementNarrative(joined);
    if (executive) return (instance as any).splitTextToSize(executive, 100).slice(0, 6);

    if (joined.startsWith('Lanjutkan ke pemeriksaan teknis lapangan untuk menentukan apakah Lead Acid')) {
      const replacement = 'Prioritaskan technical assessment Lithium-ion setelah kapasitas battery dan charger diverifikasi. Fokus keputusan: availability, charging window, dan kecocokan teknologi terhadap duty cycle.';
      return (instance as any).splitTextToSize(replacement, 148).slice(0, 4);
    }
  }

  if (page === 4) {
    if (joined === 'Durasi aktual dari user') return 'Estimasi dari pola assessment';
    if (/^\d+\s+unit\s+x\s+\d+(?:[.,]\d+)?\s+jam\s+aktual$/i.test(joined)) {
      return 'Estimasi dari pola operasi assessment';
    }
  }

  if (page === 5) {
    if (/^\d+\s+unit\s+x\s+\d+(?:[.,]\d+)?\s+jam\s+aktual$/i.test(joined)) {
      return 'Estimasi dari pola operasi assessment';
    }
    if (joined.startsWith('Perbandingan Lithium-ion menggunakan skenario yang diisi user')) {
      return 'Estimasi penghematan Lithium-ion dihitung dari baseline biaya customer dan faktor skenario BIP.';
    }
    if (joined.startsWith('Skenario potensi pengurangan beban:')) {
      return 'Estimasi avoidable operating cost Lithium-ion menggunakan baseline biaya customer.';
    }
  }

  if (page === 7) {
    if (joined === 'Skenario input user') return 'Estimasi baseline assessment';
    if (joined === 'Potensi pengurangan pekerjaan rutin') return 'Estimated avoidable cost';
    if (joined.startsWith('Bandingkan biaya Lead Acid aktual dengan skenario Lithium-ion yang diisi user')) {
      return 'Bandingkan biaya Lead Acid aktual dengan estimasi Lithium-ion dari baseline assessment.';
    }

    if (joined.includes('Ini skenario berbasis input user, bukan jaminan saving.')) {
      const replacement = joined.replace(
        'Ini skenario berbasis input user, bukan jaminan saving.',
        'Estimasi menggunakan baseline assessment dan faktor skenario BIP; nilai final memerlukan validasi site.',
      );
      return (instance as any).splitTextToSize(replacement, 148).slice(0, 5);
    }

    if (joined.startsWith('Pada armada')) {
      const replacement = 'Business case ini menghubungkan biaya Lead Acid yang dilaporkan dengan estimated avoidable operating cost Lithium-ion. Fokus utama adalah downtime, routine maintenance, dan charging. Validasi charger, BMS, konektor, dimensi, kapasitas, temperatur, dan duty cycle tetap wajib sebelum keputusan investasi.';
      return (instance as any).splitTextToSize(replacement, 148).slice(0, 5);
    }
  }

  if (page === 8 && joined.includes('berdasarkan skenario yang diisi user')) {
    const replacement = joined.replace(
      'berdasarkan skenario yang diisi user',
      'berdasarkan baseline assessment',
    );
    return (instance as any).splitTextToSize(replacement, 148).slice(0, 4);
  }

  return input;
}

function drawWatermark(instance: jsPDF, page: number) {
  instance.setPage(page);
  instance.setFont('helvetica', 'bold');
  instance.setFontSize(44);
  instance.setTextColor(235, 235, 232);
  instance.text('BIP', PAGE_W / 2, PAGE_H / 2 + 3, {
    align: 'center',
    angle: 35,
  });

  instance.setFont('helvetica', 'bold');
  instance.setFontSize(8.5);
  instance.setTextColor(226, 226, 222);
  instance.text('DRRKOBE.COM', PAGE_W / 2, PAGE_H / 2 + 17, {
    align: 'center',
    angle: 35,
  });
}

function overwritePageNumber(instance: jsPDF, page: number) {
  instance.setPage(page);
  instance.setFillColor(...PAPER);
  instance.rect(SAFE_RIGHT - 26, PAGE_H - 15, 28, 9, 'F');
  instance.setFont('helvetica', 'normal');
  instance.setFontSize(6.1);
  instance.setTextColor(...MID_GREY);
  instance.text(`${page} / ${TOTAL_PAGES}`, SAFE_RIGHT, PAGE_H - 10, { align: 'right' });
}

function drawPageNine(instance: jsPDF) {
  instance.addPage();
  instance.setFillColor(...PAPER);
  instance.rect(0, 0, PAGE_W, PAGE_H, 'F');

  instance.setFont('helvetica', 'bold');
  instance.setFontSize(12);
  instance.setTextColor(...BLACK);
  instance.text('DRRKOBE', MARGIN, 13);
  instance.setFillColor(...YELLOW);
  instance.roundedRect(MARGIN + 23, 7.5, 10, 7, 1.5, 1.5, 'F');
  instance.setFontSize(6.5);
  instance.text('BIP', MARGIN + 25, 12.1);

  instance.setFont('helvetica', 'normal');
  instance.setFontSize(6.2);
  instance.setTextColor(...GREY);
  instance.text('TECHNICAL CONSULTATION & CONTACT', SAFE_RIGHT, 11.5, { align: 'right' });
  instance.setDrawColor(...LIGHT);
  instance.line(MARGIN, 17, SAFE_RIGHT, 17);

  instance.setFont('helvetica', 'bold');
  instance.setFontSize(7);
  instance.setTextColor(...GREY);
  instance.text('08 / KONTAK & KONSULTASI', MARGIN, 35);

  instance.setFontSize(22);
  instance.setTextColor(...BLACK);
  instance.text('Lanjutkan Evaluasi', MARGIN, 50);
  instance.text('Lithium-ion', MARGIN, 60);
  instance.setFillColor(...YELLOW);
  instance.rect(MARGIN, 66, 48, 2.5, 'F');

  instance.setFont('helvetica', 'normal');
  instance.setFontSize(8.8);
  instance.setTextColor(...GREY);
  const intro = 'Gunakan hasil assessment ini sebagai dasar diskusi technical assessment, validasi kompatibilitas, dan pembahasan kebutuhan battery Lithium-ion berdasarkan kondisi site.';
  const introLines = (instance as any).splitTextToSize(intro, 108).slice(0, 4);
  instance.text(introLines, MARGIN, 79);

  if (kobexindoImage?.complete && kobexindoImage.naturalWidth > 0) {
    try {
      const logoW = 64;
      const logoH = logoW * (548 / 1030);
      instance.addImage(kobexindoImage, 'PNG', SAFE_RIGHT - logoW, 34, logoW, logoH, undefined, 'FAST');
    } catch {
      // Fallback teks di bawah tetap menjaga identitas bila image decoder browser gagal.
    }
  }

  instance.setFillColor(...BLACK);
  instance.roundedRect(MARGIN, 108, 174, 72, 5, 5, 'F');
  instance.setFont('helvetica', 'bold');
  instance.setFontSize(7);
  instance.setTextColor(...YELLOW);
  instance.text('PART CONSULTANTS', MARGIN + 10, 122);

  instance.setFontSize(20);
  instance.setTextColor(...WHITE);
  instance.text('Ilham Firyanto', MARGIN + 10, 137);

  instance.setFontSize(7);
  instance.setTextColor(...MID_GREY);
  instance.text('WHATSAPP', MARGIN + 10, 150);
  instance.setFontSize(15);
  instance.setTextColor(...WHITE);
  instance.text(WHATSAPP_DISPLAY, MARGIN + 10, 163);

  try {
    (instance as any).textWithLink('Hubungi via WhatsApp →', MARGIN + 112, 163, { url: WHATSAPP_LINK });
  } catch {
    instance.setFontSize(8);
    instance.setTextColor(...YELLOW);
    instance.text('wa.me/6285133331476', MARGIN + 112, 163);
  }

  instance.setFillColor(...WHITE);
  instance.setDrawColor(...LIGHT);
  instance.roundedRect(MARGIN, 193, 174, 58, 5, 5, 'FD');
  instance.setFont('helvetica', 'bold');
  instance.setFontSize(8);
  instance.setTextColor(...BLACK);
  instance.text('INFORMASI DRRKOBE.COM', MARGIN + 9, 207);

  instance.setFont('helvetica', 'normal');
  instance.setFontSize(8.1);
  instance.setTextColor(...GREY);
  const affiliation = 'DRRKOBE.com adalah web individual Part Consultant Ilham Firyanto dari PT Kobexindo Equipment. DRRKOBE.com bukan situs korporat resmi PT Kobexindo Equipment.';
  const affiliationLines = (instance as any).splitTextToSize(affiliation, 151).slice(0, 5);
  instance.text(affiliationLines, MARGIN + 9, 219);

  instance.setFont('helvetica', 'bold');
  instance.setFontSize(9.2);
  instance.setTextColor(...BLACK);
  instance.text('drrkobe.com', MARGIN + 9, 241);

  instance.setDrawColor(...LIGHT);
  instance.line(MARGIN, 268, SAFE_RIGHT, 268);
  instance.setFont('helvetica', 'normal');
  instance.setFontSize(5.7);
  instance.setTextColor(...GREY);
  instance.text('DRRKOBE BIP • Individual technical assessment & consultation', MARGIN, 276);
  instance.text(`${TOTAL_PAGES} / ${TOTAL_PAGES}`, SAFE_RIGHT, PAGE_H - 10, { align: 'right' });
}

function finalizeV3Document(instance: JsPdfInstanceWithV3) {
  if (instance.__drrkobePdfV3Finalized) return;
  instance.__drrkobePdfV3Finalized = true;

  const existingPages = Number((instance as any).getNumberOfPages?.() || (instance as any).internal?.getNumberOfPages?.() || 8);
  if (existingPages < TOTAL_PAGES) drawPageNine(instance);

  const total = Number((instance as any).getNumberOfPages?.() || TOTAL_PAGES);
  for (let page = 1; page <= total; page += 1) {
    drawWatermark(instance, page);
    overwritePageNumber(instance, page);
  }

  instance.setPage(total);
}

const api = jsPDF.API as JsPdfApiWithV3;

if (!api.__drrkobePdfV3Registered) {
  api.__drrkobePdfV3Registered = true;
  api.events.push([
    'initialized',
    function patchPdfV3(this: jsPDF) {
      const instance = this as JsPdfInstanceWithV3;
      if (instance.__drrkobePdfV3Patched) return;
      instance.__drrkobePdfV3Patched = true;

      const originalText = instance.text;
      const originalSave = (instance as any).save.bind(instance);

      instance.text = ((text: string | string[], ...args: unknown[]) => {
        const next = transformV3Text(instance, text);
        return (originalText as (...params: unknown[]) => jsPDF).call(instance, next, ...args);
      }) as jsPDF['text'];

      (instance as any).save = (...args: unknown[]) => {
        finalizeV3Document(instance);
        return originalSave(...args);
      };
    },
  ]);
}

export default function PdfV3Branding() {
  useEffect(() => {
    const image = new Image();
    image.decoding = 'async';
    image.src = kobexindoLogo.src;
    image.onload = () => {
      kobexindoImage = image;
    };
    return () => {
      if (kobexindoImage === image) kobexindoImage = null;
    };
  }, []);

  return null;
}
