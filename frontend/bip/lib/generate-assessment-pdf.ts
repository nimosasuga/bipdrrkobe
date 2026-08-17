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
const BLACK: [number, number, number] = [10, 10, 10];
const YELLOW: [number, number, number] = [255, 204, 0];
const PAPER: [number, number, number] = [252, 252, 249];
const GREY: [number, number, number] = [113, 113, 122];
const LIGHT: [number, number, number] = [228, 228, 231];
const RED: [number, number, number] = [239, 68, 68];
const GREEN: [number, number, number] = [34, 197, 94];
const TOTAL_PAGES = 8;

function rupiah(value: number): string {
  return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
}

function yesNo(value: boolean): string {
  return value ? 'Ya' : 'Tidak';
}

function safe(value: string | null | undefined, fallback = '-'): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function filenamePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 45) || 'assessment';
}

function addPageBase(doc: jsPDF, page: number, section: string) {
  doc.setFillColor(...PAPER);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

  doc.setTextColor(...BLACK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('DRRKOBE', MARGIN, 13);

  doc.setFillColor(...YELLOW);
  doc.roundedRect(MARGIN + 23, 7.5, 10, 7, 1.5, 1.5, 'F');
  doc.setFontSize(6.5);
  doc.text('BIP', MARGIN + 25, 12.1);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...GREY);
  doc.text('BATTERY RELIABILITY & OPERATIONAL IMPACT ASSESSMENT', PAGE_W - MARGIN, 11.5, { align: 'right' });

  doc.setDrawColor(...LIGHT);
  doc.line(MARGIN, 17, PAGE_W - MARGIN, 17);

  doc.setFontSize(6.5);
  doc.text(section.toUpperCase(), MARGIN, PAGE_H - 10);
  doc.text(`PAGE ${page} / ${TOTAL_PAGES}`, PAGE_W - MARGIN, PAGE_H - 10, { align: 'right' });
}

function title(doc: jsPDF, eyebrow: string, heading: string, y = 28): number {
  doc.setTextColor(...GREY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text(eyebrow.toUpperCase(), MARGIN, y);

  doc.setTextColor(...BLACK);
  doc.setFontSize(22);
  doc.text(heading, MARGIN, y + 10);

  doc.setFillColor(...YELLOW);
  doc.rect(MARGIN, y + 14, 42, 2.2, 'F');
  return y + 25;
}

function paragraph(doc: jsPDF, text: string, x: number, y: number, width: number, fontSize = 9, color = GREY, lineHeight = 4.8): number {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fontSize);
  doc.setTextColor(...color);
  const lines = doc.splitTextToSize(text, width) as string[];
  doc.text(lines, x, y);
  return y + Math.max(1, lines.length) * lineHeight;
}

function labelValue(doc: jsPDF, label: string, value: string, x: number, y: number, width = 78): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...GREY);
  doc.text(label.toUpperCase(), x, y);
  doc.setFontSize(9.5);
  doc.setTextColor(...BLACK);
  const lines = doc.splitTextToSize(value, width) as string[];
  doc.text(lines, x, y + 5);
  return y + 5 + lines.length * 4.5;
}

function metricCard(doc: jsPDF, x: number, y: number, w: number, label: string, value: string, sub?: string, dark = false) {
  if (dark) {
    doc.setFillColor(...BLACK);
    doc.setDrawColor(...BLACK);
  } else {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...LIGHT);
  }
  doc.roundedRect(x, y, w, 32, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...(dark ? [161, 161, 170] as [number, number, number] : GREY));
  doc.text(label.toUpperCase(), x + 5, y + 8);

  doc.setFontSize(15);
  doc.setTextColor(...(dark ? [255, 255, 255] as [number, number, number] : BLACK));
  doc.text(value, x + 5, y + 18);

  if (sub) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.4);
    doc.setTextColor(...(dark ? [161, 161, 170] as [number, number, number] : GREY));
    const lines = doc.splitTextToSize(sub, w - 10) as string[];
    doc.text(lines.slice(0, 2), x + 5, y + 24);
  }
}

function progressBar(doc: jsPDF, x: number, y: number, w: number, label: string, value: number) {
  const clamped = Math.max(0, Math.min(100, value));
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...BLACK);
  doc.text(label, x, y);
  doc.text(`${clamped}%`, x + w, y, { align: 'right' });

  doc.setFillColor(244, 244, 245);
  doc.roundedRect(x, y + 3, w, 3.2, 1.6, 1.6, 'F');
  doc.setFillColor(...YELLOW);
  doc.roundedRect(x, y + 3, Math.max(2, (w * clamped) / 100), 3.2, 1.6, 1.6, 'F');
}

function bulletList(doc: jsPDF, items: string[], x: number, y: number, width: number, maxItems = 8): number {
  const list = items.slice(0, maxItems);
  if (!list.length) return paragraph(doc, 'Belum ada data tambahan yang tersedia pada sesi ini.', x, y, width, 8.5);

  let cursor = y;
  list.forEach((item) => {
    doc.setFillColor(...YELLOW);
    doc.circle(x + 1.5, cursor - 1.5, 1.2, 'F');
    cursor = paragraph(doc, item, x + 6, cursor, width - 6, 8.4, BLACK, 4.3) + 1.5;
  });
  return cursor;
}

function riskColor(score: number): [number, number, number] {
  if (score <= 40) return RED;
  if (score <= 80) return YELLOW;
  return GREEN;
}

function newPage(doc: jsPDF, page: number, section: string) {
  if (page > 1) doc.addPage();
  addPageBase(doc, page, section);
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

  // PAGE 1 - EXECUTIVE SUMMARY
  newPage(doc, 1, 'Executive Summary');
  doc.setFillColor(...BLACK);
  doc.roundedRect(MARGIN, 28, CONTENT_W, 73, 5, 5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('EXECUTIVE DECISION REPORT', MARGIN + 8, 41);
  doc.setFontSize(25);
  doc.text('Battery Reliability &', MARGIN + 8, 55);
  doc.text('Operational Impact', MARGIN + 8, 66);
  doc.setFillColor(...YELLOW);
  doc.rect(MARGIN + 8, 71, 54, 3, 'F');
  doc.setFontSize(9);
  doc.setTextColor(212, 212, 216);
  doc.text('Prepared for', MARGIN + 8, 84);
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(safe(data.companyName, 'Client Assessment'), MARGIN + 8, 92);
  doc.setFontSize(8);
  doc.setTextColor(161, 161, 170);
  doc.text(`${safe(data.siteName, 'Site not specified')} | ${reportDate}`, PAGE_W - MARGIN - 8, 92, { align: 'right' });

  let y = 113;
  y = labelValue(doc, 'Assessment ID', data.diagnosisId, MARGIN, y, 80);
  labelValue(doc, 'Unit', `${data.brand} ${data.model} | ${data.category}`, 110, 113, 80);
  labelValue(doc, 'Current Battery', `${data.batteryType} | ${data.voltage} | ${data.capacity}`, MARGIN, 133, 80);
  labelValue(doc, 'Operation', `${data.shift} shift | ${data.operatingHoursPerDay} jam/hari | ${data.batteryAgeYears} tahun`, 110, 133, 80);

  const risk = data.healthScore <= 40 ? 'CRITICAL' : data.healthScore <= 65 ? 'BAD' : data.healthScore <= 80 ? 'CAUTION' : 'GOOD';
  metricCard(doc, MARGIN, 157, 40, 'Health Score', `${data.healthScore}%`, risk);
  metricCard(doc, MARGIN + 45, 157, 40, 'Urgency', data.urgency, 'Prioritas tindak lanjut');
  metricCard(doc, MARGIN + 90, 157, 40, 'Confidence', `${data.confidence}%`, 'Berdasarkan data tersedia');
  metricCard(doc, MARGIN + 135, 157, 39, 'Issues', `${data.issues.length}`, 'Masalah terindikasi');

  doc.setFillColor(255, 254, 240);
  doc.setDrawColor(...YELLOW);
  doc.roundedRect(MARGIN, 198, CONTENT_W, 44, 4, 4, 'FD');
  doc.setTextColor(...BLACK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('EXECUTIVE INTERPRETATION', MARGIN + 6, 210);
  const summary = data.aiSummary || `Health Score ${data.healthScore}% menunjukkan tingkat risiko ${risk.toLowerCase()} berdasarkan kombinasi umur battery, pola operasi, charging, downtime, watering, dan gejala yang dipilih.`;
  paragraph(doc, summary, MARGIN + 6, 219, CONTENT_W - 12, 9, BLACK, 4.8);

  doc.setFontSize(7);
  doc.setTextColor(...GREY);
  doc.text('Decision principle: evidence -> finding -> impact -> risk -> recommendation -> verification.', MARGIN, 255);
  doc.text('Report ini merupakan decision-support document, bukan sertifikasi ISO atau pengganti inspeksi teknis lapangan.', MARGIN, 261);

  // PAGE 2 - INPUT & EVIDENCE
  newPage(doc, 2, 'Assessment Inputs');
  y = title(doc, '01 / Evidence Base', 'Data Unit dan Kondisi Aktual');

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...LIGHT);
  doc.roundedRect(MARGIN, y, CONTENT_W, 61, 4, 4, 'FD');
  labelValue(doc, 'Brand / Model', `${data.brand} ${data.model}`, MARGIN + 6, y + 11, 78);
  labelValue(doc, 'Category', data.category, 110, y + 11, 78);
  labelValue(doc, 'Battery', `${data.batteryType} | ${data.voltage} | ${data.capacity}`, MARGIN + 6, y + 31, 78);
  labelValue(doc, 'Operation', `${data.shift} shift | ${data.operatingHoursPerDay} jam/hari`, 110, y + 31, 78);
  labelValue(doc, 'Battery Age', `${data.batteryAgeYears} tahun`, MARGIN + 6, y + 49, 78);
  labelValue(doc, 'Watering', `${data.wateringPerWeek}x per minggu`, 110, y + 49, 78);

  y += 76;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text('Masalah yang dilaporkan', MARGIN, y);
  y = bulletList(doc, data.issues, MARGIN, y + 9, 82, 10);

  let rightY = y - Math.min(55, data.issues.length * 5.8 + 9);
  const xRight = 110;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Detail operasional', xRight, rightY);
  const details = [
    `Battery cepat habis dalam 1 shift: ${yesNo(data.fastDrain)}`,
    `Charging lebih dari 8 jam: ${yesNo(data.longCharging)}`,
    `Downtime >2x per bulan: ${yesNo(data.frequentDowntime)}`,
    `Charger error code: ${yesNo(data.chargerError)}`,
    `Hydraulic lambat saat battery low: ${yesNo(data.hydraulicSlow)}`,
  ];
  bulletList(doc, details, xRight, rightY + 9, 80, 8);

  doc.setFillColor(...BLACK);
  doc.roundedRect(MARGIN, 226, CONTENT_W, 30, 4, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('TRACEABILITY NOTE', MARGIN + 6, 237);
  paragraph(doc, 'Seluruh kesimpulan pada report ini harus dapat ditelusuri kembali ke data form, Health Score, diagnostic rules, dan hasil verifikasi lapangan. Data yang belum tersedia tidak boleh diperlakukan sebagai fakta.', MARGIN + 6, 245, CONTENT_W - 12, 7.8, [212, 212, 216], 4.2);

  // PAGE 3 - HEALTH & ROOT CAUSE
  newPage(doc, 3, 'Health & Root Cause');
  y = title(doc, '02 / Technical Finding', 'Battery Health & Root Cause');

  const gaugeColor = riskColor(data.healthScore);
  doc.setDrawColor(244, 244, 245);
  doc.setLineWidth(10);
  doc.circle(55, 92, 28, 'S');
  doc.setDrawColor(...gaugeColor);
  doc.setLineWidth(10);
  const angle = Math.max(1, Math.min(359, data.healthScore * 3.59));
  const steps = 80;
  for (let i = 0; i < steps; i++) {
    const a1 = (-90 + (angle * i) / steps) * Math.PI / 180;
    const a2 = (-90 + (angle * (i + 1)) / steps) * Math.PI / 180;
    doc.line(55 + Math.cos(a1) * 28, 92 + Math.sin(a1) * 28, 55 + Math.cos(a2) * 28, 92 + Math.sin(a2) * 28);
  }
  doc.setLineWidth(0.2);
  doc.setTextColor(...BLACK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text(`${data.healthScore}%`, 55, 91, { align: 'center' });
  doc.setFontSize(7);
  doc.setTextColor(...gaugeColor);
  doc.text(risk, 55, 99, { align: 'center' });

  doc.setTextColor(...BLACK);
  doc.setFontSize(10);
  doc.text('Root Cause Ranking', 98, 62);
  const causes = data.causes.length ? data.causes.slice(0, 5) : [{ name: 'Belum tersedia', value: 0 }];
  causes.forEach((cause, index) => progressBar(doc, 98, 74 + index * 18, 80, cause.name, cause.value));

  doc.setFillColor(...BLACK);
  doc.roundedRect(MARGIN, 153, CONTENT_W, 45, 4, 4, 'F');
  doc.setTextColor(...YELLOW);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DRRKOBE INTERPRETATION', MARGIN + 6, 166);
  paragraph(doc, summary, MARGIN + 6, 175, CONTENT_W - 12, 8.5, [228, 228, 231], 4.6);

  doc.setTextColor(...BLACK);
  doc.setFontSize(10);
  doc.text('Technical findings', MARGIN, 215);
  bulletList(doc, data.technicalFindings || [], MARGIN, 224, CONTENT_W, 6);

  // PAGE 4 - OPERATIONAL IMPACT
  newPage(doc, 4, 'Operational Impact');
  y = title(doc, '03 / Operational Impact', 'Dampak Terhadap Operasi');
  metricCard(doc, MARGIN, y, 40, 'Downtime', `${data.downtimeHoursPerMonth} h/mo`, 'Perkiraan unplanned stop');
  metricCard(doc, MARGIN + 45, y, 40, 'Charging', `${data.chargingExposureHoursPerMonth} h/mo`, 'Non-productive exposure');
  metricCard(doc, MARGIN + 90, y, 40, 'Maintenance', `${data.maintenanceActionsPerYear}/yr`, 'Watering + routine checks');
  metricCard(doc, MARGIN + 135, y, 39, 'Productivity', `-${data.productivityLossPercent}%`, 'Vs available hours');

  y += 48;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text('Operational signal profile', MARGIN, y);

  const signalRows = [
    ['Battery endurance', data.fastDrain ? 82 : 30],
    ['Charging exposure', data.longCharging ? 78 : 28],
    ['Downtime risk', data.frequentDowntime ? 84 : 25],
    ['Watering burden', Math.min(100, data.wateringPerWeek * 22)],
    ['Electrical / hydraulic symptom', data.chargerError || data.hydraulicSlow ? 68 : 20],
  ] as const;
  signalRows.forEach(([label, value], index) => progressBar(doc, MARGIN, y + 12 + index * 18, CONTENT_W, label, value));

  doc.setFillColor(255, 254, 240);
  doc.setDrawColor(...YELLOW);
  doc.roundedRect(MARGIN, 202, CONTENT_W, 47, 4, 4, 'FD');
  doc.setTextColor(...BLACK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('MANAGEMENT VIEW', MARGIN + 6, 215);
  paragraph(doc, 'Dampak operasional tidak hanya dilihat sebagai masalah battery. Fokus manajemen adalah berapa lama unit tidak produktif, berapa sering aktivitas maintenance berulang, dan apakah pola charging mengurangi availability fleet.', MARGIN + 6, 224, CONTENT_W - 12, 8.5, BLACK, 4.6);

  // PAGE 5 - FINANCIAL IMPACT
  newPage(doc, 5, 'Financial Impact');
  y = title(doc, '04 / Financial Impact', 'Operational Cost Exposure');
  paragraph(doc, 'Nominal biaya di bawah hanya dihitung dari angka yang diisi oleh pengguna. BIP tidak mengisi biaya perusahaan dengan asumsi tersembunyi.', MARGIN, y, CONTENT_W, 8.5, GREY, 4.6);
  y += 16;

  if (monetaryInputsAvailable) {
    metricCard(doc, MARGIN, y, 54, 'Downtime / Month', rupiah(monthlyDowntimeCost), `${data.fleetSize} unit x ${data.downtimeHoursPerMonth} jam`);
    metricCard(doc, MARGIN + 60, y, 54, 'Maintenance / Month', rupiah(monthlyMaintenanceCost), 'Input biaya per unit');
    metricCard(doc, MARGIN + 120, y, 54, 'Charging / Month', rupiah(monthlyChargingCost), 'Input biaya per unit');

    y += 48;
    doc.setFillColor(...BLACK);
    doc.roundedRect(MARGIN, y, CONTENT_W, 50, 4, 4, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('ANNUAL OPERATING EXPOSURE', MARGIN + 7, y + 13);
    doc.setFontSize(22);
    doc.text(rupiah(annualOperatingExposure), MARGIN + 7, y + 27);
    doc.setTextColor(...YELLOW);
    doc.setFontSize(10);
    doc.text(`Scenario saving potential: ${rupiah(annualSavingScenario)} / year`, MARGIN + 7, y + 40);

    y += 66;
    doc.setFontSize(10);
    doc.setTextColor(...BLACK);
    doc.text('Calculation basis', MARGIN, y);
    const financeBasis = [
      `Downtime cost: ${rupiah(data.downtimeCostPerHour || 0)} per jam`,
      `Maintenance Lead Acid: ${rupiah(data.maintenanceCostPerUnitMonth || 0)} per unit per bulan`,
      `Charging / electricity: ${rupiah(data.chargingCostPerUnitMonth || 0)} per unit per bulan`,
      `Fleet size: ${data.fleetSize} unit`,
      `Scenario factors: downtime -${data.downtimeReductionPercent}%, maintenance -${data.maintenanceReductionPercent}%, energy +${data.energyEfficiencyPercent}%`,
    ];
    bulletList(doc, financeBasis, MARGIN, y + 9, CONTENT_W, 8);
  } else {
    doc.setFillColor(255, 254, 240);
    doc.setDrawColor(...YELLOW);
    doc.roundedRect(MARGIN, y, CONTENT_W, 70, 4, 4, 'FD');
    doc.setTextColor(...BLACK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Monetary cost belum dihitung', MARGIN + 8, y + 18);
    paragraph(doc, 'Biaya downtime per jam, biaya maintenance per unit, dan biaya charging per unit belum diisi. Report tetap menampilkan dampak operasional tanpa mengarang nilai rupiah.', MARGIN + 8, y + 30, CONTENT_W - 16, 9, BLACK, 5);
    paragraph(doc, 'Untuk financial business case yang lengkap, isi data biaya aktual perusahaan atau lanjutkan ke technical assessment.', MARGIN + 8, y + 53, CONTENT_W - 16, 8.5, GREY, 4.6);
  }

  doc.setFillColor(244, 244, 245);
  doc.roundedRect(MARGIN, 236, CONTENT_W, 23, 3, 3, 'F');
  doc.setTextColor(...GREY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.text('Commercial battery price is intentionally excluded from BIP. Investment and payback require a separate commercial proposal after technical validation.', MARGIN + 6, 250);

  // PAGE 6 - TECHNOLOGY COMPARISON
  newPage(doc, 6, 'Technology Comparison');
  y = title(doc, '05 / Technology Comparison', 'Lead Acid vs Lithium-ion');
  const rows = [
    ['Charging time', '8-12 jam + cooling', '1.5-2.5 jam, opportunity charge'],
    ['Cycle reference', '~1,200 cycles', '~3,000+ cycles'],
    ['Maintenance', 'Watering, equalizing, cleaning', 'Minimal routine maintenance'],
    ['Energy efficiency', '75-80%', '95%+'],
    ['Multi-shift availability', 'Terbatas oleh charging / cooling', 'Lebih fleksibel dengan opportunity charging'],
    ['Watering', 'Required', 'Not required'],
    ['Operational fit', 'Low-medium duty', 'Medium-high duty / multi-shift'],
  ];

  const col1 = 45;
  const col2 = 64;
  const col3 = CONTENT_W - col1 - col2;
  doc.setFillColor(...BLACK);
  doc.rect(MARGIN, y, CONTENT_W, 13, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('PARAMETER', MARGIN + 4, y + 8);
  doc.text('LEAD ACID (CURRENT)', MARGIN + col1 + 4, y + 8);
  doc.setFillColor(...YELLOW);
  doc.rect(MARGIN + col1 + col2, y, col3, 13, 'F');
  doc.setTextColor(...BLACK);
  doc.text('LITHIUM-ION (TARGET)', MARGIN + col1 + col2 + 4, y + 8);

  let ty = y + 13;
  rows.forEach((row, index) => {
    const rowH = 22;
    doc.setFillColor(index % 2 ? 252 : 255, index % 2 ? 252 : 255, index % 2 ? 249 : 255);
    doc.setDrawColor(...LIGHT);
    doc.rect(MARGIN, ty, CONTENT_W, rowH, 'FD');
    doc.setFillColor(255, 254, 240);
    doc.rect(MARGIN + col1 + col2, ty, col3, rowH, 'F');

    doc.setTextColor(...BLACK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.text(doc.splitTextToSize(row[0], col1 - 8) as string[], MARGIN + 4, ty + 7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GREY);
    doc.text(doc.splitTextToSize(row[1], col2 - 8) as string[], MARGIN + col1 + 4, ty + 7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BLACK);
    doc.text(doc.splitTextToSize(row[2], col3 - 8) as string[], MARGIN + col1 + col2 + 4, ty + 7);
    ty += rowH;
  });

  paragraph(doc, 'Comparison values are decision-support references and must be confirmed against the selected battery, charger, forklift model, duty cycle, ambient temperature, and manufacturer specification.', MARGIN, 254, CONTENT_W, 7.2, GREY, 4);

  // PAGE 7 - ROI / DECISION SUPPORT
  newPage(doc, 7, 'ROI & Decision Support');
  y = title(doc, '06 / Business Case', 'Efficiency Scenario & Decision Support');
  metricCard(doc, MARGIN, y, 40, 'Fleet', `${data.fleetSize} unit`, `${data.simulationHoursPerDay} jam/hari`);
  metricCard(doc, MARGIN + 45, y, 40, 'Downtime', `-${data.downtimeReductionPercent}%`, 'Scenario indicator', true);
  metricCard(doc, MARGIN + 90, y, 40, 'Energy', `+${data.energyEfficiencyPercent}%`, 'Scenario indicator');
  metricCard(doc, MARGIN + 135, y, 39, 'Maintenance', `-${data.maintenanceReductionPercent}%`, 'Scenario indicator');

  y += 48;
  doc.setFillColor(...BLACK);
  doc.roundedRect(MARGIN, y, CONTENT_W, 52, 4, 4, 'F');
  doc.setTextColor(...YELLOW);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('OPERATIONAL FIT INDICATOR', MARGIN + 7, y + 14);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text(data.operationalFit.toUpperCase(), MARGIN + 7, y + 29);
  doc.setFontSize(8);
  doc.setTextColor(161, 161, 170);
  doc.text(`${data.simulationShift} shift | ${data.simulationHoursPerDay} jam/hari | ${data.fleetSize} unit`, MARGIN + 7, y + 41);

  y += 69;
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text('What this means for management', MARGIN, y);
  const managementPoints = [
    'Semakin tinggi shift dan jam operasi, semakin penting availability battery dan charging window.',
    'Operational saving harus dipisahkan dari harga pembelian battery agar keputusan tidak bias terhadap harga awal.',
    monetaryInputsAvailable ? `Scenario annual saving potential dari input biaya pengguna: ${rupiah(annualSavingScenario)}.` : 'Nominal saving belum dihitung karena cost rate perusahaan belum diisi.',
    'Commercial payback period tidak dihitung sebelum harga investasi dan scope engineering tervalidasi.',
  ];
  bulletList(doc, managementPoints, MARGIN, y + 10, CONTENT_W, 6);

  doc.setFillColor(255, 254, 240);
  doc.setDrawColor(...YELLOW);
  doc.roundedRect(MARGIN, 222, CONTENT_W, 35, 4, 4, 'FD');
  doc.setTextColor(...BLACK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DECISION GATE', MARGIN + 6, 234);
  paragraph(doc, data.healthScore <= 65 ? 'Proceed to technical assessment for lithium-ion migration feasibility. Do not issue final investment decision before on-site verification.' : 'Maintain / optimize current battery while completing technical verification before considering technology migration.', MARGIN + 6, 243, CONTENT_W - 12, 8.2, BLACK, 4.5);

  // PAGE 8 - RECOMMENDATION / VERIFICATION
  newPage(doc, 8, 'Recommendation & Verification');
  y = title(doc, '07 / Recommendation', 'Next Action & Verification Checklist');
  doc.setFillColor(...BLACK);
  doc.roundedRect(MARGIN, y, CONTENT_W, 43, 4, 4, 'F');
  doc.setTextColor(...YELLOW);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('DRRKOBE RECOMMENDATION', MARGIN + 7, y + 13);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(data.healthScore <= 65 ? 'TECHNICAL ASSESSMENT REQUIRED' : 'MONITOR & VERIFY', MARGIN + 7, y + 27);
  doc.setFontSize(7.5);
  doc.setTextColor(161, 161, 170);
  doc.text(`Health ${data.healthScore}% | Urgency ${data.urgency} | Confidence ${data.confidence}%`, MARGIN + 7, y + 37);

  y += 57;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text('Priority actions', MARGIN, y);
  y = bulletList(doc, data.recommendedActions || [], MARGIN, y + 9, CONTENT_W, 6);

  y = Math.max(y + 4, 159);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Verification checklist before commercial proposal', MARGIN, y);
  const checklist = [
    'Measure actual battery capacity / discharge performance.',
    'Inspect cell voltage balance, connector, cable, and terminal condition.',
    'Verify charger output, compatibility, error history, and charging window.',
    'Confirm battery compartment dimension, weight, connector, and electrical interface.',
    'Confirm duty cycle, shift pattern, break time, ambient temperature, and operator charging practice.',
    'Validate forklift manufacturer requirements and selected battery / charger specification.',
    'Review safety requirements, handling procedure, emergency response, and site charging infrastructure.',
    'Only after technical validation: request commercial proposal and calculate investment payback.',
  ];
  bulletList(doc, checklist, MARGIN, y + 10, CONTENT_W, 8);

  doc.setFillColor(244, 244, 245);
  doc.roundedRect(MARGIN, 248, CONTENT_W, 18, 3, 3, 'F');
  doc.setTextColor(...GREY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Disclaimer: report ini adalah decision-support assessment berdasarkan data pengguna dan engine DRRKOBE. Bukan sertifikat ISO, warranty, statutory inspection, atau pengganti pengukuran teknis aktual.', MARGIN + 5, 258);

  const filename = `DRRKOBE_Assessment_${filenamePart(data.companyName || data.brand)}_${filenamePart(data.model)}_${filenamePart(data.diagnosisId.slice(0, 8))}.pdf`;
  doc.save(filename);
}
