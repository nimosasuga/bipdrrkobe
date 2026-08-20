'use client';

import { jsPDF } from 'jspdf';

export type AssessmentCause = {
  name: string;
  value: number;
  reason?: string;
};

export type AssessmentReportData = {
  diagnosisId: string;
  companyName?: string;
  siteName?: string;
  brand: string;
  model: string;
  category: string;
  batteryType: string;
  voltage: string;
  capacity: string;
  batteryAgeYears: number;
  shift: number;
  operatingHoursPerDay: number;
  wateringPerWeek: number;
  fastDrain: boolean;
  longCharging: boolean;
  frequentDowntime: boolean;
  chargerError: boolean;
  hydraulicSlow: boolean;
  fastDrainDetail?: string;
  chargingDurationDetail?: string;
  wateringFrequencyDetail?: string;
  downtimeFrequencyDetail?: string;
  chargerErrorDetail?: string;
  hydraulicDetail?: string;
  issues: string[];
  healthScore: number;
  healthCategory: string;
  urgency: string;
  confidence: number;
  causes: AssessmentCause[];
  aiSummary?: string | null;
  technicalFindings?: string[];
  recommendedActions?: string[];
  downtimeHoursPerMonth: number;
  chargingExposureHoursPerMonth: number;
  maintenanceActionsPerYear: number;
  productivityLossPercent: number;
  fleetSize: number;
  simulationHoursPerDay: number;
  simulationShift: number;
  downtimeReductionPercent: number;
  energyEfficiencyPercent: number;
  maintenanceReductionPercent: number;
  operationalFit: string;
  downtimeCostPerHour?: number;
  maintenanceCostPerUnitMonth?: number;
  chargingCostPerUnitMonth?: number;
};

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;
const TOTAL_PAGES = 8;
const SAFE_RIGHT = PAGE_W - MARGIN;

const BLACK: [number, number, number] = [10, 10, 10];
const YELLOW: [number, number, number] = [255, 204, 0];
const PAPER: [number, number, number] = [252, 252, 249];
const WHITE: [number, number, number] = [255, 255, 255];
const GREY: [number, number, number] = [82, 82, 91];
const MID_GREY: [number, number, number] = [161, 161, 170];
const LIGHT: [number, number, number] = [228, 228, 231];
const RED: [number, number, number] = [239, 68, 68];
const GREEN: [number, number, number] = [34, 197, 94];

const INTERNAL_LANGUAGE = /(laravel|docker|compose|php artisan|\/home\/|n8n|webhook|postgres|redis|json|api\/v\d|controller|migration|npm\s|git\s|composer|openai|qwen|claude|prompt|database field|database column)/i;

type FontStyle = 'normal' | 'bold';

type FittedText = {
  lines: string[];
  fontSize: number;
};

function rupiah(value: number): string {
  return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
}

function yesNo(value: boolean): string {
  return value ? 'Ya' : 'Tidak';
}

function safe(value: string | null | undefined, fallback = '-'): string {
  const cleaned = value?.trim();
  return cleaned ? cleaned : fallback;
}

function isExplicitlyUnknown(value: string | null | undefined): boolean {
  return value?.trim().toLowerCase() === 'tidak tahu';
}

function detailOrFallback(value: string | undefined, fallback: string): string {
  return safe(value, fallback);
}

function filenamePart(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 45) || 'assessment';
}

function cleanClientText(value: string | null | undefined): string {
  if (!value) return '';
  if (INTERNAL_LANGUAGE.test(value)) return '';

  return value
    .replace(/health[_ ]score/gi, 'skor kondisi battery')
    .replace(/lead[_ ]acid/gi, 'Lead Acid')
    .replace(/battery aging/gi, 'penuaan battery')
    .replace(/charging inefficiency/gi, 'ketidakefisienan pengisian daya')
    .replace(/charging habit/gi, 'kebiasaan pengisian daya')
    .replace(/cell imbalance/gi, 'ketidakseimbangan sel')
    .replace(/sulfation/gi, 'sulfasi')
    .replace(/over-discharge/gi, 'pengosongan daya berlebih')
    .replace(/charging[_ ]lama/gi, 'pengisian daya lebih dari 8 jam')
    .replace(/(?:frekuensi\s+)?isi[_ ]air(?:\s+battery)?/gi, 'isi air battery')
    .replace(/diagnostic[_ ]rules?/gi, 'acuan diagnosis')
    .replace(/battery[_ ]specs?/gi, 'spesifikasi battery')
    .replace(/confidence[_ ]base/gi, 'tingkat keyakinan')
    .replace(/recommended[_ ]actions?/gi, 'tindakan yang disarankan')
    .replace(/technical[_ ]findings?/gi, 'temuan teknis')
    .replace(/probable[_ ]causes?/gi, 'kemungkinan penyebab')
    .replace(/\bdowntime\b/gi, 'waktu henti')
    .replace(/\bavailability\b/gi, 'kesiapan unit')
    .replace(/\bmaintenance\b/gi, 'perawatan')
    .replace(/\bcharging\b/gi, 'pengisian daya')
    .replace(/\bassessment\b/gi, 'pemeriksaan teknis')
    .replace(/\bconfidence\b/gi, 'tingkat keyakinan')
    .replace(/\broot cause\b/gi, 'penyebab utama')
    .replace(/\bfleet\b/gi, 'armada')
    .replace(/\bbusiness case\b/gi, 'dasar keputusan investasi')
    .replace(/\bexposure\b/gi, 'potensi beban biaya')
    .replace(/\bopportunity charging\b/gi, 'pengisian saat jeda operasi')
    .replace(/\bwater(?:ing)?\b/gi, 'isi air battery')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function clientList(items: string[] | undefined, max = 6): string[] {
  return (items || [])
    .map(cleanClientText)
    .filter(Boolean)
    .slice(0, max);
}

function conditionLabel(score: number): string {
  if (score <= 40) return 'Kritis';
  if (score <= 65) return 'Perlu perhatian';
  if (score <= 80) return 'Waspada';
  return 'Baik';
}

function conditionColor(score: number): [number, number, number] {
  if (score <= 40) return RED;
  if (score <= 80) return YELLOW;
  return GREEN;
}

function normalizedPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const normalized = value > 0 && value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, Math.round(normalized)));
}

function breakLongWord(doc: jsPDF, word: string, width: number): string[] {
  const chunks: string[] = [];
  let current = '';

  for (const char of word) {
    const test = current + char;
    if (current && doc.getTextWidth(test) > width) {
      chunks.push(current);
      current = char;
    } else {
      current = test;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

function measuredLines(doc: jsPDF, text: string, width: number): string[] {
  const conservativeWidth = Math.max(10, width * 0.92);
  const paragraphs = String(text || '-').replace(/\r/g, '').split('\n');
  const result: string[] = [];

  for (const rawParagraph of paragraphs) {
    const paragraph = rawParagraph.trim();
    if (!paragraph) {
      result.push('');
      continue;
    }

    const words = paragraph.split(/\s+/);
    let line = '';

    for (const originalWord of words) {
      const pieces = doc.getTextWidth(originalWord) > conservativeWidth
        ? breakLongWord(doc, originalWord, conservativeWidth)
        : [originalWord];

      for (const word of pieces) {
        const test = line ? `${line} ${word}` : word;
        if (!line || doc.getTextWidth(test) <= conservativeWidth) {
          line = test;
        } else {
          result.push(line);
          line = word;
        }
      }
    }

    if (line) result.push(line);
  }

  return result.length ? result : ['-'];
}

function ellipsizeLine(doc: jsPDF, value: string, width: number): string {
  let text = value.trim();
  const suffix = '...';
  while (text.length > 2 && doc.getTextWidth(`${text}${suffix}`) > width * 0.92) {
    text = text.slice(0, -1);
  }
  return `${text.trim()}${suffix}`;
}

function fitTextBlock(
  doc: jsPDF,
  text: string,
  width: number,
  startFontSize: number,
  maxLines: number,
  minFontSize = 6,
  style: FontStyle = 'normal',
): FittedText {
  const clean = String(text || '-').trim() || '-';
  let fontSize = startFontSize;

  while (fontSize >= minFontSize) {
    doc.setFont('helvetica', style);
    doc.setFontSize(fontSize);
    const lines = measuredLines(doc, clean, width);
    if (lines.length <= maxLines) return { lines, fontSize };
    fontSize -= 0.5;
  }

  doc.setFont('helvetica', style);
  doc.setFontSize(minFontSize);
  const allLines = measuredLines(doc, clean, width);
  const lines = allLines.slice(0, maxLines);

  if (allLines.length > maxLines && lines.length) {
    lines[lines.length - 1] = ellipsizeLine(doc, lines[lines.length - 1], width);
  }

  return { lines, fontSize: minFontSize };
}

function drawFittedBlock(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  width: number,
  startFontSize: number,
  maxLines: number,
  minFontSize: number,
  color: [number, number, number],
  lineHeight: number,
  style: FontStyle = 'normal',
  align: 'left' | 'right' | 'center' = 'left',
): number {
  const fitted = fitTextBlock(doc, text, width, startFontSize, maxLines, minFontSize, style);
  doc.setFont('helvetica', style);
  doc.setFontSize(fitted.fontSize);
  doc.setTextColor(...color);
  doc.text(fitted.lines, x, y, { align });
  return y + Math.max(1, fitted.lines.length) * lineHeight;
}

function pageBase(doc: jsPDF, page: number, section: string) {
  doc.setFillColor(...PAPER);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...BLACK);
  doc.text('DRRKOBE', MARGIN, 13);

  doc.setFillColor(...YELLOW);
  doc.roundedRect(MARGIN + 23, 7.5, 10, 7, 1.5, 1.5, 'F');
  doc.setFontSize(6.5);
  doc.text('BIP', MARGIN + 25, 12.1);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(...GREY);
  doc.text('BATTERY RELIABILITY & OPERATIONAL IMPACT ASSESSMENT', SAFE_RIGHT, 11.5, { align: 'right' });

  doc.setDrawColor(...LIGHT);
  doc.line(MARGIN, 17, SAFE_RIGHT, 17);

  doc.setFontSize(6.1);
  doc.setTextColor(...MID_GREY);
  doc.text(section.toUpperCase(), MARGIN, PAGE_H - 10);
  doc.text(`${page} / ${TOTAL_PAGES}`, SAFE_RIGHT, PAGE_H - 10, { align: 'right' });
}

function newPage(doc: jsPDF, page: number, section: string) {
  if (page > 1) doc.addPage();
  pageBase(doc, page, section);
}

function sectionTitle(doc: jsPDF, kicker: string, heading: string, subheading?: string, y = 30): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...GREY);
  doc.text(kicker.toUpperCase(), MARGIN, y);

  const headingFit = fitTextBlock(doc, heading, CONTENT_W - 10, 20, 3, 14, 'bold');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(headingFit.fontSize);
  doc.setTextColor(...BLACK);
  doc.text(headingFit.lines, MARGIN, y + 10);

  const titleLineHeight = headingFit.fontSize >= 18 ? 8.2 : 7.1;
  const headingBottom = y + 10 + (headingFit.lines.length - 1) * titleLineHeight;
  doc.setFillColor(...YELLOW);
  doc.rect(MARGIN, headingBottom + 4, 44, 2.2, 'F');

  if (!subheading) return headingBottom + 14;

  const subFit = fitTextBlock(doc, subheading, CONTENT_W - 8, 8.3, 3, 7.1, 'normal');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(subFit.fontSize);
  doc.setTextColor(...GREY);
  doc.text(subFit.lines, MARGIN, headingBottom + 13);
  return headingBottom + 13 + Math.max(1, subFit.lines.length) * 4.4 + 6;
}

function paragraph(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  width: number,
  fontSize = 9,
  color: [number, number, number] = GREY,
  lineHeight = 4.8,
  maxLines = 12,
): number {
  const fit = fitTextBlock(doc, text, width, fontSize, maxLines, Math.max(6.2, fontSize - 1.5), 'normal');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fit.fontSize);
  doc.setTextColor(...color);
  doc.text(fit.lines, x, y);
  return y + Math.max(1, fit.lines.length) * lineHeight;
}

function labelValue(doc: jsPDF, label: string, value: string, x: number, y: number, width = 76): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(...MID_GREY);
  doc.text(label.toUpperCase(), x, y);
  return drawFittedBlock(doc, value, x, y + 5, width, 9.3, 2, 7.1, BLACK, 4.2, 'bold');
}

function metricCard(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
  note: string,
  dark = false,
) {
  const height = 39;
  const mainColor = dark ? WHITE : BLACK;
  const secondaryColor = dark ? MID_GREY : GREY;

  doc.setFillColor(...(dark ? BLACK : WHITE));
  doc.setDrawColor(...(dark ? BLACK : LIGHT));
  doc.roundedRect(x, y, width, height, 3.5, 3.5, 'FD');

  const labelFit = fitTextBlock(doc, label.toUpperCase(), width - 10, 6.1, 2, 5.0, 'bold');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(labelFit.fontSize);
  doc.setTextColor(...secondaryColor);
  doc.text(labelFit.lines, x + 5, y + 7.5);

  const valueFit = fitTextBlock(doc, value, width - 10, 14.2, 2, 7.4, 'bold');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(valueFit.fontSize);
  doc.setTextColor(...mainColor);
  doc.text(valueFit.lines, x + 5, y + 19);

  const noteFit = fitTextBlock(doc, note, width - 10, 6.0, 2, 5.0, 'normal');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(noteFit.fontSize);
  doc.setTextColor(...secondaryColor);
  doc.text(noteFit.lines, x + 5, y + 31);
}

function quoteCard(doc: jsPDF, text: string, y: number, dark = true): number {
  const fill = dark ? BLACK : WHITE;
  const textColor = dark ? WHITE : BLACK;
  const textX = MARGIN + 18;
  const textWidth = CONTENT_W - 31;
  const fit = fitTextBlock(doc, text, textWidth, 9.2, 7, 7.0, 'bold');
  const lineHeight = fit.fontSize >= 8.5 ? 4.9 : 4.4;
  const height = Math.max(36, 19 + fit.lines.length * lineHeight);

  doc.setFillColor(...fill);
  doc.setDrawColor(...(dark ? BLACK : LIGHT));
  doc.roundedRect(MARGIN, y, CONTENT_W, height, 4, 4, 'FD');

  doc.setFillColor(...YELLOW);
  doc.roundedRect(MARGIN + 7, y + 8, 4, Math.min(14, height - 16), 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fit.fontSize);
  doc.setTextColor(...textColor);
  doc.text(fit.lines, textX, y + 12);
  return y + height;
}

function bulletList(
  doc: jsPDF,
  items: string[],
  x: number,
  y: number,
  width: number,
  maxItems = 7,
  fontSize = 8,
  lineHeight = 4.1,
): number {
  const list = items.map(cleanClientText).filter(Boolean).slice(0, maxItems);
  if (!list.length) return paragraph(doc, 'Belum ada catatan tambahan yang perlu ditampilkan.', x, y, width, 8.1, GREY);

  let cursor = y;
  for (const item of list) {
    const fit = fitTextBlock(doc, item, width - 8, fontSize, 4, 6.4, 'normal');
    doc.setFillColor(...YELLOW);
    doc.circle(x + 1.5, cursor - 1.3, 1.05, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fit.fontSize);
    doc.setTextColor(...BLACK);
    doc.text(fit.lines, x + 6, cursor);
    cursor += Math.max(1, fit.lines.length) * lineHeight + 1.7;
  }
  return cursor;
}

function drawGauge(doc: jsPDF, x: number, y: number, score: number) {
  const color = conditionColor(score);
  doc.setFillColor(242, 242, 242);
  doc.circle(x, y, 26, 'F');
  doc.setFillColor(...color);
  doc.circle(x, y, 23, 'F');
  doc.setFillColor(...WHITE);
  doc.circle(x, y, 18, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(...BLACK);
  doc.text(`${score}%`, x, y + 2, { align: 'center' });
  doc.setFontSize(6.7);
  doc.setTextColor(...color);
  doc.text(conditionLabel(score).toUpperCase(), x, y + 9, { align: 'center' });
}

function drawBar(doc: jsPDF, x: number, y: number, width: number, cause: AssessmentCause): number {
  const percent = normalizedPercent(cause.value);
  const label = cleanClientText(cause.name) || 'Perlu verifikasi';
  const reason = cleanClientText(cause.reason);
  const labelFit = fitTextBlock(doc, label, width - 20, 8.3, 2, 6.8, 'bold');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(labelFit.fontSize);
  doc.setTextColor(...BLACK);
  doc.text(labelFit.lines, x, y);
  doc.setFontSize(8.1);
  doc.text(`${percent}%`, x + width, y, { align: 'right' });

  const labelHeight = Math.max(1, labelFit.lines.length) * 4.1;
  const barY = y + labelHeight + 1.5;
  doc.setFillColor(240, 240, 241);
  doc.roundedRect(x, barY, width, 3.4, 1.7, 1.7, 'F');
  doc.setFillColor(...YELLOW);
  doc.roundedRect(x, barY, Math.max(2, (width * percent) / 100), 3.4, 1.7, 1.7, 'F');

  if (!reason) return barY + 10;

  const reasonFit = fitTextBlock(doc, reason, width, 7.2, 3, 6.2, 'normal');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(reasonFit.fontSize);
  doc.setTextColor(...GREY);
  doc.text(reasonFit.lines, x, barY + 10);
  return barY + 10 + Math.max(1, reasonFit.lines.length) * 4 + 3;
}

function executiveNarrative(data: AssessmentReportData): string {
  const issues = data.issues.slice(0, 3).map(cleanClientText).filter(Boolean).join(', ').toLowerCase();
  const operation = `${data.shift} shift dan sekitar ${data.operatingHoursPerDay} jam operasi per hari`;

  if (data.healthScore <= 40) {
    return `Kondisi battery menunjukkan risiko operasional tinggi. Pada pola ${operation}, gejala ${issues || 'penurunan performa'} sudah cukup kuat untuk memengaruhi kesiapan unit. Prioritas berikutnya adalah memeriksa kapasitas aktual battery, pola pengisian daya, dan kondisi charger sebelum keputusan perubahan teknologi dibuat.`;
  }
  if (data.healthScore <= 65) {
    return `Performa battery masih dapat digunakan, tetapi cadangan kemampuannya terhadap kebutuhan operasi mulai menurun. Dengan pola ${operation}, keluhan ${issues || 'yang dilaporkan'} perlu diverifikasi agar waktu henti tidak berkembang menjadi gangguan yang lebih besar.`;
  }
  if (data.healthScore <= 80) {
    return 'Battery masih dapat dikelola, tetapi terdapat tanda yang perlu dipantau. Fokus utama adalah menjaga pola pengisian daya, perawatan, dan beban operasi agar penurunan performa tidak berlangsung lebih cepat.';
  }
  return 'Kondisi battery relatif baik berdasarkan data yang tersedia. Pertahankan disiplin pengisian daya dan perawatan, lalu pantau perubahan performa dari waktu ke waktu.';
}

function fieldNarrative(data: AssessmentReportData): string {
  const batteryDuration = detailOrFallback(data.fastDrainDetail, data.fastDrain ? '< 4 jam' : 'tidak terindikasi cepat habis');
  const chargingDuration = detailOrFallback(data.chargingDurationDetail, data.longCharging ? '> 8 jam' : 'tidak lebih dari 8 jam');
  const watering = detailOrFallback(data.wateringFrequencyDetail, `${data.wateringPerWeek}x per minggu`);
  const downtime = detailOrFallback(data.downtimeFrequencyDetail, data.frequentDowntime ? '> 2x per bulan' : 'tidak lebih dari 2x per bulan');

  return `Unit beroperasi ${data.shift} shift dengan perkiraan ${data.operatingHoursPerDay} jam per hari dan battery berumur ${data.batteryAgeYears} tahun. Daya battery dilaporkan bertahan ${batteryDuration}, durasi pengisian ${chargingDuration}, pemeriksaan atau isi air ${watering}, dan frekuensi unit berhenti karena battery/pengisian ${downtime}. Data yang belum diketahui tidak dianggap sebagai fakta dan perlu dilengkapi saat pemeriksaan lapangan.`;
}

function decisionStatement(data: AssessmentReportData): string {
  if (data.healthScore <= 40) {
    return 'Lanjutkan ke pemeriksaan teknis lapangan untuk menentukan apakah Lead Acid masih layak dioptimalkan atau Lithium-ion lebih sesuai dengan kebutuhan operasi.';
  }
  if (data.healthScore <= 65) {
    return 'Pemeriksaan teknis lapangan direkomendasikan sebelum keputusan investasi. Prioritas verifikasi: kapasitas aktual, waktu pengisian daya, kondisi charger, dan pola waktu henti.';
  }
  return 'Belum ada alasan untuk mengambil keputusan teknologi secara terburu-buru. Pertahankan pemantauan dan lakukan pemeriksaan teknis bila gejala meningkat atau jam operasi bertambah.';
}

function drawFooterDisclaimer(doc: jsPDF, diagnosisId: string) {
  const top = 268;
  doc.setDrawColor(...LIGHT);
  doc.line(MARGIN, top - 4, SAFE_RIGHT, top - 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.6);
  doc.setTextColor(...GREY);
  doc.text('Nomor penilaian', MARGIN, top);

  drawFittedBlock(doc, diagnosisId, MARGIN, top + 6, 76, 5.8, 2, 4.7, BLACK, 3.2, 'bold');

  drawFittedBlock(
    doc,
    'Dokumen ini bukan sertifikat kepatuhan atau sertifikasi ISO dan tidak menggantikan inspeksi teknis lapangan.',
    SAFE_RIGHT,
    top,
    82,
    5.5,
    3,
    4.6,
    GREY,
    3.2,
    'normal',
    'right',
  );
}

export function downloadAssessmentPdf(data: AssessmentReportData) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });

  const downtimeKnown = !isExplicitlyUnknown(data.downtimeFrequencyDetail);
  const chargingKnown = !isExplicitlyUnknown(data.chargingDurationDetail);
  const wateringKnown = !isExplicitlyUnknown(data.wateringFrequencyDetail);

  // Nilai finansial yang benar-benar diisi customer tidak boleh bergantung pada
  // apakah detail operasional lain diketahui. Charging dan maintenance sudah berupa
  // nominal per unit per bulan, sehingga sumber kebenarannya adalah input customer.
  const downtimeCostPerHour = Math.max(0, Number(data.downtimeCostPerHour) || 0);
  const maintenanceCostPerUnitMonth = Math.max(0, Number(data.maintenanceCostPerUnitMonth) || 0);
  const chargingCostPerUnitMonth = Math.max(0, Number(data.chargingCostPerUnitMonth) || 0);
  const fleetSize = Math.max(1, Number(data.fleetSize) || 1);

  const downtimeCostProvided = downtimeCostPerHour > 0;
  const maintenanceCostProvided = maintenanceCostPerUnitMonth > 0;
  const chargingCostProvided = chargingCostPerUnitMonth > 0;

  const monthlyDowntimeCost = downtimeKnown && downtimeCostProvided
    ? downtimeCostPerHour * data.downtimeHoursPerMonth * fleetSize
    : 0;
  const monthlyMaintenanceCost = maintenanceCostProvided
    ? maintenanceCostPerUnitMonth * fleetSize
    : 0;
  const monthlyChargingCost = chargingCostProvided
    ? chargingCostPerUnitMonth * fleetSize
    : 0;
  const annualOperatingCost = (monthlyDowntimeCost + monthlyMaintenanceCost + monthlyChargingCost) * 12;
  const annualSavingScenario = (
    monthlyDowntimeCost * (data.downtimeReductionPercent / 100) +
    monthlyMaintenanceCost * (data.maintenanceReductionPercent / 100) +
    monthlyChargingCost * (data.energyEfficiencyPercent / 100)
  ) * 12;
  const monetaryInputsAvailable = annualOperatingCost > 0;
  const reportDate = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  const safeFindings = clientList(data.technicalFindings, 4);
  const safeActions = clientList(data.recommendedActions, 2);
  const safeCauses = data.causes
    .map((cause) => ({ ...cause, name: cleanClientText(cause.name), reason: cleanClientText(cause.reason) }))
    .filter((cause) => cause.name && !INTERNAL_LANGUAGE.test(cause.name))
    .slice(0, 4);

  // 1. RINGKASAN EKSEKUTIF
  newPage(doc, 1, 'Ringkasan Eksekutif');
  doc.setFillColor(...BLACK);
  doc.roundedRect(MARGIN, 28, CONTENT_W, 78, 5, 5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...MID_GREY);
  doc.text('LAPORAN PENILAIAN EKSEKUTIF', MARGIN + 9, 41);

  doc.setFontSize(24);
  doc.setTextColor(...WHITE);
  doc.text('Kondisi Battery &', MARGIN + 9, 55);
  doc.text('Dampak Terhadap Operasi', MARGIN + 9, 66);
  doc.setFillColor(...YELLOW);
  doc.rect(MARGIN + 9, 72, 55, 3, 'F');

  doc.setFontSize(8);
  doc.setTextColor(...MID_GREY);
  doc.text('Disiapkan untuk', MARGIN + 9, 84);

  drawFittedBlock(doc, safe(data.companyName, 'Nama perusahaan belum diisi'), MARGIN + 9, 92, 91, 13, 2, 8.5, WHITE, 5, 'bold');
  drawFittedBlock(doc, `${safe(data.siteName, 'Lokasi belum diisi')} - ${reportDate}`, SAFE_RIGHT - 9, 92, 66, 7.2, 2, 5.6, MID_GREY, 4, 'normal', 'right');

  drawGauge(doc, 46, 138, data.healthScore);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...MID_GREY);
  doc.text('KESIMPULAN UNTUK MANAJEMEN', 83, 119);

  const headline = data.healthScore <= 40
    ? 'Battery perlu mendapat perhatian segera.'
    : data.healthScore <= 65
      ? 'Performa battery mulai membatasi operasi.'
      : data.healthScore <= 80
        ? 'Kondisi perlu dipantau lebih dekat.'
        : 'Kondisi masih mendukung operasi saat ini.';

  drawFittedBlock(doc, headline, 83, 131, 104, 15, 2, 10.5, BLACK, 6.4, 'bold');
  let y = paragraph(doc, executiveNarrative(data), 83, 147, 104, 8.6, GREY, 4.6, 7);

  const cardsY = Math.max(181, y + 7);
  metricCard(doc, MARGIN, cardsY, 40, 'Prioritas', cleanClientText(data.urgency) || '-', 'Tingkat tindak lanjut');
  metricCard(doc, MARGIN + 45, cardsY, 40, 'Keyakinan', `${normalizedPercent(data.confidence)}%`, 'Kekuatan data yang tersedia');
  metricCard(doc, MARGIN + 90, cardsY, 40, 'Keluhan', `${data.issues.length}`, 'Gejala yang dilaporkan');
  metricCard(doc, MARGIN + 135, cardsY, 39, 'Armada', `${data.fleetSize} unit`, 'Cakupan perhitungan');

  y = quoteCard(doc, decisionStatement(data), cardsY + 49, true);

  if (y <= 253) {
    drawFittedBlock(doc, 'Disusun dengan prinsip keterlacakan: data, temuan, dampak, risiko, rekomendasi, dan verifikasi.', MARGIN, y + 6, CONTENT_W, 6.1, 2, 5.2, GREY, 3.6, 'normal');
  }

  // 2. DATA & KONDISI LAPANGAN
  newPage(doc, 2, 'Data & Kondisi Lapangan');
  y = sectionTitle(doc, '01 / Fakta yang digunakan', 'Apa yang terjadi di lapangan?', 'Rangkuman ini menunjukkan kondisi unit, pola kerja, dan keluhan yang dilaporkan oleh pengguna sebagai dasar penilaian.');

  doc.setFillColor(...WHITE);
  doc.setDrawColor(...LIGHT);
  doc.roundedRect(MARGIN, y, CONTENT_W, 63, 4, 4, 'FD');
  labelValue(doc, 'Brand & Model', `${data.brand} ${data.model}`, MARGIN + 6, y + 12, 76);
  labelValue(doc, 'Jenis Unit', data.category, 110, y + 12, 76);
  labelValue(doc, 'Battery Saat Ini', `${data.batteryType} - ${data.voltage} - ${data.capacity}`, MARGIN + 6, y + 33, 76);
  labelValue(doc, 'Pola Kerja', `${data.shift} shift - ${data.operatingHoursPerDay} jam/hari`, 110, y + 33, 76);
  labelValue(doc, 'Umur Battery', `${data.batteryAgeYears} tahun`, MARGIN + 6, y + 52, 76);
  labelValue(doc, 'Isi Air Battery', detailOrFallback(data.wateringFrequencyDetail, `${data.wateringPerWeek}x per minggu`), 110, y + 52, 76);

  y += 77;
  y = quoteCard(doc, fieldNarrative(data), y, false) + 11;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text('Keluhan utama', MARGIN, y);
  bulletList(doc, data.issues, MARGIN, y + 10, 80, 8, 7.7, 4.0);

  doc.text('Kondisi yang dilaporkan', 110, y);
  bulletList(
    doc,
    [
      `Daya battery bertahan: ${detailOrFallback(data.fastDrainDetail, yesNo(!data.fastDrain))}`,
      `Durasi pengisian: ${detailOrFallback(data.chargingDurationDetail, data.longCharging ? '> 8 jam' : '≤ 8 jam')}`,
      `Unit berhenti karena battery/pengisian: ${detailOrFallback(data.downtimeFrequencyDetail, data.frequentDowntime ? '> 2x per bulan' : '≤ 2x per bulan')}`,
      `Gangguan pada charger: ${detailOrFallback(data.chargerErrorDetail, yesNo(data.chargerError))}`,
      `Gerakan angkat saat daya rendah: ${detailOrFallback(data.hydraulicDetail, yesNo(data.hydraulicSlow))}`,
    ],
    110,
    y + 10,
    80,
    7,
    7.7,
    4.0,
  );

  // 3. KONDISI BATTERY & PENYEBAB
  newPage(doc, 3, 'Kondisi Battery');
  y = sectionTitle(doc, '02 / Temuan utama', 'Apa yang paling mungkin memengaruhi performa?', 'Persentase menunjukkan tingkat keyakinan terhadap kemungkinan penyebab berdasarkan data yang tersedia. Nilai ini perlu dibuktikan melalui pemeriksaan aktual.');

  drawGauge(doc, 48, y + 31, data.healthScore);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...MID_GREY);
  doc.text('KONDISI SAAT INI', 85, y + 8);

  drawFittedBlock(doc, `${conditionLabel(data.healthScore)} - Skor Kondisi ${data.healthScore}%`, 85, y + 20, 102, 15.5, 2, 10.5, BLACK, 6.4, 'bold');
  paragraph(doc, executiveNarrative(data), 85, y + 34, 102, 8.1, GREY, 4.4, 7);

  y += 72;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text('Penyebab yang perlu diverifikasi', MARGIN, y);

  let causeY = y + 12;
  if (safeCauses.length) {
    for (const cause of safeCauses) {
      if (causeY > 220) break;
      causeY = drawBar(doc, MARGIN, causeY, CONTENT_W, cause);
    }
  } else {
    causeY = paragraph(doc, 'Belum ada penyebab yang cukup kuat untuk ditampilkan dari data sesi ini.', MARGIN, causeY, CONTENT_W, 8.3, GREY);
  }

  if (safeFindings.length && causeY < 220) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.3);
    doc.setTextColor(...BLACK);
    doc.text('Hal yang perlu diperiksa lebih lanjut', MARGIN, causeY + 8);
    bulletList(doc, safeFindings, MARGIN, causeY + 18, CONTENT_W, 3, 7.2, 3.8);
  }

  // 4. DAMPAK TERHADAP OPERASI
  newPage(doc, 4, 'Dampak Terhadap Operasi');
  y = sectionTitle(doc, '03 / Dampak kerja sehari-hari', 'Di mana gangguan battery mulai terasa?', 'Nilai di bawah membantu melihat waktu yang hilang, beban perawatan, dan pengaruhnya terhadap kesiapan forklift untuk bekerja.');

  metricCard(doc, MARGIN, y, 40, 'Waktu henti', downtimeKnown ? `${data.downtimeHoursPerMonth} jam/bln` : 'Belum diketahui', downtimeKnown ? 'Perkiraan unit tidak produktif' : 'Perlu data frekuensi waktu henti');
  metricCard(doc, MARGIN + 45, y, 40, 'Pengisian daya', chargingKnown ? `${data.chargingExposureHoursPerMonth} jam/bln` : 'Belum diketahui', chargingKnown ? 'Waktu terserap untuk pengisian' : 'Perlu data durasi pengisian');
  metricCard(doc, MARGIN + 90, y, 40, 'Perawatan', wateringKnown ? `${data.maintenanceActionsPerYear}x/thn` : 'Belum diketahui', wateringKnown ? 'Isi air dan pemeriksaan rutin' : 'Perlu data isi air battery');
  metricCard(doc, MARGIN + 135, y, 39, 'Produktivitas', downtimeKnown ? `-${data.productivityLossPercent}%` : 'Belum diketahui', downtimeKnown ? 'Terhadap jam operasi tersedia' : 'Menunggu data waktu henti');

  y += 53;
  y = quoteCard(doc, `Pada armada ${data.fleetSize} unit dengan pola sekitar ${data.simulationHoursPerDay} jam operasi dan ${data.simulationShift} shift, waktu henti, pengisian daya, dan perawatan saling memengaruhi kesiapan unit. Karena itu, keputusan battery perlu dilihat sebagai bagian dari keputusan operasi, bukan sekadar penggantian komponen.`, y, true) + 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text('Apa artinya bagi operasi sehari-hari?', MARGIN, y);
  bulletList(
    doc,
    [
      `Frekuensi unit berhenti karena battery/pengisian: ${detailOrFallback(data.downtimeFrequencyDetail, data.frequentDowntime ? '> 2x per bulan' : '≤ 2x per bulan')}.`,
      `Durasi pengisian yang dilaporkan: ${detailOrFallback(data.chargingDurationDetail, data.longCharging ? '> 8 jam' : '≤ 8 jam')}.`,
      `Pemeriksaan atau isi air battery: ${detailOrFallback(data.wateringFrequencyDetail, `${data.wateringPerWeek}x per minggu`)}.`,
      data.simulationShift >= 2 ? 'Operasi multi-shift membutuhkan battery dan waktu pengisian yang lebih konsisten.' : 'Operasi satu shift memberi waktu pengisian yang lebih longgar dibanding operasi multi-shift.',
    ],
    MARGIN,
    y + 10,
    CONTENT_W,
    6,
    7.8,
    4.0,
  );

  // 5. DAMPAK BIAYA
  newPage(doc, 5, 'Dampak Biaya');
  y = sectionTitle(doc, '04 / Nilai gangguan bagi perusahaan', 'Berapa besar potensi beban biayanya?', 'Nominal hanya dihitung dari data biaya yang diberikan perusahaan. Bila biaya internal atau data operasi belum diketahui, laporan tidak membuat asumsi Rupiah.');

  if (monetaryInputsAvailable) {
    metricCard(
      doc,
      MARGIN,
      y,
      54,
      'Waktu henti / bulan',
      downtimeKnown && downtimeCostProvided ? rupiah(monthlyDowntimeCost) : 'Belum diketahui',
      downtimeKnown && downtimeCostProvided ? `${fleetSize} unit x ${data.downtimeHoursPerMonth} jam` : 'Menunggu data waktu henti dan biaya/jam',
    );
    metricCard(
      doc,
      MARGIN + 60,
      y,
      54,
      'Perawatan / bulan',
      maintenanceCostProvided ? rupiah(monthlyMaintenanceCost) : 'Belum diketahui',
      maintenanceCostProvided ? 'Berdasarkan data perusahaan' : 'Menunggu biaya perawatan',
    );
    metricCard(
      doc,
      MARGIN + 120,
      y,
      54,
      'Pengisian / bulan',
      chargingCostProvided ? rupiah(monthlyChargingCost) : 'Belum diketahui',
      chargingCostProvided ? 'Berdasarkan data perusahaan' : 'Menunggu biaya pengisian',
    );

    y += 53;
    doc.setFillColor(...BLACK);
    doc.roundedRect(MARGIN, y, CONTENT_W, 65, 5, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...MID_GREY);
    doc.text('PERKIRAAN BEBAN OPERASIONAL SETAHUN', MARGIN + 8, y + 13);

    drawFittedBlock(doc, rupiah(annualOperatingCost), MARGIN + 8, y + 30, CONTENT_W - 16, 22, 2, 12.5, WHITE, 8, 'bold');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MID_GREY);
    doc.text('berdasarkan data biaya dan data operasi yang tersedia', MARGIN + 8, y + 41);

    doc.setFillColor(...YELLOW);
    doc.roundedRect(MARGIN + 8, y + 48, CONTENT_W - 16, 11, 2, 2, 'F');
    drawFittedBlock(doc, `Skenario potensi pengurangan beban: ${rupiah(annualSavingScenario)} / tahun`, MARGIN + 13, y + 55, CONTENT_W - 28, 7.8, 2, 6.0, BLACK, 4, 'bold');

    y += 80;
    quoteCard(doc, 'Angka ini bukan harga battery dan bukan penawaran komersial. Nilainya hanya menggunakan data yang tersedia dan tidak mengisi bagian yang belum diketahui dengan asumsi tersembunyi.', y, false);
  } else {
    doc.setFillColor(...BLACK);
    doc.roundedRect(MARGIN, y, CONTENT_W, 74, 5, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...MID_GREY);
    doc.text('STATUS DATA BIAYA', MARGIN + 8, y + 13);

    drawFittedBlock(doc, 'Menunggu data biaya perusahaan', MARGIN + 8, y + 29, CONTENT_W - 16, 19, 2, 12, WHITE, 7.3, 'bold');
    paragraph(doc, 'Tidak mengetahui biaya internal bukan masalah. Dampak operasi tetap dapat dibaca dari data yang tersedia. Nilai Rupiah baru dihitung setelah data biaya dan data operasi yang diperlukan tersedia.', MARGIN + 8, y + 44, CONTENT_W - 16, 8.1, MID_GREY, 4.4, 5);

    y += 90;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BLACK);
    doc.text('Data yang diperlukan untuk menghitung nilai finansial', MARGIN, y);
    bulletList(doc, ['Perkiraan kerugian atau biaya saat satu forklift berhenti selama satu jam.', 'Biaya perawatan Lead Acid per unit per bulan, bila tersedia.', 'Biaya listrik untuk pengisian battery per unit per bulan, bila tersedia.', 'Frekuensi waktu henti, durasi pengisian, dan pola perawatan yang benar-benar terjadi.'], MARGIN, y + 11, CONTENT_W, 5, 7.8, 4.0);
  }

  // 6. PERBANDINGAN TEKNOLOGI
  newPage(doc, 6, 'Perbandingan Teknologi');
  y = sectionTitle(doc, '05 / Lead Acid dan Lithium-ion', 'Apa yang berubah bila teknologinya berbeda?', 'Perbandingan ini digunakan untuk memahami konsekuensi terhadap cara kerja. Harga battery tidak ditampilkan pada tahap penilaian.');

  const rows = [
    ['Waktu pengisian', '8-12 jam, kemudian masa pendinginan', 'Sekitar 1,5-2,5 jam; dapat diisi saat jeda operasi'],
    ['Umur siklus', 'Sekitar 1.200 siklus', 'Sekitar 3.000+ siklus'],
    ['Perawatan rutin', 'Isi air, equalizing, dan pembersihan', 'Tidak memerlukan isi air atau equalizing rutin'],
    ['Efisiensi energi', 'Sekitar 75-80%', 'Dapat mencapai sekitar 95%+'],
    ['Operasi multi-shift', 'Membutuhkan waktu pengisian dan rotasi battery', 'Lebih fleksibel untuk pengisian saat jeda'],
    ['Aspek keselamatan', 'Perlu penanganan asam dan ventilasi gas', 'Tanpa isi air; tetap perlu pengawasan Battery Management System (BMS)'],
  ];

  const x1 = MARGIN;
  const x2 = 72;
  const x3 = 131;
  doc.setFillColor(...BLACK);
  doc.roundedRect(MARGIN, y, CONTENT_W, 16, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.1);
  doc.setTextColor(...WHITE);
  doc.text('PARAMETER', x1 + 5, y + 10);
  doc.text('LEAD ACID SAAT INI', x2 + 4, y + 10);
  doc.setFillColor(...YELLOW);
  doc.roundedRect(x3, y, SAFE_RIGHT - x3, 16, 0, 3, 'F');
  drawFittedBlock(doc, 'LITHIUM-ION UNTUK DIEVALUASI', x3 + 4, y + 9.5, 53, 7.0, 2, 5.6, BLACK, 3.4, 'bold');

  let tableY = y + 16;
  for (const [parameter, lead, lithium] of rows) {
    const parameterFit = fitTextBlock(doc, parameter, 46, 7.3, 4, 6.1, 'bold');
    const leadFit = fitTextBlock(doc, lead, 49, 6.9, 4, 5.9, 'normal');
    const lithiumFit = fitTextBlock(doc, lithium, 52, 6.9, 4, 5.9, 'bold');
    const maxLines = Math.max(parameterFit.lines.length, leadFit.lines.length, lithiumFit.lines.length);
    const rowHeight = Math.max(21, 10 + maxLines * 4.0);

    doc.setFillColor(...WHITE);
    doc.setDrawColor(...LIGHT);
    doc.rect(MARGIN, tableY, CONTENT_W, rowHeight, 'FD');
    doc.setFillColor(255, 254, 240);
    doc.rect(x3, tableY, SAFE_RIGHT - x3, rowHeight, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(parameterFit.fontSize);
    doc.setTextColor(...BLACK);
    doc.text(parameterFit.lines, x1 + 5, tableY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(leadFit.fontSize);
    doc.setTextColor(...GREY);
    doc.text(leadFit.lines, x2 + 4, tableY + 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(lithiumFit.fontSize);
    doc.setTextColor(...BLACK);
    doc.text(lithiumFit.lines, x3 + 4, tableY + 8);
    tableY += rowHeight;
  }

  if (tableY < 229) {
    quoteCard(doc, 'Lithium-ion tidak otomatis menjadi pilihan terbaik untuk setiap perusahaan. Kelayakannya bergantung pada pola kerja unit, charger, konektor, ruang battery, temperatur, jumlah shift, dan target kesiapan unit.', tableY + 9, true);
  }

  // 7. DASAR KEPUTUSAN INVESTASI
  newPage(doc, 7, 'Dasar Keputusan Investasi');
  y = sectionTitle(doc, '06 / Potensi perbaikan', 'Apa yang mungkin diperoleh bila pola operasi diperbaiki?', 'Persentase di bawah adalah skenario awal untuk membantu pembahasan. Nilai aktual harus dibuktikan dengan data operasi dan pemeriksaan lapangan.');

  metricCard(doc, MARGIN, y, 40, 'Waktu henti', `-${data.downtimeReductionPercent}%`, 'Potensi pengurangan');
  metricCard(doc, MARGIN + 45, y, 40, 'Efisiensi energi', `+${data.energyEfficiencyPercent}%`, 'Potensi peningkatan');
  metricCard(doc, MARGIN + 90, y, 40, 'Perawatan', `-${data.maintenanceReductionPercent}%`, 'Potensi pengurangan pekerjaan rutin');
  metricCard(doc, MARGIN + 135, y, 39, 'Kesesuaian', cleanClientText(data.operationalFit) || '-', 'Terhadap shift & jam operasi');

  y += 53;
  y = quoteCard(doc, `Pada armada ${data.fleetSize} unit, operasi ${data.simulationShift} shift dan sekitar ${data.simulationHoursPerDay} jam per hari, manfaat utama dari teknologi battery yang lebih sesuai adalah menjaga forklift tersedia ketika dibutuhkan. Dasar keputusan investasi sebaiknya menghubungkan teknologi dengan kesiapan unit, waktu pengisian, perawatan, dan produktivitas.`, y, true) + 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.6);
  doc.setTextColor(...BLACK);
  doc.text('Pertanyaan yang perlu dijawab sebelum keputusan investasi', MARGIN, y);
  bulletList(doc, [
    'Berapa jam forklift benar-benar dibutuhkan setiap hari dan pada setiap shift?',
    'Apakah waktu pengisian saat ini mengurangi kesiapan unit?',
    'Berapa kali unit berhenti karena battery atau charger dalam satu bulan?',
    'Apakah tersedia waktu istirahat yang dapat digunakan untuk pengisian daya?',
    'Apakah charger, konektor, dan ruang battery mendukung perubahan teknologi?',
    monetaryInputsAvailable ? `Apakah potensi pengurangan beban sekitar ${rupiah(annualSavingScenario)} per tahun cukup signifikan untuk dilanjutkan ke evaluasi investasi?` : 'Berapa biaya waktu henti per jam agar nilai finansial dapat dihitung menggunakan data perusahaan sendiri?',
  ], MARGIN, y + 11, CONTENT_W, 6, 7.6, 3.9);

  // 8. REKOMENDASI & VERIFIKASI
  newPage(doc, 8, 'Rekomendasi & Verifikasi');
  y = sectionTitle(doc, '07 / Langkah berikutnya', 'Apa yang sebaiknya dilakukan setelah laporan ini?', 'Keputusan battery sebaiknya didasarkan pada kondisi unit, kebutuhan kerja, keselamatan, dan data yang dapat diverifikasi.');

  doc.setFillColor(...BLACK);
  doc.roundedRect(MARGIN, y, CONTENT_W, 71, 5, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...MID_GREY);
  doc.text('REKOMENDASI DRRKOBE', MARGIN + 8, y + 13);

  const recommendationHeadline = data.healthScore <= 65 ? 'Lanjutkan ke Pemeriksaan Teknis Lapangan' : 'Pertahankan Pemantauan & Verifikasi Berkala';
  drawFittedBlock(doc, recommendationHeadline, MARGIN + 8, y + 29, CONTENT_W - 18, 19, 2, 11.5, WHITE, 7.2, 'bold');
  drawFittedBlock(doc, decisionStatement(data), MARGIN + 8, y + 45, CONTENT_W - 18, 8.5, 4, 6.9, MID_GREY, 4.4, 'normal');

  y += 87;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.8);
  doc.setTextColor(...BLACK);
  doc.text('Yang perlu diperiksa di lokasi', MARGIN, y);
  y = bulletList(doc, [
    'Ukur kapasitas aktual battery dan bandingkan dengan kebutuhan kerja unit.',
    'Periksa kondisi sel, terminal, konektor, kabel, dan temperatur kerja.',
    'Validasi charger: tegangan, arus, pola pengisian, riwayat gangguan, dan waktu pengisian yang tersedia.',
    'Konfirmasi dimensi ruang battery, berat minimum, konektor, dan kebutuhan counterweight.',
    'Catat pola shift, jam operasi, waktu istirahat, dan waktu henti aktual selama beberapa hari operasi.',
    'Jika Lithium-ion akan dievaluasi, pastikan kompatibilitas charger, Battery Management System (BMS), konektor, dan prosedur keselamatan.',
  ], MARGIN, y + 11, CONTENT_W, 6, 7.2, 3.7);

  if (safeActions.length && y < 207) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...BLACK);
    doc.text('Catatan tindak lanjut', MARGIN, y + 7);
    y = bulletList(doc, safeActions, MARGIN, y + 16, CONTENT_W, 2, 6.9, 3.6);
  }

  const closingY = 226;
  doc.setFillColor(...YELLOW);
  doc.roundedRect(MARGIN, closingY, CONTENT_W, 32, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text('Langkah berikutnya', MARGIN + 7, closingY + 10);
  drawFittedBlock(doc, 'Jadwalkan pemeriksaan teknis bersama DRRKOBE untuk memvalidasi kondisi aktual dan menentukan pilihan yang paling sesuai dengan kebutuhan operasi perusahaan.', MARGIN + 7, closingY + 19, CONTENT_W - 16, 7.8, 3, 6.3, BLACK, 4.0, 'normal');

  drawFooterDisclaimer(doc, data.diagnosisId);

  const fileName = `DRRKOBE_Assessment_${filenamePart(safe(data.companyName, 'Client'))}_${filenamePart(data.model)}_${filenamePart(data.diagnosisId)}.pdf`;
  doc.save(fileName);
}
