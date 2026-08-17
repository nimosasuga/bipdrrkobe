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
    .replace(/isi[_ ]air/gi, 'frekuensi isi air battery')
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
  doc.text('BATTERY RELIABILITY & OPERATIONAL IMPACT ASSESSMENT', PAGE_W - MARGIN, 11.5, { align: 'right' });

  doc.setDrawColor(...LIGHT);
  doc.line(MARGIN, 17, PAGE_W - MARGIN, 17);

  doc.setFontSize(6.2);
  doc.setTextColor(...MID_GREY);
  doc.text(section.toUpperCase(), MARGIN, PAGE_H - 10);
  doc.text(`${page} / ${TOTAL_PAGES}`, PAGE_W - MARGIN, PAGE_H - 10, { align: 'right' });
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

  doc.setFontSize(21);
  doc.setTextColor(...BLACK);
  doc.text(heading, MARGIN, y + 10);

  doc.setFillColor(...YELLOW);
  doc.rect(MARGIN, y + 14, 44, 2.2, 'F');

  if (!subheading) return y + 24;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...GREY);
  const lines = doc.splitTextToSize(subheading, CONTENT_W) as string[];
  doc.text(lines, MARGIN, y + 23);
  return y + 23 + Math.max(1, lines.length) * 4.5 + 5;
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
): number {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fontSize);
  doc.setTextColor(...color);
  const lines = doc.splitTextToSize(text, width) as string[];
  doc.text(lines, x, y);
  return y + Math.max(1, lines.length) * lineHeight;
}

function labelValue(doc: jsPDF, label: string, value: string, x: number, y: number, width = 76): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.3);
  doc.setTextColor(...MID_GREY);
  doc.text(label.toUpperCase(), x, y);

  doc.setFontSize(9.5);
  doc.setTextColor(...BLACK);
  const lines = doc.splitTextToSize(value, width) as string[];
  doc.text(lines, x, y + 5);
  return y + 5 + Math.max(1, lines.length) * 4.5;
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
  doc.setFillColor(...(dark ? BLACK : WHITE));
  doc.setDrawColor(...(dark ? BLACK : LIGHT));
  doc.roundedRect(x, y, width, 34, 3.5, 3.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(...(dark ? MID_GREY : GREY));
  doc.text(label.toUpperCase(), x + 5, y + 8);

  doc.setFontSize(14.5);
  doc.setTextColor(...(dark ? WHITE : BLACK));
  doc.text(value, x + 5, y + 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.3);
  doc.setTextColor(...(dark ? MID_GREY : GREY));
  const lines = doc.splitTextToSize(note, width - 10) as string[];
  doc.text(lines.slice(0, 2), x + 5, y + 26);
}

function quoteCard(doc: jsPDF, text: string, y: number, dark = true): number {
  const fill = dark ? BLACK : WHITE;
  const textColor = dark ? WHITE : BLACK;
  const lines = doc.splitTextToSize(text, CONTENT_W - 22) as string[];
  const height = Math.max(34, 18 + lines.length * 5.2);

  doc.setFillColor(...fill);
  doc.setDrawColor(...(dark ? BLACK : LIGHT));
  doc.roundedRect(MARGIN, y, CONTENT_W, height, 4, 4, 'FD');

  doc.setFillColor(...YELLOW);
  doc.roundedRect(MARGIN + 7, y + 8, 4, 14, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  doc.text(lines, MARGIN + 17, y + 12);
  return y + height;
}

function bulletList(doc: jsPDF, items: string[], x: number, y: number, width: number, maxItems = 7): number {
  const list = items.map(cleanClientText).filter(Boolean).slice(0, maxItems);
  if (!list.length) return paragraph(doc, 'Belum ada catatan tambahan yang perlu ditampilkan.', x, y, width, 8.5, GREY);

  let cursor = y;
  for (const item of list) {
    doc.setFillColor(...YELLOW);
    doc.circle(x + 1.5, cursor - 1.4, 1.2, 'F');
    cursor = paragraph(doc, item, x + 6, cursor, width - 6, 8.4, BLACK, 4.4) + 1.7;
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

function drawBar(doc: jsPDF, x: number, y: number, width: number, label: string, value: number, note?: string): number {
  const clamped = Math.max(0, Math.min(100, value));
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.4);
  doc.setTextColor(...BLACK);
  doc.text(cleanClientText(label), x, y);
  doc.text(`${clamped}%`, x + width, y, { align: 'right' });

  doc.setFillColor(240, 240, 241);
  doc.roundedRect(x, y + 3, width, 3.4, 1.7, 1.7, 'F');
  doc.setFillColor(...YELLOW);
  doc.roundedRect(x, y + 3, Math.max(2, (width * clamped) / 100), 3.4, 1.7, 1.7, 'F');

  if (!note) return y + 13;
  return paragraph(doc, cleanClientText(note), x, y + 11, width, 7.3, GREY, 4.1) + 2;
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
  const clues: string[] = [];
  if (data.fastDrain) clues.push('daya tidak bertahan satu shift');
  if (data.longCharging) clues.push('pengisian daya membutuhkan lebih dari 8 jam');
  if (data.frequentDowntime) clues.push('waktu henti terjadi lebih dari dua kali per bulan');
  if (data.chargerError) clues.push('charger pernah menampilkan kode gangguan');
  if (data.hydraulicSlow) clues.push('gerakan hydraulic melambat ketika battery rendah');

  const finding = clues.length ? clues.join(', ') : 'tidak ada gejala tambahan yang dilaporkan';
  return `Unit beroperasi ${data.shift} shift dengan perkiraan ${data.operatingHoursPerDay} jam per hari. Battery berumur ${data.batteryAgeYears} tahun dan membutuhkan isi air sekitar ${data.wateringPerWeek} kali per minggu. Kondisi yang paling terasa di lapangan adalah ${finding}. Rangkuman ini menjadi dasar pemeriksaan awal dan perlu dikonfirmasi saat pengecekan langsung.`;
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

export function downloadAssessmentPdf(data: AssessmentReportData) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });

  const monthlyDowntimeCost = (data.downtimeCostPerHour || 0) * data.downtimeHoursPerMonth * data.fleetSize;
  const monthlyMaintenanceCost = (data.maintenanceCostPerUnitMonth || 0) * data.fleetSize;
  const monthlyChargingCost = (data.chargingCostPerUnitMonth || 0) * data.fleetSize;
  const annualOperatingCost = (monthlyDowntimeCost + monthlyMaintenanceCost + monthlyChargingCost) * 12;
  const annualSavingScenario = (
    monthlyDowntimeCost * (data.downtimeReductionPercent / 100) +
    monthlyMaintenanceCost * (data.maintenanceReductionPercent / 100) +
    monthlyChargingCost * (data.energyEfficiencyPercent / 100)
  ) * 12;
  const monetaryInputsAvailable = annualOperatingCost > 0;
  const reportDate = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  const safeFindings = clientList(data.technicalFindings, 5);
  const safeActions = clientList(data.recommendedActions, 4);
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
  doc.text('Disiapkan untuk', MARGIN + 9, 85);
  doc.setFontSize(13);
  doc.setTextColor(...WHITE);
  doc.text(safe(data.companyName, 'Nama perusahaan belum diisi'), MARGIN + 9, 94);
  doc.setFontSize(7.4);
  doc.setTextColor(...MID_GREY);
  doc.text(`${safe(data.siteName, 'Lokasi belum diisi')} • ${reportDate}`, PAGE_W - MARGIN - 9, 94, { align: 'right' });

  drawGauge(doc, 46, 138, data.healthScore);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...MID_GREY);
  doc.text('KESIMPULAN UNTUK MANAJEMEN', 83, 119);
  doc.setFontSize(15);
  doc.setTextColor(...BLACK);
  const headline = data.healthScore <= 40
    ? 'Battery perlu mendapat perhatian segera.'
    : data.healthScore <= 65
      ? 'Performa battery mulai membatasi operasi.'
      : data.healthScore <= 80
        ? 'Kondisi perlu dipantau lebih dekat.'
        : 'Kondisi masih mendukung operasi saat ini.';
  doc.text(doc.splitTextToSize(headline, 105) as string[], 83, 131);

  let y = paragraph(doc, executiveNarrative(data), 83, 145, 105, 9.2, GREY, 5.0);
  const cardsY = Math.max(184, y + 8);
  metricCard(doc, MARGIN, cardsY, 40, 'Prioritas', cleanClientText(data.urgency) || '-', 'Tingkat tindak lanjut');
  metricCard(doc, MARGIN + 45, cardsY, 40, 'Keyakinan', `${data.confidence}%`, 'Kekuatan data yang tersedia');
  metricCard(doc, MARGIN + 90, cardsY, 40, 'Keluhan', `${data.issues.length}`, 'Gejala yang dilaporkan');
  metricCard(doc, MARGIN + 135, cardsY, 39, 'Armada', `${data.fleetSize} unit`, 'Cakupan perhitungan');

  y = quoteCard(doc, decisionStatement(data), cardsY + 46, true) + 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.7);
  doc.setTextColor(...GREY);
  doc.text('Disusun dengan prinsip keterlacakan: data, temuan, dampak, risiko, rekomendasi, dan verifikasi.', MARGIN, Math.min(263, y));
  doc.text('Keputusan teknis akhir tetap memerlukan pemeriksaan kondisi aktual di lapangan.', MARGIN, Math.min(269, y + 6));

  // 2. DATA & KONDISI LAPANGAN
  newPage(doc, 2, 'Data & Kondisi Lapangan');
  y = sectionTitle(
    doc,
    '01 / Fakta yang digunakan',
    'Apa yang terjadi di lapangan?',
    'Rangkuman ini menunjukkan kondisi unit, pola kerja, dan keluhan yang dilaporkan oleh pengguna sebagai dasar penilaian.',
  );

  doc.setFillColor(...WHITE);
  doc.setDrawColor(...LIGHT);
  doc.roundedRect(MARGIN, y, CONTENT_W, 61, 4, 4, 'FD');
  labelValue(doc, 'Brand & Model', `${data.brand} ${data.model}`, MARGIN + 6, y + 12, 76);
  labelValue(doc, 'Jenis Unit', data.category, 110, y + 12, 76);
  labelValue(doc, 'Battery Saat Ini', `${data.batteryType} • ${data.voltage} • ${data.capacity}`, MARGIN + 6, y + 32, 76);
  labelValue(doc, 'Pola Kerja', `${data.shift} shift • ${data.operatingHoursPerDay} jam/hari`, 110, y + 32, 76);
  labelValue(doc, 'Umur Battery', `${data.batteryAgeYears} tahun`, MARGIN + 6, y + 50, 76);
  labelValue(doc, 'Isi Air Battery', `${data.wateringPerWeek}x per minggu`, 110, y + 50, 76);

  y += 76;
  y = quoteCard(doc, fieldNarrative(data), y, false) + 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text('Keluhan utama', MARGIN, y);
  bulletList(doc, data.issues, MARGIN, y + 10, 80, 10);

  doc.text('Kondisi yang dikonfirmasi', 110, y);
  bulletList(
    doc,
    [
      `Daya battery habis dalam satu shift: ${yesNo(data.fastDrain)}`,
      `Pengisian daya lebih dari 8 jam: ${yesNo(data.longCharging)}`,
      `Waktu henti lebih dari dua kali per bulan: ${yesNo(data.frequentDowntime)}`,
      `Charger pernah menampilkan kode gangguan: ${yesNo(data.chargerError)}`,
      `Hydraulic melambat saat daya battery rendah: ${yesNo(data.hydraulicSlow)}`,
    ],
    110,
    y + 10,
    80,
    7,
  );

  // 3. KONDISI BATTERY & PENYEBAB
  newPage(doc, 3, 'Kondisi Battery');
  y = sectionTitle(
    doc,
    '02 / Temuan utama',
    'Apa yang paling mungkin memengaruhi performa?',
    'Persentase menunjukkan tingkat keyakinan terhadap kemungkinan penyebab berdasarkan data yang tersedia. Nilai ini perlu dibuktikan melalui pemeriksaan aktual.',
  );

  drawGauge(doc, 48, y + 31, data.healthScore);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...MID_GREY);
  doc.text('KONDISI SAAT INI', 85, y + 8);
  doc.setFontSize(16);
  doc.setTextColor(...BLACK);
  doc.text(`${conditionLabel(data.healthScore)} • Skor Kondisi ${data.healthScore}%`, 85, y + 20);
  paragraph(doc, executiveNarrative(data), 85, y + 31, 103, 8.7, GREY, 4.8);

  y += 71;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text('Penyebab yang perlu diverifikasi', MARGIN, y);

  let causeY = y + 12;
  if (safeCauses.length) {
    for (const cause of safeCauses) {
      causeY = drawBar(doc, MARGIN, causeY, CONTENT_W, cause.name, cause.value, cause.reason || undefined);
    }
  } else {
    causeY = paragraph(doc, 'Belum ada penyebab yang cukup kuat untuk ditampilkan dari data sesi ini.', MARGIN, causeY, CONTENT_W, 8.5, GREY);
  }

  if (safeFindings.length && causeY < 232) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BLACK);
    doc.text('Hal yang perlu diperiksa lebih lanjut', MARGIN, causeY + 8);
    bulletList(doc, safeFindings, MARGIN, causeY + 18, CONTENT_W, 5);
  }

  // 4. DAMPAK TERHADAP OPERASI
  newPage(doc, 4, 'Dampak Terhadap Operasi');
  y = sectionTitle(
    doc,
    '03 / Dampak kerja sehari-hari',
    'Di mana gangguan battery mulai terasa?',
    'Nilai di bawah membantu melihat waktu yang hilang, beban perawatan, dan pengaruhnya terhadap kesiapan forklift untuk bekerja.',
  );

  metricCard(doc, MARGIN, y, 40, 'Waktu henti', `${data.downtimeHoursPerMonth} jam/bln`, 'Perkiraan unit tidak produktif');
  metricCard(doc, MARGIN + 45, y, 40, 'Pengisian daya', `${data.chargingExposureHoursPerMonth} jam/bln`, 'Waktu terserap untuk pengisian');
  metricCard(doc, MARGIN + 90, y, 40, 'Perawatan', `${data.maintenanceActionsPerYear}x/thn`, 'Isi air dan pemeriksaan rutin');
  metricCard(doc, MARGIN + 135, y, 39, 'Produktivitas', `-${data.productivityLossPercent}%`, 'Terhadap jam operasi tersedia');

  y += 49;
  y = quoteCard(
    doc,
    `Pada armada ${data.fleetSize} unit dengan pola sekitar ${data.simulationHoursPerDay} jam operasi dan ${data.simulationShift} shift, waktu henti, pengisian daya, dan perawatan saling memengaruhi kesiapan unit. Karena itu, keputusan battery perlu dilihat sebagai bagian dari keputusan operasi, bukan sekadar penggantian komponen.`,
    y,
    true,
  ) + 13;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text('Apa artinya bagi operasi sehari-hari?', MARGIN, y);
  bulletList(
    doc,
    [
      data.frequentDowntime ? 'Waktu henti sudah perlu dikendalikan sebagai masalah operasi, bukan kejadian insidental.' : 'Waktu henti belum menjadi keluhan utama, tetapi tetap perlu dipantau.',
      data.longCharging ? 'Pengisian daya lebih dari 8 jam mempersempit waktu unit tersedia untuk bekerja.' : 'Durasi pengisian daya belum menjadi keluhan utama pada sesi ini.',
      data.wateringPerWeek >= 2 ? `Isi air battery ${data.wateringPerWeek}x per minggu menambah pekerjaan perawatan rutin.` : 'Frekuensi isi air battery masih relatif rendah berdasarkan data yang diisi.',
      data.simulationShift >= 2 ? 'Operasi multi-shift membutuhkan battery dan waktu pengisian yang lebih konsisten.' : 'Operasi satu shift memberi waktu pengisian yang lebih longgar dibanding operasi multi-shift.',
    ],
    MARGIN,
    y + 10,
    CONTENT_W,
    6,
  );

  // 5. DAMPAK BIAYA
  newPage(doc, 5, 'Dampak Biaya');
  y = sectionTitle(
    doc,
    '04 / Nilai gangguan bagi perusahaan',
    'Berapa besar potensi beban biayanya?',
    'Nominal hanya dihitung dari data biaya yang diberikan perusahaan. Bila biaya internal belum diketahui, laporan tidak membuat asumsi Rupiah.',
  );

  if (monetaryInputsAvailable) {
    metricCard(doc, MARGIN, y, 54, 'Waktu henti / bulan', rupiah(monthlyDowntimeCost), `${data.fleetSize} unit × ${data.downtimeHoursPerMonth} jam`);
    metricCard(doc, MARGIN + 60, y, 54, 'Perawatan / bulan', rupiah(monthlyMaintenanceCost), 'Berdasarkan data perusahaan');
    metricCard(doc, MARGIN + 120, y, 54, 'Pengisian / bulan', rupiah(monthlyChargingCost), 'Berdasarkan data perusahaan');

    y += 48;
    doc.setFillColor(...BLACK);
    doc.roundedRect(MARGIN, y, CONTENT_W, 63, 5, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...MID_GREY);
    doc.text('PERKIRAAN BEBAN OPERASIONAL SETAHUN', MARGIN + 8, y + 13);
    doc.setFontSize(23);
    doc.setTextColor(...WHITE);
    doc.text(rupiah(annualOperatingCost), MARGIN + 8, y + 30);
    doc.setFontSize(8.3);
    doc.setTextColor(...MID_GREY);
    doc.text('berdasarkan angka biaya yang diberikan perusahaan', MARGIN + 8, y + 39);

    doc.setFillColor(...YELLOW);
    doc.roundedRect(MARGIN + 8, y + 46, CONTENT_W - 16, 10, 2, 2, 'F');
    doc.setTextColor(...BLACK);
    doc.setFontSize(8);
    doc.text(`Skenario potensi pengurangan beban: ${rupiah(annualSavingScenario)} / tahun`, MARGIN + 13, y + 52.5);

    y += 79;
    quoteCard(doc, 'Angka ini bukan harga battery dan bukan penawaran komersial. Nilainya digunakan untuk memahami besarnya beban operasi yang mungkin dapat dikurangi.', y, false);
  } else {
    doc.setFillColor(...BLACK);
    doc.roundedRect(MARGIN, y, CONTENT_W, 72, 5, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...MID_GREY);
    doc.text('STATUS DATA BIAYA', MARGIN + 8, y + 13);
    doc.setFontSize(20);
    doc.setTextColor(...WHITE);
    doc.text('Menunggu data biaya perusahaan', MARGIN + 8, y + 29);
    paragraph(
      doc,
      'Tidak mengetahui biaya internal bukan masalah. Dampak operasi tetap dapat dibaca dari waktu henti, waktu pengisian daya, pekerjaan perawatan, dan kehilangan produktivitas. Nilai Rupiah baru dihitung setelah data biaya perusahaan tersedia.',
      MARGIN + 8,
      y + 41,
      CONTENT_W - 16,
      8.6,
      MID_GREY,
      4.7,
    );

    y += 88;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BLACK);
    doc.text('Data yang diperlukan untuk menghitung nilai finansial', MARGIN, y);
    bulletList(
      doc,
      [
        'Perkiraan kerugian atau biaya saat satu forklift berhenti selama satu jam.',
        'Biaya perawatan Lead Acid per unit per bulan, bila tersedia.',
        'Biaya listrik untuk pengisian battery per unit per bulan, bila tersedia.',
      ],
      MARGIN,
      y + 11,
      CONTENT_W,
      5,
    );
  }

  // 6. PERBANDINGAN TEKNOLOGI
  newPage(doc, 6, 'Perbandingan Teknologi');
  y = sectionTitle(
    doc,
    '05 / Lead Acid dan Lithium-ion',
    'Apa yang berubah bila teknologinya berbeda?',
    'Perbandingan ini digunakan untuk memahami konsekuensi terhadap cara kerja. Harga battery tidak ditampilkan pada tahap penilaian.',
  );

  const rows = [
    ['Waktu pengisian', '8–12 jam, kemudian masa pendinginan', 'Sekitar 1,5–2,5 jam; dapat diisi saat jeda operasi'],
    ['Umur siklus', 'Sekitar 1.200 siklus', 'Sekitar 3.000+ siklus'],
    ['Perawatan rutin', 'Isi air, equalizing, dan pembersihan', 'Tidak memerlukan isi air atau equalizing rutin'],
    ['Efisiensi energi', 'Sekitar 75–80%', 'Dapat mencapai sekitar 95%+'],
    ['Operasi multi-shift', 'Membutuhkan waktu pengisian dan rotasi battery', 'Lebih fleksibel untuk pengisian saat jeda'],
    ['Aspek keselamatan', 'Perlu penanganan asam dan ventilasi gas', 'Tanpa isi air; tetap perlu pengawasan Battery Management System (BMS)'],
  ];

  const x1 = MARGIN;
  const x2 = 72;
  const x3 = 131;
  doc.setFillColor(...BLACK);
  doc.roundedRect(MARGIN, y, CONTENT_W, 16, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(...WHITE);
  doc.text('PARAMETER', x1 + 5, y + 10);
  doc.text('LEAD ACID SAAT INI', x2 + 4, y + 10);
  doc.setFillColor(...YELLOW);
  doc.roundedRect(x3, y, PAGE_W - MARGIN - x3, 16, 0, 3, 'F');
  doc.setTextColor(...BLACK);
  doc.text('LITHIUM-ION UNTUK DIEVALUASI', x3 + 4, y + 10);

  let tableY = y + 16;
  for (const [parameter, lead, lithium] of rows) {
    doc.setFillColor(...WHITE);
    doc.setDrawColor(...LIGHT);
    doc.rect(MARGIN, tableY, CONTENT_W, 24, 'FD');
    doc.setFillColor(255, 254, 240);
    doc.rect(x3, tableY, PAGE_W - MARGIN - x3, 24, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.7);
    doc.setTextColor(...BLACK);
    doc.text((doc.splitTextToSize(parameter, 48) as string[]).slice(0, 3), x1 + 5, tableY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.3);
    doc.setTextColor(...GREY);
    doc.text((doc.splitTextToSize(lead, 51) as string[]).slice(0, 3), x2 + 4, tableY + 8);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BLACK);
    doc.text((doc.splitTextToSize(lithium, 54) as string[]).slice(0, 3), x3 + 4, tableY + 8);
    tableY += 24;
  }

  quoteCard(
    doc,
    'Lithium-ion tidak otomatis menjadi pilihan terbaik untuk setiap perusahaan. Kelayakannya bergantung pada pola kerja unit, charger, konektor, ruang battery, temperatur, jumlah shift, dan target kesiapan unit.',
    tableY + 10,
    true,
  );

  // 7. DASAR KEPUTUSAN INVESTASI
  newPage(doc, 7, 'Dasar Keputusan Investasi');
  y = sectionTitle(
    doc,
    '06 / Potensi perbaikan',
    'Apa yang mungkin diperoleh bila pola operasi diperbaiki?',
    'Persentase di bawah adalah skenario awal untuk membantu pembahasan. Nilai aktual harus dibuktikan dengan data operasi dan pemeriksaan lapangan.',
  );

  metricCard(doc, MARGIN, y, 40, 'Waktu henti', `-${data.downtimeReductionPercent}%`, 'Potensi pengurangan');
  metricCard(doc, MARGIN + 45, y, 40, 'Efisiensi energi', `+${data.energyEfficiencyPercent}%`, 'Potensi peningkatan');
  metricCard(doc, MARGIN + 90, y, 40, 'Perawatan', `-${data.maintenanceReductionPercent}%`, 'Potensi pengurangan pekerjaan rutin');
  metricCard(doc, MARGIN + 135, y, 39, 'Kesesuaian', cleanClientText(data.operationalFit) || '-', 'Terhadap shift & jam operasi');

  y += 50;
  y = quoteCard(
    doc,
    `Pada armada ${data.fleetSize} unit, operasi ${data.simulationShift} shift dan sekitar ${data.simulationHoursPerDay} jam per hari, manfaat utama dari teknologi battery yang lebih sesuai adalah menjaga forklift tersedia ketika dibutuhkan. Dasar keputusan investasi sebaiknya menghubungkan teknologi dengan kesiapan unit, waktu pengisian, perawatan, dan produktivitas.`,
    y,
    true,
  ) + 14;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text('Pertanyaan yang perlu dijawab sebelum keputusan investasi', MARGIN, y);
  bulletList(
    doc,
    [
      'Berapa jam forklift benar-benar dibutuhkan setiap hari dan pada setiap shift?',
      'Apakah waktu pengisian saat ini mengurangi kesiapan unit?',
      'Berapa kali unit berhenti karena battery atau charger dalam satu bulan?',
      'Apakah tersedia waktu istirahat yang dapat digunakan untuk pengisian daya?',
      'Apakah charger, konektor, dan ruang battery mendukung perubahan teknologi?',
      monetaryInputsAvailable
        ? `Apakah potensi pengurangan beban sekitar ${rupiah(annualSavingScenario)} per tahun cukup signifikan untuk dilanjutkan ke evaluasi investasi?`
        : 'Berapa biaya waktu henti per jam agar nilai finansial dapat dihitung menggunakan data perusahaan sendiri?',
    ],
    MARGIN,
    y + 11,
    CONTENT_W,
    7,
  );

  // 8. REKOMENDASI & VERIFIKASI
  newPage(doc, 8, 'Rekomendasi & Verifikasi');
  y = sectionTitle(
    doc,
    '07 / Langkah berikutnya',
    'Apa yang sebaiknya dilakukan setelah laporan ini?',
    'Keputusan battery sebaiknya didasarkan pada kondisi unit, kebutuhan kerja, keselamatan, dan data yang dapat diverifikasi.',
  );

  doc.setFillColor(...BLACK);
  doc.roundedRect(MARGIN, y, CONTENT_W, 70, 5, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...MID_GREY);
  doc.text('REKOMENDASI DRRKOBE', MARGIN + 8, y + 13);
  doc.setFontSize(20);
  doc.setTextColor(...WHITE);
  const recommendationHeadline = data.healthScore <= 65
    ? 'Lanjutkan ke Pemeriksaan Teknis Lapangan'
    : 'Pertahankan Pemantauan & Verifikasi Berkala';
  doc.text(recommendationHeadline, MARGIN + 8, y + 29);
  paragraph(doc, decisionStatement(data), MARGIN + 8, y + 41, CONTENT_W - 16, 8.9, MID_GREY, 4.8);

  y += 86;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text('Yang perlu diperiksa di lokasi', MARGIN, y);
  y = bulletList(
    doc,
    [
      'Ukur kapasitas aktual battery dan bandingkan dengan kebutuhan kerja unit.',
      'Periksa kondisi sel, terminal, konektor, kabel, dan temperatur kerja.',
      'Validasi charger: tegangan, arus, pola pengisian, riwayat gangguan, dan waktu pengisian yang tersedia.',
      'Konfirmasi dimensi ruang battery, berat minimum, konektor, dan kebutuhan counterweight.',
      'Catat pola shift, jam operasi, waktu istirahat, dan waktu henti aktual selama beberapa hari operasi.',
      'Jika Lithium-ion akan dievaluasi, pastikan kompatibilitas charger, Battery Management System (BMS), konektor, dan prosedur keselamatan.',
    ],
    MARGIN,
    y + 11,
    CONTENT_W,
    7,
  );

  if (safeActions.length && y < 225) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BLACK);
    doc.text('Catatan tindak lanjut', MARGIN, y + 8);
    y = bulletList(doc, safeActions, MARGIN, y + 18, CONTENT_W, 4);
  }

  const closingY = Math.max(236, y + 8);
  doc.setFillColor(...YELLOW);
  doc.roundedRect(MARGIN, closingY, CONTENT_W, 28, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text('Langkah berikutnya', MARGIN + 7, closingY + 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.1);
  doc.text(
    doc.splitTextToSize('Jadwalkan pemeriksaan teknis bersama DRRKOBE untuk memvalidasi kondisi aktual dan menentukan pilihan yang paling sesuai dengan kebutuhan operasi perusahaan.', CONTENT_W - 14) as string[],
    MARGIN + 7,
    closingY + 18,
  );

  doc.setFontSize(6.4);
  doc.setTextColor(...GREY);
  doc.text('Nomor penilaian:', MARGIN, 276);
  doc.setFont('helvetica', 'bold');
  doc.text(data.diagnosisId, MARGIN + 22, 276);
  doc.setFont('helvetica', 'normal');
  doc.text('Dokumen ini bukan sertifikat kepatuhan atau sertifikasi ISO dan tidak menggantikan inspeksi teknis lapangan.', PAGE_W - MARGIN, 276, { align: 'right' });

  const fileName = `DRRKOBE_Assessment_${filenamePart(safe(data.companyName, 'Client'))}_${filenamePart(data.model)}_${filenamePart(data.diagnosisId)}.pdf`;
  doc.save(fileName);
}
