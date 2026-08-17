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
const GREY: [number, number, number] = [92, 92, 99];
const MID_GREY: [number, number, number] = [161, 161, 170];
const LIGHT: [number, number, number] = [228, 228, 231];
const RED: [number, number, number] = [239, 68, 68];
const GREEN: [number, number, number] = [34, 197, 94];

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

function humanizeText(value: string): string {
  return value
    .replace(/health_score/gi, 'Health Score')
    .replace(/lead_acid/gi, 'Lead Acid')
    .replace(/charging_lama/gi, 'charging lebih dari 8 jam')
    .replace(/isi_air/gi, 'frekuensi isi air')
    .replace(/diagnostic_rules?/gi, 'aturan diagnosis')
    .replace(/battery_specs?/gi, 'spesifikasi battery')
    .replace(/confidence_base/gi, 'tingkat keyakinan')
    .replace(/recommended_actions?/gi, 'tindakan yang disarankan')
    .replace(/technical_findings?/gi, 'temuan teknis')
    .replace(/probable_causes?/gi, 'kemungkinan penyebab')
    .replace(/\bAI\b/gi, 'analisis')
    .replace(/\bengine\b/gi, 'analisis')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function riskLabel(score: number): string {
  if (score <= 40) return 'Kritis';
  if (score <= 65) return 'Perlu perhatian';
  if (score <= 80) return 'Waspada';
  return 'Baik';
}

function riskColor(score: number): [number, number, number] {
  if (score <= 40) return RED;
  if (score <= 80) return YELLOW;
  return GREEN;
}

function pageBase(doc: jsPDF, page: number, section: string) {
  doc.setFillColor(...PAPER);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

  doc.setTextColor(...BLACK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('DRRKOBE', MARGIN, 13);

  doc.setFillColor(...YELLOW);
  doc.roundedRect(MARGIN + 23, 7.5, 10, 7, 1.5, 1.5, 'F');
  doc.setTextColor(...BLACK);
  doc.setFontSize(6.5);
  doc.text('BIP', MARGIN + 25, 12.1);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.3);
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

  if (subheading) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...GREY);
    const lines = doc.splitTextToSize(subheading, CONTENT_W) as string[];
    doc.text(lines, MARGIN, y + 23);
    return y + 23 + Math.max(1, lines.length) * 4.5 + 5;
  }

  return y + 24;
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
  doc.setFontSize(6.4);
  doc.setTextColor(...MID_GREY);
  doc.text(label.toUpperCase(), x, y);

  doc.setFontSize(9.6);
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

  doc.setFontSize(15);
  doc.setTextColor(...(dark ? WHITE : BLACK));
  doc.text(value, x + 5, y + 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.4);
  doc.setTextColor(...(dark ? MID_GREY : GREY));
  const lines = doc.splitTextToSize(note, width - 10) as string[];
  doc.text(lines.slice(0, 2), x + 5, y + 26);
}

function quoteCard(doc: jsPDF, text: string, y: number, dark = true): number {
  const fill = dark ? BLACK : WHITE;
  const textColor = dark ? WHITE : BLACK;

  doc.setFillColor(...fill);
  doc.setDrawColor(...(dark ? BLACK : LIGHT));
  const lines = doc.splitTextToSize(text, CONTENT_W - 20) as string[];
  const height = Math.max(34, 18 + lines.length * 5.2);
  doc.roundedRect(MARGIN, y, CONTENT_W, height, 4, 4, 'FD');

  doc.setFillColor(...YELLOW);
  doc.roundedRect(MARGIN + 7, y + 8, 4, 14, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.2);
  doc.setTextColor(...textColor);
  doc.text(lines, MARGIN + 17, y + 12);

  return y + height;
}

function bulletList(doc: jsPDF, items: string[], x: number, y: number, width: number, maxItems = 7): number {
  const list = items.slice(0, maxItems).map(humanizeText).filter(Boolean);
  if (!list.length) {
    return paragraph(doc, 'Belum ada catatan tambahan pada bagian ini.', x, y, width, 8.5, GREY);
  }

  let cursor = y;
  for (const item of list) {
    doc.setFillColor(...YELLOW);
    doc.circle(x + 1.5, cursor - 1.4, 1.2, 'F');
    cursor = paragraph(doc, item, x + 6, cursor, width - 6, 8.5, BLACK, 4.4) + 1.8;
  }
  return cursor;
}

function causeBar(doc: jsPDF, x: number, y: number, width: number, cause: AssessmentCause): number {
  const value = Math.max(0, Math.min(100, cause.value));
  const name = humanizeText(cause.name);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...BLACK);
  doc.text(name, x, y);
  doc.text(`${value}%`, x + width, y, { align: 'right' });

  doc.setFillColor(240, 240, 241);
  doc.roundedRect(x, y + 3, width, 3.2, 1.6, 1.6, 'F');
  doc.setFillColor(...YELLOW);
  doc.roundedRect(x, y + 3, Math.max(2, (width * value) / 100), 3.2, 1.6, 1.6, 'F');

  let next = y + 12;
  if (cause.reason) {
    next = paragraph(doc, humanizeText(cause.reason), x, y + 11, width, 7.4, GREY, 4.1) + 2;
  }
  return next;
}

function executiveNarrative(data: AssessmentReportData): string {
  const issueNames = data.issues.slice(0, 3).join(', ').toLowerCase();
  const operation = `${data.shift} shift dan sekitar ${data.operatingHoursPerDay} jam operasi per hari`;

  if (data.healthScore <= 40) {
    return `Kondisi battery menunjukkan risiko operasional tinggi. Pada pola ${operation}, gejala seperti ${issueNames || 'penurunan performa'} sudah cukup kuat untuk memengaruhi availability unit. Prioritas berikutnya adalah memeriksa kapasitas aktual battery, pola charging, dan kondisi charger sebelum keputusan perubahan teknologi dibuat.`;
  }
  if (data.healthScore <= 65) {
    return `Performa battery masih dapat digunakan, namun marginnya terhadap kebutuhan operasi mulai menurun. Dengan pola ${operation}, masalah ${issueNames || 'yang dilaporkan'} perlu diverifikasi agar downtime tidak berkembang menjadi gangguan operasional yang lebih besar.`;
  }
  if (data.healthScore <= 80) {
    return `Battery masih berada pada kondisi yang dapat dikelola, tetapi terdapat beberapa tanda yang perlu dipantau. Fokus utama adalah menjaga pola charging, maintenance, dan waktu operasi agar penurunan performa tidak semakin cepat.`;
  }
  return `Kondisi battery saat ini relatif baik berdasarkan data yang tersedia. Tindakan utama adalah mempertahankan disiplin charging dan maintenance, kemudian memantau perubahan performa dari waktu ke waktu.`;
}

function fieldNarrative(data: AssessmentReportData): string {
  const clues: string[] = [];
  if (data.fastDrain) clues.push('daya tidak bertahan satu shift');
  if (data.longCharging) clues.push('waktu charging lebih dari 8 jam');
  if (data.frequentDowntime) clues.push('downtime terjadi lebih dari dua kali per bulan');
  if (data.chargerError) clues.push('charger pernah menampilkan error');
  if (data.hydraulicSlow) clues.push('hydraulic melambat saat battery rendah');

  const finding = clues.length ? clues.join(', ') : 'tidak ada gejala tambahan yang dilaporkan';
  return `Unit beroperasi ${data.shift} shift dengan estimasi ${data.operatingHoursPerDay} jam per hari. Battery berumur ${data.batteryAgeYears} tahun dan membutuhkan isi air sekitar ${data.wateringPerWeek} kali per minggu. Dari sisi pengguna, kondisi yang paling terasa adalah ${finding}. Informasi ini menjadi dasar penilaian awal dan tetap perlu dikonfirmasi saat pemeriksaan langsung.`;
}

function decisionStatement(data: AssessmentReportData): string {
  if (data.healthScore <= 40) {
    return 'Layak dilanjutkan ke technical assessment untuk menentukan apakah optimasi Lead Acid masih memadai atau migrasi ke Lithium-ion lebih sesuai dengan kebutuhan operasi.';
  }
  if (data.healthScore <= 65) {
    return 'Technical assessment direkomendasikan sebelum memutuskan investasi. Fokus verifikasi adalah kapasitas aktual, charging window, charger, dan pola downtime.';
  }
  return 'Belum ada alasan untuk mengambil keputusan teknologi secara terburu-buru. Pertahankan monitoring dan lakukan assessment bila gejala semakin sering atau jam operasi meningkat.';
}

function drawSimpleGauge(doc: jsPDF, x: number, y: number, score: number) {
  const color = riskColor(score);
  doc.setFillColor(245, 245, 245);
  doc.circle(x, y, 26, 'F');
  doc.setFillColor(...color);
  doc.circle(x, y, 23, 'F');
  doc.setFillColor(...WHITE);
  doc.circle(x, y, 18, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...BLACK);
  doc.text(`${score}%`, x, y + 2, { align: 'center' });

  doc.setFontSize(6.8);
  doc.setTextColor(...color);
  doc.text(riskLabel(score).toUpperCase(), x, y + 9, { align: 'center' });
}

export function downloadAssessmentPdf(data: AssessmentReportData) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });

  const monthlyDowntimeCost = (data.downtimeCostPerHour || 0) * data.downtimeHoursPerMonth * data.fleetSize;
  const monthlyMaintenanceCost = (data.maintenanceCostPerUnitMonth || 0) * data.fleetSize;
  const monthlyChargingCost = (data.chargingCostPerUnitMonth || 0) * data.fleetSize;
  const annualOperatingExposure = (monthlyDowntimeCost + monthlyMaintenanceCost + monthlyChargingCost) * 12;
  const annualSavingScenario = (
    monthlyDowntimeCost * (data.downtimeReductionPercent / 100) +
    monthlyMaintenanceCost * (data.maintenanceReductionPercent / 100) +
    monthlyChargingCost * (data.energyEfficiencyPercent / 100)
  ) * 12;
  const monetaryInputsAvailable = annualOperatingExposure > 0;
  const reportDate = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  const scoreLabel = riskLabel(data.healthScore);

  // PAGE 1 — RINGKASAN EKSEKUTIF
  newPage(doc, 1, 'Ringkasan Eksekutif');

  doc.setFillColor(...BLACK);
  doc.roundedRect(MARGIN, 28, CONTENT_W, 78, 5, 5, 'F');

  doc.setTextColor(...MID_GREY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('LAPORAN PENILAIAN EKSEKUTIF', MARGIN + 9, 41);

  doc.setTextColor(...WHITE);
  doc.setFontSize(24);
  doc.text('Kesehatan Battery &', MARGIN + 9, 55);
  doc.text('Dampak Operasional', MARGIN + 9, 66);

  doc.setFillColor(...YELLOW);
  doc.rect(MARGIN + 9, 72, 55, 3, 'F');

  doc.setFontSize(8);
  doc.setTextColor(...MID_GREY);
  doc.text('Disiapkan untuk', MARGIN + 9, 85);
  doc.setFontSize(13);
  doc.setTextColor(...WHITE);
  doc.text(safe(data.companyName, 'Assessment Client'), MARGIN + 9, 94);

  doc.setFontSize(7.5);
  doc.setTextColor(...MID_GREY);
  doc.text(`${safe(data.siteName, 'Lokasi belum diisi')} • ${reportDate}`, PAGE_W - MARGIN - 9, 94, { align: 'right' });

  drawSimpleGauge(doc, 46, 138, data.healthScore);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...MID_GREY);
  doc.text('KESIMPULAN UTAMA', 83, 119);

  doc.setFontSize(15);
  doc.setTextColor(...BLACK);
  const decisionLines = doc.splitTextToSize(
    data.healthScore <= 40 ? 'Battery perlu mendapat perhatian segera.' : data.healthScore <= 65 ? 'Performa mulai membatasi operasi.' : 'Kondisi masih dapat dikelola.',
    105,
  ) as string[];
  doc.text(decisionLines, 83, 131);

  let y = 145;
  y = paragraph(doc, executiveNarrative(data), 83, y, 105, 9.3, GREY, 5.1);

  const cardsY = Math.max(184, y + 8);
  metricCard(doc, MARGIN, cardsY, 40, 'Urgensi', humanizeText(data.urgency), 'Prioritas tindak lanjut');
  metricCard(doc, MARGIN + 45, cardsY, 40, 'Keyakinan', `${data.confidence}%`, 'Berdasarkan data yang tersedia');
  metricCard(doc, MARGIN + 90, cardsY, 40, 'Masalah', `${data.issues.length}`, 'Gejala yang dilaporkan');
  metricCard(doc, MARGIN + 135, cardsY, 39, 'Fleet', `${data.fleetSize} unit`, 'Cakupan simulasi');

  y = quoteCard(doc, decisionStatement(data), cardsY + 46, true) + 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...GREY);
  doc.text('Laporan ini adalah penilaian awal berdasarkan data yang diisi. Keputusan teknis akhir memerlukan verifikasi kondisi aktual di lapangan.', MARGIN, Math.min(267, y));

  // PAGE 2 — KONDISI LAPANGAN
  newPage(doc, 2, 'Kondisi Lapangan');
  y = sectionTitle(
    doc,
    '01 / Kondisi saat ini',
    'Apa yang terjadi di lapangan?',
    'Bagian ini merangkum kondisi unit dan gejala yang benar-benar dirasakan oleh pengguna, tanpa menerjemahkannya menjadi istilah software atau kode internal.',
  );

  doc.setFillColor(...WHITE);
  doc.setDrawColor(...LIGHT);
  doc.roundedRect(MARGIN, y, CONTENT_W, 61, 4, 4, 'FD');
  labelValue(doc, 'Brand & Model', `${data.brand} ${data.model}`, MARGIN + 6, y + 12, 76);
  labelValue(doc, 'Jenis Unit', data.category, 110, y + 12, 76);
  labelValue(doc, 'Battery Saat Ini', `${data.batteryType} • ${data.voltage} • ${data.capacity}`, MARGIN + 6, y + 32, 76);
  labelValue(doc, 'Pola Operasi', `${data.shift} shift • ${data.operatingHoursPerDay} jam/hari`, 110, y + 32, 76);
  labelValue(doc, 'Umur Battery', `${data.batteryAgeYears} tahun`, MARGIN + 6, y + 50, 76);
  labelValue(doc, 'Isi Air', `${data.wateringPerWeek}x per minggu`, 110, y + 50, 76);

  y += 76;
  y = quoteCard(doc, fieldNarrative(data), y, false) + 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text('Keluhan yang dipilih pengguna', MARGIN, y);
  y = bulletList(doc, data.issues, MARGIN, y + 10, 80, 10);

  const detailY = y - Math.min(60, Math.max(25, data.issues.length * 6));
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Kondisi operasional yang terkonfirmasi', 110, detailY);
  bulletList(
    doc,
    [
      `Battery cepat habis dalam satu shift: ${yesNo(data.fastDrain)}`,
      `Charging lebih dari 8 jam: ${yesNo(data.longCharging)}`,
      `Downtime lebih dari dua kali per bulan: ${yesNo(data.frequentDowntime)}`,
      `Charger pernah menunjukkan error: ${yesNo(data.chargerError)}`,
      `Hydraulic melambat saat battery rendah: ${yesNo(data.hydraulicSlow)}`,
    ],
    110,
    detailY + 10,
    80,
    7,
  );

  // PAGE 3 — PENYEBAB & HEALTH
  newPage(doc, 3, 'Kesehatan Battery');
  y = sectionTitle(
    doc,
    '02 / Temuan teknis',
    'Apa yang paling mungkin memengaruhi performa?',
    'Persentase di bawah menunjukkan tingkat keyakinan terhadap kemungkinan penyebab berdasarkan data yang tersedia. Ini bukan hasil pengukuran laboratorium dan tetap perlu dibuktikan saat assessment.',
  );

  drawSimpleGauge(doc, 48, y + 31, data.healthScore);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...MID_GREY);
  doc.text('KONDISI SAAT INI', 85, y + 8);
  doc.setFontSize(16);
  doc.setTextColor(...BLACK);
  doc.text(`${scoreLabel} • Health Score ${data.healthScore}%`, 85, y + 20);
  paragraph(doc, executiveNarrative(data), 85, y + 31, 103, 8.8, GREY, 4.8);

  y += 70;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text('Kemungkinan penyebab utama', MARGIN, y);

  let causeY = y + 11;
  const causes = data.causes.slice(0, 4);
  if (causes.length) {
    for (const cause of causes) {
      causeY = causeBar(doc, MARGIN, causeY, CONTENT_W, cause);
    }
  } else {
    causeY = paragraph(doc, 'Belum ada penyebab yang dapat ditampilkan dari data sesi ini.', MARGIN, causeY, CONTENT_W, 8.5, GREY);
  }

  const findings = (data.technicalFindings || []).map(humanizeText).filter(Boolean);
  if (findings.length && causeY < 235) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BLACK);
    doc.text('Catatan teknis yang perlu diperiksa', MARGIN, causeY + 8);
    bulletList(doc, findings, MARGIN, causeY + 18, CONTENT_W, 5);
  }

  // PAGE 4 — DAMPAK OPERASIONAL
  newPage(doc, 4, 'Dampak Operasional');
  y = sectionTitle(
    doc,
    '03 / Dampak terhadap operasi',
    'Di mana performa battery mulai terasa?',
    'Fokus utama bukan harga battery, melainkan waktu unit tidak produktif, kebutuhan charging, beban maintenance, dan availability yang berkurang.',
  );

  metricCard(doc, MARGIN, y, 40, 'Downtime', `${data.downtimeHoursPerMonth} jam/bln`, 'Perkiraan waktu unit tidak produktif');
  metricCard(doc, MARGIN + 45, y, 40, 'Charging', `${data.chargingExposureHoursPerMonth} jam/bln`, 'Waktu yang terserap untuk charging');
  metricCard(doc, MARGIN + 90, y, 40, 'Maintenance', `${data.maintenanceActionsPerYear}x/thn`, 'Watering dan pemeriksaan rutin');
  metricCard(doc, MARGIN + 135, y, 39, 'Produktivitas', `-${data.productivityLossPercent}%`, 'Terhadap jam operasi tersedia');

  y += 49;
  y = quoteCard(
    doc,
    `Untuk fleet ${data.fleetSize} unit dengan pola sekitar ${data.simulationHoursPerDay} jam operasi dan ${data.simulationShift} shift, gangguan battery tidak berdiri sendiri. Waktu charging, downtime, dan maintenance saling memengaruhi availability unit. Karena itu, keputusan battery sebaiknya dilihat sebagai keputusan operasional, bukan sekadar penggantian komponen.`,
    y,
    true,
  ) + 13;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text('Apa artinya bagi operasi sehari-hari?', MARGIN, y);
  y = bulletList(
    doc,
    [
      data.frequentDowntime ? 'Downtime sudah menjadi isu yang perlu dikendalikan, bukan kejadian insidental.' : 'Downtime belum dilaporkan sebagai masalah utama, tetapi tetap perlu dipantau.',
      data.longCharging ? 'Charging lebih dari 8 jam mempersempit waktu unit tersedia untuk operasi.' : 'Durasi charging belum menjadi keluhan utama pada sesi ini.',
      data.wateringPerWeek >= 2 ? `Frekuensi isi air ${data.wateringPerWeek}x per minggu menambah pekerjaan maintenance rutin.` : 'Frekuensi isi air masih relatif rendah berdasarkan data yang diisi.',
      data.simulationShift >= 2 ? 'Operasi multi-shift membutuhkan battery dan charging window yang lebih konsisten.' : 'Operasi satu shift memberi ruang charging yang lebih longgar dibanding operasi multi-shift.',
    ],
    MARGIN,
    y + 10,
    CONTENT_W,
    6,
  );

  // PAGE 5 — DAMPAK FINANSIAL
  newPage(doc, 5, 'Dampak Finansial');
  y = sectionTitle(
    doc,
    '04 / Dampak biaya',
    'Berapa nilai gangguan ini bagi perusahaan?',
    'DRRKOBE hanya menghitung nominal dari data biaya yang diberikan pengguna. Bila biaya internal belum diketahui, laporan tidak akan mengarang angka.',
  );

  if (monetaryInputsAvailable) {
    metricCard(doc, MARGIN, y, 54, 'Downtime / Bulan', rupiah(monthlyDowntimeCost), `${data.fleetSize} unit × ${data.downtimeHoursPerMonth} jam`);
    metricCard(doc, MARGIN + 60, y, 54, 'Maintenance / Bulan', rupiah(monthlyMaintenanceCost), 'Berdasarkan biaya yang diisi');
    metricCard(doc, MARGIN + 120, y, 54, 'Charging / Bulan', rupiah(monthlyChargingCost), 'Berdasarkan biaya yang diisi');

    y += 48;
    doc.setFillColor(...BLACK);
    doc.roundedRect(MARGIN, y, CONTENT_W, 62, 5, 5, 'F');
    doc.setTextColor(...MID_GREY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('GAMBARAN TAHUNAN', MARGIN + 8, y + 13);

    doc.setTextColor(...WHITE);
    doc.setFontSize(23);
    doc.text(rupiah(annualOperatingExposure), MARGIN + 8, y + 29);
    doc.setFontSize(8.5);
    doc.setTextColor(...MID_GREY);
    doc.text('perkiraan exposure operasional per tahun dari data biaya yang diberikan', MARGIN + 8, y + 38);

    doc.setFillColor(...YELLOW);
    doc.roundedRect(MARGIN + 8, y + 45, CONTENT_W - 16, 10, 2, 2, 'F');
    doc.setTextColor(...BLACK);
    doc.setFontSize(8);
    doc.text(`Skenario potensi pengurangan exposure: ${rupiah(annualSavingScenario)} / tahun`, MARGIN + 13, y + 51.5);

    y += 77;
    y = quoteCard(doc, 'Angka finansial ini bukan penawaran harga battery. Nilainya hanya membantu perusahaan memahami besarnya biaya operasional yang mungkin sedang terjadi.', y, false) + 12;
  } else {
    doc.setFillColor(...BLACK);
    doc.roundedRect(MARGIN, y, CONTENT_W, 72, 5, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...MID_GREY);
    doc.text('STATUS DATA FINANSIAL', MARGIN + 8, y + 13);

    doc.setFontSize(20);
    doc.setTextColor(...WHITE);
    doc.text('Belum dapat dihitung secara akurat', MARGIN + 8, y + 29);

    paragraph(
      doc,
      'Tidak masalah bila pengguna belum mengetahui biaya internal. Dampak operasional tetap dapat dibaca dari downtime, waktu charging, maintenance, dan productivity exposure. Nominal Rupiah baru layak dihitung setelah perusahaan memberikan cost rate yang valid.',
      MARGIN + 8,
      y + 41,
      CONTENT_W - 16,
      8.7,
      MID_GREY,
      4.7,
    );

    y += 88;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BLACK);
    doc.text('Data yang dibutuhkan bila perusahaan ingin menghitung business case', MARGIN, y);
    bulletList(
      doc,
      [
        'Perkiraan kerugian atau biaya ketika satu forklift berhenti selama satu jam.',
        'Biaya maintenance Lead Acid per unit per bulan, bila tersedia.',
        'Biaya listrik atau charging per unit per bulan, bila tersedia.',
      ],
      MARGIN,
      y + 11,
      CONTENT_W,
      5,
    );
  }

  // PAGE 6 — PERBANDINGAN TEKNOLOGI
  newPage(doc, 6, 'Perbandingan Teknologi');
  y = sectionTitle(
    doc,
    '05 / Lead Acid vs Lithium-ion',
    'Apa yang berubah bila teknologinya berbeda?',
    'Perbandingan ini digunakan untuk memahami konsekuensi operasional. Tidak ada harga battery dalam bagian ini.',
  );

  const rows = [
    ['Waktu charging', '8–12 jam + cooling', '1,5–2,5 jam; mendukung opportunity charging'],
    ['Siklus pemakaian', 'Sekitar 1.200 siklus', 'Sekitar 3.000+ siklus'],
    ['Perawatan rutin', 'Isi air, equalizing, cleaning', 'Tidak memerlukan watering atau equalizing rutin'],
    ['Efisiensi energi', 'Sekitar 75–80%', 'Dapat mencapai sekitar 95%+'],
    ['Operasi multi-shift', 'Perlu charging window dan battery rotation', 'Lebih fleksibel untuk charging saat jeda'],
    ['Risiko operasional', 'Sulfation, watering, acid handling', 'Tidak ada acid watering; tetap perlu kontrol BMS & charging'],
  ];

  const x1 = MARGIN;
  const x2 = 72;
  const x3 = 131;
  doc.setFillColor(...BLACK);
  doc.roundedRect(MARGIN, y, CONTENT_W, 16, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.3);
  doc.setTextColor(...WHITE);
  doc.text('PARAMETER', x1 + 5, y + 10);
  doc.text('LEAD ACID SAAT INI', x2 + 4, y + 10);
  doc.setFillColor(...YELLOW);
  doc.roundedRect(x3, y, PAGE_W - MARGIN - x3, 16, 0, 3, 'F');
  doc.setTextColor(...BLACK);
  doc.text('LITHIUM-ION UNTUK EVALUASI', x3 + 4, y + 10);

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
    doc.text(doc.splitTextToSize(parameter, 48) as string[], x1 + 5, tableY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.4);
    doc.setTextColor(...GREY);
    doc.text((doc.splitTextToSize(lead, 51) as string[]).slice(0, 3), x2 + 4, tableY + 8);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BLACK);
    doc.text((doc.splitTextToSize(lithium, 54) as string[]).slice(0, 3), x3 + 4, tableY + 8);
    tableY += 24;
  }

  quoteCard(
    doc,
    'Perbandingan ini tidak berarti Lithium-ion selalu menjadi jawaban. Kelayakannya bergantung pada duty cycle, charger, konektor, ruang battery, temperatur, pola shift, dan target availability perusahaan.',
    tableY + 10,
    true,
  );

  // PAGE 7 — BUSINESS CASE
  newPage(doc, 7, 'Business Case');
  y = sectionTitle(
    doc,
    '06 / Potensi perbaikan',
    'Apa yang mungkin diperoleh dari perubahan cara operasi?',
    'Angka persentase adalah skenario awal untuk membantu diskusi. Nilai aktual harus dibuktikan melalui assessment dan data operasi perusahaan.',
  );

  metricCard(doc, MARGIN, y, 40, 'Downtime', `-${data.downtimeReductionPercent}%`, 'Skenario potensi pengurangan');
  metricCard(doc, MARGIN + 45, y, 40, 'Energi', `+${data.energyEfficiencyPercent}%`, 'Skenario peningkatan efisiensi');
  metricCard(doc, MARGIN + 90, y, 40, 'Maintenance', `-${data.maintenanceReductionPercent}%`, 'Skenario pengurangan pekerjaan rutin');
  metricCard(doc, MARGIN + 135, y, 39, 'Kesesuaian', data.operationalFit, 'Terhadap pola shift & jam operasi');

  y += 50;
  y = quoteCard(
    doc,
    `Pada fleet ${data.fleetSize} unit, operasi ${data.simulationShift} shift dan sekitar ${data.simulationHoursPerDay} jam per hari, nilai utama dari solusi battery yang lebih sesuai adalah menjaga unit tetap tersedia saat dibutuhkan. Karena itu, business case harus menghubungkan teknologi battery dengan availability, charging window, maintenance, dan produktivitas.`,
    y,
    true,
  ) + 14;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text('Pertanyaan yang sebaiknya dijawab sebelum keputusan investasi', MARGIN, y);
  y = bulletList(
    doc,
    [
      'Berapa jam forklift benar-benar dibutuhkan setiap hari dan di setiap shift?',
      'Apakah charging window saat ini mengganggu availability unit?',
      'Berapa kali unit berhenti karena battery atau charging dalam satu bulan?',
      'Apakah perusahaan memiliki waktu istirahat yang dapat digunakan untuk opportunity charging?',
      'Apakah charger, konektor, dan ruang battery mendukung perubahan teknologi?',
      monetaryInputsAvailable
        ? `Apakah potensi pengurangan exposure sekitar ${rupiah(annualSavingScenario)} per tahun cukup untuk membangun business case?`
        : 'Berapa biaya downtime per jam agar business case finansial dapat dihitung dengan data perusahaan sendiri?',
    ],
    MARGIN,
    y + 11,
    CONTENT_W,
    7,
  );

  // PAGE 8 — REKOMENDASI
  newPage(doc, 8, 'Rekomendasi & Tindak Lanjut');
  y = sectionTitle(
    doc,
    '07 / Keputusan berikutnya',
    'Apa yang sebaiknya dilakukan setelah laporan ini?',
    'Tujuannya bukan memaksa pembelian, tetapi memastikan keputusan battery didasarkan pada kondisi unit, kebutuhan operasi, dan data yang dapat diverifikasi.',
  );

  doc.setFillColor(...BLACK);
  doc.roundedRect(MARGIN, y, CONTENT_W, 70, 5, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...MID_GREY);
  doc.text('REKOMENDASI DRRKOBE', MARGIN + 8, y + 13);

  doc.setFontSize(20);
  doc.setTextColor(...WHITE);
  const headline = data.healthScore <= 65
    ? 'Lanjutkan ke Technical Assessment'
    : 'Pertahankan monitoring & verifikasi berkala';
  doc.text(headline, MARGIN + 8, y + 29);

  paragraph(doc, decisionStatement(data), MARGIN + 8, y + 41, CONTENT_W - 16, 9, MID_GREY, 4.8);

  y += 86;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text('Yang perlu diperiksa di lokasi', MARGIN, y);
  y = bulletList(
    doc,
    [
      'Ukur kapasitas aktual battery dan bandingkan dengan kebutuhan duty cycle.',
      'Periksa kondisi cell, terminal, connector, kabel, dan temperatur kerja.',
      'Validasi charger: tegangan, arus, charging profile, error history, dan charging window.',
      'Konfirmasi dimensi battery compartment, berat minimum, connector, dan kebutuhan counterweight.',
      'Catat pola shift, jam operasi, break time, dan downtime aktual minimal beberapa hari operasi.',
      'Bila Lithium-ion akan dievaluasi, pastikan kompatibilitas charger, BMS, connector, dan prosedur keselamatan.',
    ],
    MARGIN,
    y + 11,
    CONTENT_W,
    7,
  );

  const actions = (data.recommendedActions || []).map(humanizeText).filter(Boolean);
  if (actions.length && y < 225) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BLACK);
    doc.text('Catatan tindak lanjut dari hasil assessment', MARGIN, y + 8);
    y = bulletList(doc, actions, MARGIN, y + 18, CONTENT_W, 4);
  }

  const closingY = Math.max(236, y + 8);
  doc.setFillColor(...YELLOW);
  doc.roundedRect(MARGIN, closingY, CONTENT_W, 28, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text('Langkah berikutnya', MARGIN + 7, closingY + 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.text(
    (doc.splitTextToSize('Jadwalkan technical assessment bersama DRRKOBE untuk memvalidasi kondisi aktual dan menentukan pilihan yang paling sesuai untuk operasi perusahaan.', CONTENT_W - 14) as string[]),
    MARGIN + 7,
    closingY + 18,
  );

  doc.setFontSize(6.5);
  doc.setTextColor(...GREY);
  doc.text('Assessment ID:', MARGIN, 276);
  doc.setFont('helvetica', 'bold');
  doc.text(data.diagnosisId, MARGIN + 20, 276);
  doc.setFont('helvetica', 'normal');
  doc.text('Laporan ini bukan sertifikat ISO dan bukan pengganti inspeksi teknis lapangan.', PAGE_W - MARGIN, 276, { align: 'right' });

  const fileName = `DRRKOBE_Assessment_${filenamePart(safe(data.companyName, 'Client'))}_${filenamePart(data.model)}_${filenamePart(data.diagnosisId)}.pdf`;
  doc.save(fileName);
}
