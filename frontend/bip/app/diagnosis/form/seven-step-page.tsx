'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { downloadAssessmentPdf } from '../../../lib/generate-assessment-pdf';

const API_BASE = 'https://api.drrkobe.com/api/v1';
const WHATSAPP_NUMBER = '6285133331476';
const TOTAL_STEPS = 7;

type Brand = { id: string; name: string; slug: string };
type ForkliftModel = {
  id: string;
  brand_id: string;
  name: string;
  model_code: string | null;
  category: string | null;
  capacity_kg: number | null;
  battery_voltage: number | null;
  battery_capacity_ah: number | null;
};
type Cause = { name?: string; prob?: number };
type DiagnosisResponse = {
  diagnosis_id: string;
  health_score: number;
  category: string;
  urgency: string;
  confidence: number;
  recommendation: string;
  causes: Cause[];
};
type AiStatus = 'pending' | 'processing' | 'completed' | 'failed';
type AiResult = {
  status: AiStatus;
  analyzed: boolean;
  attempts: number;
  max_attempts: number;
  retryable: boolean;
  message: string;
  summary: string | null;
  probable_causes: Array<{ cause: string; confidence: number; reason: string }>;
  technical_findings: string[];
  recommended_actions: string[];
  limitations: string[];
  urgency: string | null;
  confidence: number | null;
};
type FinancialMode = 'unknown' | 'partial' | 'full';
type FastDrainDuration = 'under_4' | 'four_to_six' | 'six_to_eight' | 'over_eight' | 'unknown';
type ChargingDuration = 'under_6' | 'six_to_eight' | 'eight_to_ten' | 'over_ten' | 'unknown';
type WateringFrequency = 'never' | 'less_than_weekly' | 'once_weekly' | 'twice_weekly' | 'more_than_twice' | 'unknown';
type DowntimeFrequency = 'never' | 'once_twice' | 'three_four' | 'five_plus' | 'unknown';
type HydraulicFrequency = 'never' | 'sometimes' | 'often' | 'unknown';
type IndustrySector = 'food_beverage' | 'pharma_medical_cosmetics' | 'logistics_3pl_ecommerce' | 'cold_storage' | 'electronics_automotive' | 'textile_office_paper' | 'retail_wholesale';
type DetailOption<T extends string> = { value: T; label: string; note?: string };

const industrySectors: Array<{ value: IndustrySector; label: string }> = [
  { value: 'food_beverage', label: 'Industri Makanan dan Minuman (FMCG / Food & Beverage)' },
  { value: 'pharma_medical_cosmetics', label: 'Industri Farmasi, Medis, dan Kosmetik' },
  { value: 'logistics_3pl_ecommerce', label: 'Penyedia Logistik Pihak Ketiga (3PL) & Gudang E-Commerce' },
  { value: 'cold_storage', label: 'Gudang Pendingin (Cold Storage)' },
  { value: 'electronics_automotive', label: 'Manufaktur Elektronik dan Komponen Otomotif' },
  { value: 'textile_office_paper', label: 'Industri Tekstil dan Perkantoran / Percetakan Kertas' },
  { value: 'retail_wholesale', label: 'Ritel Besar dan Pusat Grosir (Hypermarket / Supermarket)' },
];

const issues = [
  ['battery_fast', 'Battery Tidak Bertahan Sampai Akhir Shift', 'Daya turun lebih cepat dari kebutuhan kerja normal.'],
  ['charging_long', 'Pengisian Battery Terlalu Lama', 'Battery membutuhkan charging window panjang sebelum siap digunakan kembali.'],
  ['downtime', 'Forklift Sering Berhenti Karena Battery / Proses Pengisian', 'Operasi terganggu karena daya battery atau proses pengisian.'],
  ['maintenance', 'Perawatan Battery Terasa Terlalu Sering', 'Isi air, pembersihan, atau pemeriksaan menyita waktu kerja.'],
  ['productivity', 'Produktivitas Forklift Menurun', 'Kecepatan kerja atau kesiapan unit berkurang dibanding kondisi normal.'],
  ['electrical', 'Ada Kode Gangguan Kelistrikan Pada Unit', 'Kode gangguan muncul pada display forklift dan perlu diverifikasi terpisah.'],
  ['hydraulic', 'Gerakan Angkat Melambat Saat Battery Lemah', 'Fungsi angkat terasa lebih lambat ketika daya battery turun.'],
  ['drive', 'Tarikan / Steering Terasa Tidak Normal', 'Akselerasi, tarikan, atau steering terasa berbeda dari kondisi normal.'],
  ['overheat', 'Battery / Motor Terasa Terlalu Panas', 'Temperatur terasa lebih tinggi dari biasanya saat unit bekerja.'],
  ['watering', 'Isi Air Battery Terlalu Sering', 'Kebutuhan isi air meningkat dan menambah pekerjaan perawatan.'],
] as const;

const fastDrainOptions: DetailOption<FastDrainDuration>[] = [
  { value: 'under_4', label: '< 4 jam', note: 'Daya turun sangat cepat.' },
  { value: 'four_to_six', label: '4–6 jam', note: 'Belum mencapai satu shift penuh.' },
  { value: 'six_to_eight', label: '6–8 jam', note: 'Mendekati satu shift.' },
  { value: 'over_eight', label: '> 8 jam', note: 'Mampu melewati satu shift normal.' },
  { value: 'unknown', label: 'Tidak tahu', note: 'Tidak ada data yang cukup.' },
];

const chargingDurationOptions: DetailOption<ChargingDuration>[] = [
  { value: 'under_6', label: '< 6 jam' },
  { value: 'six_to_eight', label: '6–8 jam' },
  { value: 'eight_to_ten', label: '8–10 jam' },
  { value: 'over_ten', label: '> 10 jam' },
  { value: 'unknown', label: 'Tidak tahu' },
];

const wateringOptions: DetailOption<WateringFrequency>[] = [
  { value: 'never', label: 'Tidak pernah' },
  { value: 'less_than_weekly', label: '< 1x / minggu' },
  { value: 'once_weekly', label: '1x / minggu' },
  { value: 'twice_weekly', label: '2x / minggu' },
  { value: 'more_than_twice', label: '> 2x / minggu' },
  { value: 'unknown', label: 'Tidak tahu' },
];

const downtimeOptions: DetailOption<DowntimeFrequency>[] = [
  { value: 'never', label: 'Tidak pernah' },
  { value: 'once_twice', label: '1–2x / bulan' },
  { value: 'three_four', label: '3–4x / bulan' },
  { value: 'five_plus', label: '≥ 5x / bulan' },
  { value: 'unknown', label: 'Tidak tahu' },
];

const hydraulicOptions: DetailOption<HydraulicFrequency>[] = [
  { value: 'never', label: 'Tidak' },
  { value: 'sometimes', label: 'Kadang-kadang' },
  { value: 'often', label: 'Sering' },
  { value: 'unknown', label: 'Tidak tahu' },
];

const comparisonRows = [
  ['Charging Time', '8–12 jam + cooling', '1.5–2.5 jam, opportunity charge'],
  ['Lifespan (cycles)', '~1,200 cycles', '~3,000+ cycles'],
  ['Maintenance', 'Isi air, equalizing, cleaning', 'Minimal routine maintenance'],
  ['Energy Efficiency', '75–80%', '95%+'],
  ['Downtime Risk', 'Tinggi pada operasi multi-shift', 'Lebih rendah dengan opportunity charging'],
  ['Opportunity Charging', 'Tidak direkomendasikan', 'Dapat dilakukan saat break'],
  ['Safety / Emission', 'Gas H2, acid handling', 'Sealed, no watering'],
];

function optionLabel<T extends string>(options: DetailOption<T>[], value: T): string {
  return options.find((option) => option.value === value)?.label ?? 'Tidak tahu';
}

export default function SevenStepDiagnosisPage() {
  const [step, setStep] = useState(1);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<ForkliftModel[]>([]);
  const [industrySector, setIndustrySector] = useState<IndustrySector | ''>('');
  const [brandId, setBrandId] = useState('');
  const [modelId, setModelId] = useState('');
  const [shift, setShift] = useState(2);
  const [jamOperasi, setJamOperasi] = useState(16);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [umur, setUmur] = useState(4);
  const [fastDrainDuration, setFastDrainDuration] = useState<FastDrainDuration>('unknown');
  const [chargingDuration, setChargingDuration] = useState<ChargingDuration>('unknown');
  const [wateringFrequency, setWateringFrequency] = useState<WateringFrequency>('unknown');
  const [downtimeFrequency, setDowntimeFrequency] = useState<DowntimeFrequency>('unknown');
  const [hydraulicFrequency, setHydraulicFrequency] = useState<HydraulicFrequency>('unknown');
  const [jumlahForklift, setJumlahForklift] = useState(5);
  const [roiJamOperasi, setRoiJamOperasi] = useState(16);
  const [roiShift, setRoiShift] = useState(2);
  const [companyName, setCompanyName] = useState('');
  const [siteName, setSiteName] = useState('');
  const [userName, setUserName] = useState('');
  const [userWhatsapp, setUserWhatsapp] = useState('');
  const [leadId, setLeadId] = useState<string | null>(null);
  const [leadSaving, setLeadSaving] = useState(false);
  const [financialMode, setFinancialMode] = useState<FinancialMode>('unknown');
  const [downtimeCostPerHour, setDowntimeCostPerHour] = useState(0);
  const [maintenanceCostPerUnitMonth, setMaintenanceCostPerUnitMonth] = useState(0);
  const [loadingModels, setLoadingModels] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [aiRetrying, setAiRetrying] = useState(false);
  const [error, setError] = useState('');
  const [diagnosis, setDiagnosis] = useState<DiagnosisResponse | null>(null);
  const [diagnosisId, setDiagnosisId] = useState<string | null>(null);
  const [ai, setAi] = useState<AiResult | null>(null);
  const aiRequested = useRef(false);

  const selectedModel = useMemo(() => models.find((item) => item.id === modelId) ?? null, [models, modelId]);
  const selectedBrand = useMemo(() => brands.find((item) => item.id === brandId) ?? null, [brands, brandId]);
  const selectedIndustrySector = useMemo(() => industrySectors.find((item) => item.value === industrySector)?.label ?? '-', [industrySector]);
  const selectedIssueLabels = useMemo(
    () => issues.filter(([key]) => selectedIssues.includes(key)).map(([, label]) => label),
    [selectedIssues],
  );

  const cepatHabis: boolean | null = fastDrainDuration === 'unknown' ? null : fastDrainDuration === 'under_4';
  const chargingLama: boolean | null = chargingDuration === 'unknown'
    ? null
    : chargingDuration === 'eight_to_ten' || chargingDuration === 'over_ten';
  const isiAir: number | null = wateringFrequency === 'unknown'
    ? null
    : wateringFrequency === 'never' || wateringFrequency === 'less_than_weekly'
      ? 0
      : wateringFrequency === 'once_weekly'
        ? 1
        : wateringFrequency === 'twice_weekly'
          ? 2
          : 3;
  const downtime: boolean | null = downtimeFrequency === 'unknown'
    ? null
    : downtimeFrequency === 'three_four' || downtimeFrequency === 'five_plus';
  const hydraulicLambat: boolean | null = hydraulicFrequency === 'unknown'
    ? null
    : hydraulicFrequency === 'sometimes' || hydraulicFrequency === 'often';

  useEffect(() => {
    fetch(`${API_BASE}/master/brands`, { headers: { Accept: 'application/json' } })
      .then(async (response) => {
        if (!response.ok) throw new Error('Gagal mengambil master brand.');
        return response.json();
      })
      .then((payload) => setBrands(payload.data ?? []))
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!brandId) {
      setModels([]);
      setModelId('');
      return;
    }

    setLoadingModels(true);
    fetch(`${API_BASE}/master/forklift-models?brand_id=${encodeURIComponent(brandId)}`, {
      headers: { Accept: 'application/json' },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Gagal mengambil model forklift.');
        return response.json();
      })
      .then((payload) => {
        setModels(payload.data ?? []);
        setModelId('');
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoadingModels(false));
  }, [brandId]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  useEffect(() => {
    if (!diagnosisId || aiRequested.current) return;

    aiRequested.current = true;
    let stopped = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const refreshStatus = async () => {
      try {
        const response = await fetch(`${API_BASE}/ai/diagnosis/${diagnosisId}/status`, { headers: { Accept: 'application/json' } });
        if (!response.ok) return;
        const payload = await response.json();
        if (stopped || !payload?.ai) return;
        const nextAi = payload.ai as AiResult;
        setAi(nextAi);
        if ((nextAi.status === 'completed' || nextAi.status === 'failed') && timer) {
          clearInterval(timer);
          timer = null;
        }
      } catch {
        // Analisis tambahan tidak memblokir hasil utama.
      }
    };

    const startAnalysis = async () => {
      try {
        await fetch(`${API_BASE}/ai/diagnosis/${diagnosisId}/analyze`, { method: 'POST', headers: { Accept: 'application/json' } });
      } finally {
        void refreshStatus();
      }
    };

    void refreshStatus();
    void startAnalysis();
    timer = setInterval(refreshStatus, 2500);

    return () => {
      stopped = true;
      if (timer) clearInterval(timer);
    };
  }, [diagnosisId]);

  function setPrimaryShift(nextShift: number) {
    const previousDefaultHours = Math.min(24, shift * 8);
    setShift(nextShift);
    setRoiShift(nextShift);
    if (jamOperasi === previousDefaultHours) {
      const nextHours = Math.min(24, nextShift * 8);
      setJamOperasi(nextHours);
      setRoiJamOperasi(nextHours);
    }
  }

  function setPrimaryOperatingHours(hours: number) {
    setJamOperasi(hours);
    setRoiJamOperasi(hours);
  }

  function goNext() {
    setError('');
    if (step === 1 && !industrySector) return setError('Pilih bidang industri terlebih dahulu.');
    if (step === 1 && !modelId) return setError('Pilih brand dan model forklift terlebih dahulu.');
    if (step === 2 && selectedIssues.length === 0) return setError('Pilih minimal satu masalah yang benar-benar terjadi.');
    setStep((current) => Math.min(TOTAL_STEPS, current + 1));
  }

  function goBack() {
    setError('');
    setStep((current) => Math.max(1, current - 1));
  }

  function toggleIssue(key: string) {
    setSelectedIssues((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  }

  function chooseFinancialMode(mode: FinancialMode) {
    setFinancialMode(mode);
    if (mode === 'unknown') {
      setDowntimeCostPerHour(0);
      setMaintenanceCostPerUnitMonth(0);
    }
    if (mode === 'partial') setMaintenanceCostPerUnitMonth(0);
  }

  async function retryAiAnalysis() {
    if (!diagnosisId || aiRetrying || !ai?.retryable) return;
    setAiRetrying(true);
    try {
      await fetch(`${API_BASE}/ai/diagnosis/${diagnosisId}/analyze`, { method: 'POST', headers: { Accept: 'application/json' } });
      const response = await fetch(`${API_BASE}/ai/diagnosis/${diagnosisId}/status`, { headers: { Accept: 'application/json' } });
      if (response.ok) {
        const payload = await response.json();
        if (payload?.ai) setAi(payload.ai as AiResult);
      }
    } catch {
      // Hasil utama tetap tersedia.
    } finally {
      setAiRetrying(false);
    }
  }

  async function createDiagnosis() {
    if (!modelId || !industrySector || selectedIssues.length === 0) return;
    setProcessing(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/diagnose`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: crypto.randomUUID(),
          model_id: modelId,
          battery_type: 'lead_acid',
          umur,
          shift,
          jam_operasi: jamOperasi,
          answers: {
            industry_sector: industrySector,
            fast_drain_duration: fastDrainDuration,
            charging_duration: chargingDuration,
            watering_frequency: wateringFrequency,
            downtime_frequency: downtimeFrequency,
            hydraulic_when_low: hydraulicFrequency,
            cepat_habis: cepatHabis,
            charging_lama: chargingLama,
            isi_air: isiAir,
            downtime,
            hydraulic_lambat: hydraulicLambat,
            issues: selectedIssueLabels,
          },
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.diagnosis_id) throw new Error(payload.message ?? 'Diagnosis gagal diproses.');
      aiRequested.current = false;
      setAi(null);
      setDiagnosis(payload as DiagnosisResponse);
      setDiagnosisId(payload.diagnosis_id);
      setLeadId(null);
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Diagnosis gagal diproses.');
    } finally {
      setProcessing(false);
    }
  }

  async function saveLeadAndContinue() {
    if (!diagnosisId) return;
    setError('');
    if (!companyName.trim() || !siteName.trim() || !userName.trim() || !userWhatsapp.trim()) {
      setError('Lengkapi PT, lokasi, nama user, dan nomor WhatsApp sebelum melihat rekomendasi final.');
      return;
    }

    setLeadSaving(true);
    try {
      const response = await fetch(`${API_BASE}/leads`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnosis_id: diagnosisId,
          perusahaan: companyName.trim(),
          lokasi: siteName.trim(),
          nama: userName.trim(),
          whatsapp: userWhatsapp.trim(),
          jumlah_forklift: jumlahForklift,
          source: 'bip',
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message ?? 'Data assessment gagal disimpan.');
      setLeadId(payload.lead_id ?? null);
      setStep(7);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Data assessment gagal disimpan.');
    } finally {
      setLeadSaving(false);
    }
  }

  function resetFlow() {
    setStep(1);
    setIndustrySector('');
    setBrandId('');
    setModelId('');
    setShift(2);
    setJamOperasi(16);
    setRoiShift(2);
    setRoiJamOperasi(16);
    setSelectedIssues([]);
    setUmur(4);
    setFastDrainDuration('unknown');
    setChargingDuration('unknown');
    setWateringFrequency('unknown');
    setDowntimeFrequency('unknown');
    setHydraulicFrequency('unknown');
    setDiagnosis(null);
    setDiagnosisId(null);
    setAi(null);
    setCompanyName('');
    setSiteName('');
    setUserName('');
    setUserWhatsapp('');
    setLeadId(null);
    setLeadSaving(false);
    setFinancialMode('unknown');
    setDowntimeCostPerHour(0);
    setMaintenanceCostPerUnitMonth(0);
    setAiRetrying(false);
    aiRequested.current = false;
  }

  const health = diagnosis?.health_score ?? 0;
  const confidence = ai?.confidence ?? diagnosis?.confidence ?? 0;
  const urgency = ai?.urgency ?? diagnosis?.urgency ?? '-';
  const causeRows = (ai?.probable_causes?.length
    ? ai.probable_causes.map((item) => ({ name: item.cause, value: Number(item.confidence) || 0, reason: item.reason }))
    : (diagnosis?.causes ?? []).map((item) => ({ name: item.name ?? 'Diagnostic signal', value: Number(item.prob) || 0, reason: '' }))
  ).slice(0, 4);

  const downtimeHours = Math.round(((umur * 1.5 + shift * 2) * 1.2) * 10) / 10;
  const chargingWaste = chargingLama === true ? Math.max(0, (8 - 2) * 26) : 0;
  const maintenanceYear = isiAir === null ? 0 : isiAir * 52 + 12;
  const operationalHoursMonth = Math.max(1, jamOperasi * 26);
  const productivityLoss = Math.min(100, Math.round((downtimeHours / operationalHoursMonth) * 100));
  const roiDowntime = roiShift >= 3 ? 75 : roiShift >= 2 ? 70 : 65;
  const operationalFit = roiJamOperasi >= 16 && roiShift >= 2 ? 'Tinggi' : 'Sedang';

  const monthlyDowntimeCost = downtimeCostPerHour * downtimeHours * jumlahForklift;
  const monthlyMaintenanceCost = maintenanceCostPerUnitMonth * jumlahForklift;
  const annualOperatingExposure = (monthlyDowntimeCost + monthlyMaintenanceCost) * 12;
  const annualSavingScenario = (monthlyDowntimeCost * (roiDowntime / 100) + monthlyMaintenanceCost * 0.9) * 12;
  const hasFinancialInputs = financialMode !== 'unknown' && annualOperatingExposure > 0;

  const rootCauseText = causeRows.length
    ? causeRows.slice(0, 3).map((cause, index) => `${index + 1}. ${cause.name} (${cause.value}%)`).join('\n')
    : '- Belum tersedia';
  const issueText = selectedIssueLabels.length
    ? selectedIssueLabels.map((label, index) => `${index + 1}. ${label}`).join('\n')
    : '- Tidak ada';

  const whatsappMessage = [
    'Halo tim DRRKOBE,',
    '',
    'Saya sudah menyelesaikan diagnosis di DRRKOBE Battery Intelligence Platform dan ingin mengajukan Technical Assessment.',
    '',
    '*DATA KONTAK*',
    `Perusahaan: ${companyName || '-'}`,
    `Lokasi/site: ${siteName || '-'}`,
    `Nama: ${userName || '-'}`,
    `WhatsApp: ${userWhatsapp || '-'}`,
    ...(leadId ? [`Lead ID: ${leadId}`] : []),
    '',
    '*DATA UNIT & OPERATION CONTEXT*',
    `Bidang industri: ${selectedIndustrySector}`,
    `Brand: ${selectedBrand?.name || '-'}`,
    `Model: ${selectedModel?.model_code || selectedModel?.name || '-'}`,
    `Battery: Lead Acid`,
    `Umur battery: ${umur} tahun`,
    `Operasional: ${shift} shift / ${jamOperasi} jam per hari`,
    '',
    '*MASALAH YANG DIALAMI*',
    issueText,
    '',
    '*DETAIL KONDISI*',
    `Daya battery bertahan: ${optionLabel(fastDrainOptions, fastDrainDuration)}`,
    `Durasi pengisian: ${optionLabel(chargingDurationOptions, chargingDuration)}`,
    `Pemeriksaan / isi air: ${optionLabel(wateringOptions, wateringFrequency)}`,
    `Unit berhenti karena battery/proses pengisian: ${optionLabel(downtimeOptions, downtimeFrequency)}`,
    `Gerakan angkat saat daya rendah: ${optionLabel(hydraulicOptions, hydraulicFrequency)}`,
    '',
    '*HASIL DRRKOBE BIP*',
    `Skor kondisi battery: ${health}%`,
    `Kategori: ${diagnosis?.category || '-'}`,
    `Urgensi: ${urgency}`,
    `Tingkat keyakinan: ${confidence}%`,
    `Diagnosis ID: ${diagnosisId || '-'}`,
    '',
    '*INDIKASI PENYEBAB UTAMA*',
    rootCauseText,
    '',
    '*EVALUASI OPERASIONAL*',
    `Jumlah forklift: ${jumlahForklift} unit`,
    `Jam operasi: ${roiJamOperasi} jam/hari`,
    `Shift: ${roiShift} shift`,
    ...(hasFinancialInputs
      ? ['', '*DATA BIAYA YANG TERSEDIA*', `Biaya downtime: ${formatRupiah(downtimeCostPerHour)} / jam`, ...(financialMode === 'full' ? [`Maintenance Lead Acid: ${formatRupiah(maintenanceCostPerUnitMonth)} / unit / bulan`] : []), `Operating exposure teridentifikasi: ${formatRupiah(annualOperatingExposure)} / tahun`]
      : ['', '*STATUS FINANSIAL*', 'Menunggu validasi data biaya perusahaan. Tidak ada asumsi nominal charging/listrik.']),
    '',
    'Mohon dilanjutkan ke Technical Assessment. Proposal teknis dan harga final dibahas setelah kondisi aktual serta kompatibilitas unit tervalidasi.',
  ].join('\n');
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;

  function handleDownloadReport() {
    if (!diagnosis || !diagnosisId) return;
    downloadAssessmentPdf({
      diagnosisId,
      companyName,
      siteName,
      brand: selectedBrand?.name || '-',
      model: selectedModel?.model_code || selectedModel?.name || '-',
      category: selectedModel?.category || '-',
      batteryType: 'Lead Acid',
      voltage: selectedModel?.battery_voltage ? `${selectedModel.battery_voltage} V` : '-',
      capacity: selectedModel?.battery_capacity_ah ? `${selectedModel.battery_capacity_ah} Ah` : '-',
      batteryAgeYears: umur,
      shift,
      operatingHoursPerDay: jamOperasi,
      wateringPerWeek: isiAir ?? 0,
      fastDrain: cepatHabis === true,
      longCharging: chargingLama === true,
      frequentDowntime: downtime === true,
      chargerError: false,
      hydraulicSlow: hydraulicLambat === true,
      fastDrainDetail: optionLabel(fastDrainOptions, fastDrainDuration),
      chargingDurationDetail: optionLabel(chargingDurationOptions, chargingDuration),
      wateringFrequencyDetail: optionLabel(wateringOptions, wateringFrequency),
      downtimeFrequencyDetail: optionLabel(downtimeOptions, downtimeFrequency),
      hydraulicDetail: optionLabel(hydraulicOptions, hydraulicFrequency),
      issues: selectedIssueLabels,
      healthScore: health,
      healthCategory: diagnosis.category,
      urgency,
      confidence,
      causes: causeRows,
      aiSummary: ai?.summary,
      technicalFindings: ai?.technical_findings || [],
      recommendedActions: ai?.recommended_actions || [],
      downtimeHoursPerMonth: downtimeHours,
      chargingExposureHoursPerMonth: chargingWaste,
      maintenanceActionsPerYear: maintenanceYear,
      productivityLossPercent: productivityLoss,
      fleetSize: jumlahForklift,
      simulationHoursPerDay: roiJamOperasi,
      simulationShift: roiShift,
      downtimeReductionPercent: roiDowntime,
      energyEfficiencyPercent: 28,
      maintenanceReductionPercent: 90,
      operationalFit,
      downtimeCostPerHour,
      maintenanceCostPerUnitMonth,
      chargingCostPerUnitMonth: 0,
    });
  }

  return (
    <main className="min-h-screen bg-[#FCFCF9] text-[#0A0A0A]">
      <Progress step={step} />
      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {step === 1 && (
          <StepFrame eyebrow="STEP 1 / 7 — UNIT & OPERATION CONTEXT" title="Pilih Bidang Industri & Model Forklift">
            <div className="grid gap-5 lg:grid-cols-[.86fr_1.14fr]">
              <Panel>
                <Label>Bidang Industri</Label>
                <select value={industrySector} onChange={(e) => setIndustrySector(e.target.value as IndustrySector | '')} className="drr-input">
                  <option value="">Pilih bidang industri</option>
                  {industrySectors.map((sector) => <option key={sector.value} value={sector.value}>{sector.label}</option>)}
                </select>
                <div className="mt-6"><Label>Brand</Label><select value={brandId} onChange={(e) => setBrandId(e.target.value)} className="drr-input"><option value="">Pilih brand</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></div>
                <div className="mt-6"><Label>Model Forklift</Label><select value={modelId} onChange={(e) => setModelId(e.target.value)} disabled={!brandId || loadingModels} className="drr-input disabled:bg-zinc-100"><option value="">{loadingModels ? 'Memuat model...' : 'Pilih model'}</option>{models.map((model) => <option key={model.id} value={model.id}>{model.model_code || model.name} — {model.name}</option>)}</select></div>
              </Panel>

              <div className="rounded-[24px] bg-[#0A0A0A] p-7 text-white">
                <Mono className="text-zinc-400">DRRKOBE OPERATION CONTEXT</Mono>
                <div className="mt-5 flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-3xl font-black tracking-tight">{selectedModel?.model_code || selectedModel?.name || 'Pilih model forklift'}</h2><p className="mt-2 text-sm text-zinc-400">{selectedBrand?.name || 'Model, jam operasi, dan shift dipilih dalam satu layar.'}</p></div><span className="rounded-full bg-[#FFCC00] px-3 py-2 text-xs font-black text-black">LEAD ACID</span></div>
                <div className="mt-5 grid grid-cols-2 gap-3"><Metric label="Category" value={selectedModel?.category || '-'} dark /><Metric label="Capacity" value={selectedModel?.capacity_kg ? `${selectedModel.capacity_kg} kg` : '-'} dark /><Metric label="Voltage" value={selectedModel?.battery_voltage ? `${selectedModel.battery_voltage} V` : '-'} dark /><Metric label="Battery" value={selectedModel?.battery_capacity_ah ? `${selectedModel.battery_capacity_ah} Ah` : '-'} dark /></div>

                <div className="mt-6 border-t border-white/10 pt-5">
                  <div className="text-xs font-black uppercase tracking-[.12em] text-zinc-400">Shift Operasional</div>
                  <div className="mt-3 flex gap-2">{[1, 2, 3].map((value) => <button key={value} type="button" onClick={() => setPrimaryShift(value)} className={`flex-1 rounded-full px-3 py-3 text-xs font-black ${shift === value ? 'bg-[#FFCC00] text-black' : 'border border-white/15 bg-white/[0.05] text-white'}`}>{value} Shift</button>)}</div>
                  <div className="mt-6"><div className="flex items-center justify-between gap-4"><span className="text-xs font-black uppercase tracking-[.12em] text-zinc-400">Jam Operasi / Hari</span><strong className="text-lg text-[#FFCC00]">{jamOperasi} jam</strong></div><input aria-label="Jam operasi per hari" className="mt-4 w-full accent-[#FFCC00]" type="range" min={4} max={24} step={1} value={jamOperasi} onChange={(e) => setPrimaryOperatingHours(Number(e.target.value))} /><div className="mt-1 flex justify-between text-[10px] text-zinc-500"><span>4 jam</span><span>24 jam</span></div></div>
                  <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.06] p-4 text-xs leading-5 text-zinc-300"><b className="text-white">Operation profile:</b> {shift} shift • {jamOperasi} jam/hari • {selectedIndustrySector}</div>
                </div>
              </div>
            </div>
            <Nav error={error} onNext={goNext} nextLabel="Pilih Gejala" />
          </StepFrame>
        )}

        {step === 2 && (
          <StepFrame eyebrow="STEP 2 / 7 — GEJALA OPERASIONAL" title="Pilih Gejala Yang Benar-Benar Terjadi">
            <p className="mb-3 max-w-3xl text-sm leading-6 text-zinc-600">Pilih berdasarkan kondisi yang benar-benar terlihat atau dirasakan saat forklift bekerja. Tidak perlu menebak penyebab teknisnya.</p>
            <div className="mb-6 rounded-xl border border-[#FFCC00]/50 bg-[#FFFEF0] px-4 py-3 text-xs leading-5 text-zinc-700"><b>Petunjuk:</b> diagnosis berfokus pada battery dan proses pengisian. Kerusakan charger tidak didiagnosis pada tahap screening ini.</div>
            <div className="grid gap-3 md:grid-cols-2">{issues.map(([key, title, description]) => { const active = selectedIssues.includes(key); return <button key={key} type="button" onClick={() => toggleIssue(key)} className={`rounded-[18px] border p-5 text-left transition ${active ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white shadow-lg' : 'border-zinc-200 bg-white hover:border-zinc-400'}`}><div className="flex items-start justify-between gap-4"><div><div className="font-black">{title}</div><div className={`mt-1 text-sm leading-5 ${active ? 'text-zinc-300' : 'text-zinc-500'}`}>{description}</div></div><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-black ${active ? 'bg-[#FFCC00] text-black' : 'border border-zinc-300'}`}>{active ? '✓' : '+'}</span></div></button>; })}</div>
            <div className="mt-5 flex items-center justify-between rounded-xl bg-[#FFFEF0] px-4 py-3 text-sm"><span>Gejala dipilih</span><strong>{selectedIssues.length} / {issues.length}</strong></div>
            <Nav error={error} onBack={goBack} onNext={goNext} nextLabel="Lengkapi Detail Kondisi" />
          </StepFrame>
        )}

        {step === 3 && (
          <StepFrame eyebrow="STEP 3 / 7 — DETAIL KONDISI" title="Lengkapi Kondisi Operasional">
            <p className="mb-6 max-w-3xl text-sm leading-6 text-zinc-600">Operation context sudah diisi pada Step 1. Di sini cukup lengkapi kondisi battery yang diketahui. Gunakan <b>Tidak tahu</b> bila data belum tersedia.</p>
            <div className="mb-5 grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-sm sm:grid-cols-3"><KeyValue label="Model" value={selectedModel?.model_code || selectedModel?.name || '-'} /><KeyValue label="Shift" value={`${shift} shift`} /><KeyValue label="Jam operasi" value={`${jamOperasi} jam/hari`} /></div>
            <div className="grid gap-4 lg:grid-cols-2"><DetailChoice label="Rata-rata berapa lama battery mampu bekerja sebelum perlu diisi ulang?" value={fastDrainDuration} options={fastDrainOptions} onChange={setFastDrainDuration} /><DetailChoice label="Berapa lama rata-rata proses pengisian sampai battery siap digunakan kembali?" value={chargingDuration} options={chargingDurationOptions} onChange={setChargingDuration} /><Panel><Range label={`Perkiraan umur battery: ${umur} tahun`} value={umur} min={0} max={8} onChange={setUmur} /><p className="mt-3 text-xs leading-5 text-zinc-500">Gunakan tahun pemasangan atau riwayat penggantian battery bila tersedia.</p></Panel><DetailChoice label="Dalam kondisi normal, seberapa sering battery diperiksa atau diisi air?" value={wateringFrequency} options={wateringOptions} onChange={setWateringFrequency} /><DetailChoice label="Dalam 1 bulan, seberapa sering forklift berhenti karena battery atau proses pengisian?" value={downtimeFrequency} options={downtimeOptions} onChange={setDowntimeFrequency} /><DetailChoice label="Saat daya battery rendah, apakah gerakan angkat terasa melambat?" value={hydraulicFrequency} options={hydraulicOptions} onChange={setHydraulicFrequency} /></div>
            <div className="mt-5 rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">Jawaban “Tidak tahu” dapat menurunkan tingkat keyakinan, tetapi <b className="text-black">tidak otomatis menurunkan skor kondisi</b>.</div>
            <Nav error={error} onBack={goBack} onNext={() => void createDiagnosis()} nextLabel={processing ? 'Menganalisis...' : 'Jalankan Diagnosis'} disabled={processing} />
          </StepFrame>
        )}

        {step === 4 && diagnosis && (
          <StepFrame eyebrow="STEP 4 / 7 — AI DIAGNOSIS RESULT" title="Hasil Diagnosis DRRKOBE">
            <div className="relative overflow-hidden rounded-[24px] border border-zinc-200 bg-white">
              <div aria-hidden="true" className="pointer-events-none absolute bottom-6 right-6 select-none text-5xl font-black tracking-[-.06em] text-black opacity-[.035]">DRRKOBE ENGINE</div>
              <div className="border-b border-zinc-200 p-5 lg:flex lg:items-center lg:justify-between lg:gap-5"><div><div className="font-black">{selectedIssues.length} masalah dianalisis sebagai satu kondisi operasional</div><Mono>Tingkat keyakinan {confidence}% • Analisis multi-gejala</Mono></div><div className="mt-4 flex flex-wrap gap-2 lg:mt-0">{selectedIssueLabels.map((label) => <span key={label} className="rounded-full border border-[#FFCC00] bg-[#FFFEF0] px-3 py-1 text-xs font-bold">{label}</span>)}</div></div>
              <div className="grid lg:grid-cols-[340px_1fr]">
                <div className="border-b border-zinc-200 p-7 lg:border-b-0 lg:border-r"><Mono>SKOR KONDISI BATTERY</Mono><HealthGauge value={health} /><div className="mt-7 space-y-3 text-sm"><KeyValue label="Urgensi" value={urgency} /><KeyValue label="Tingkat keyakinan" value={`${confidence}%`} /><KeyValue label="Gejala" value={`${selectedIssues.length} masalah`} /></div></div>
                <div className="p-7"><Mono>PENYEBAB YANG PERLU DIVERIFIKASI</Mono><div className="mt-6 space-y-5">{causeRows.map((cause, index) => <CauseBar key={`${cause.name}-${index}`} name={cause.name} value={cause.value} />)}</div><div className="mt-7 rounded-[18px] bg-[#0A0A0A] p-5 text-white"><div className="font-black text-[#FFCC00]">INTERPRETASI DRRKOBE</div><p className="mt-2 text-sm leading-6 text-zinc-300">{ai?.status === 'completed' && ai.summary ? ai.summary : `Skor kondisi ${health}% dihitung dari umur battery, operation context ${shift} shift / ${jamOperasi} jam, durasi pengisian, frekuensi waktu henti, perawatan isi air, dan gejala yang dilaporkan.`}</p></div><AiLifecyclePanel ai={ai} retrying={aiRetrying} onRetry={() => void retryAiAnalysis()} /></div>
              </div>
              <div className="flex flex-col gap-3 border-t border-zinc-200 bg-[#FCFCF9] px-6 py-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="font-mono text-[9px] font-bold uppercase tracking-[.18em] text-zinc-400">ANALYZED BY</div><div className="mt-1 text-sm font-black">DRRKOBE Diagnostic Engine</div></div><div className="inline-flex w-fit rounded-full bg-[#FFCC00] px-3 py-2 font-mono text-[10px] font-black tracking-[.12em] text-black">DRRKOBE.COM/BIP</div></div>
            </div>
            <Nav onBack={() => setStep(3)} onNext={() => setStep(5)} nextLabel="Bandingkan Teknologi" />
          </StepFrame>
        )}

        {step === 5 && (
          <StepFrame eyebrow="STEP 5 / 7 — TECHNOLOGY COMPARISON" title="Lead Acid vs Lithium-ion — Perbandingan Teknis">
            <div className="overflow-x-auto rounded-[24px] border border-zinc-200 bg-white"><table className="min-w-[760px] w-full border-collapse text-sm"><thead><tr className="bg-[#0A0A0A] text-left text-white"><th className="p-5">PARAMETER</th><th className="p-5">LEAD ACID (CURRENT)</th><th className="bg-[#FFCC00] p-5 text-black">LI-ION (TARGET)</th></tr></thead><tbody>{comparisonRows.map(([parameter, lead, lithium]) => <tr key={parameter} className="border-b border-zinc-100 last:border-0"><td className="p-5 font-black">{parameter}</td><td className="p-5 text-zinc-600">{lead}</td><td className="bg-[#FFFEF0] p-5 font-bold">{lithium}</td></tr>)}</tbody></table></div>
            <div className="mt-4 rounded-xl border border-dashed border-zinc-300 bg-white p-4 text-xs leading-5 text-zinc-600"><b className="text-black">Technical Assessment tetap wajib.</b> Lithium-ion tidak otomatis menjadi pilihan terbaik; kompatibilitas unit, battery, BMS, konektor, dimensi, temperatur, duty cycle, dan charger perlu diverifikasi.</div>
            <Nav onBack={() => setStep(4)} onNext={() => setStep(6)} nextLabel="Validasi Business Impact" yellow />
          </StepFrame>
        )}

        {step === 6 && (
          <StepFrame eyebrow="STEP 6 / 7 — BUSINESS IMPACT & COST CONTEXT" title={`Hitung Potensi Efisiensi — ${selectedIssues.length} Masalah`}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><MetricCard label="Downtime" value={`${downtimeHours} jam/bulan`} sub="Baseline screening; gunakan data aktual bila tersedia" /><MetricCard label="Charging Exposure" value={chargingDuration === 'unknown' ? 'Belum diketahui' : optionLabel(chargingDurationOptions, chargingDuration)} sub="Charging adalah konteks operasional, bukan biaya Rupiah" /><MetricCard label="Maintenance" value={wateringFrequency === 'unknown' ? 'Belum diketahui' : `${maintenanceYear} tindakan/tahun`} sub="Isi air dan pemeriksaan rutin" /><MetricCard label="Productivity" value={`-${productivityLoss}%`} sub="Indikator dari jam operasi screening" /></div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[.9fr_1.35fr]">
              <Panel><Range label={`Jumlah Forklift: ${jumlahForklift}`} value={jumlahForklift} min={1} max={20} onChange={setJumlahForklift} /><div className="mt-7"><Range label={`Jam Operasi / Hari: ${roiJamOperasi}h`} value={roiJamOperasi} min={4} max={24} onChange={setRoiJamOperasi} /></div><div className="mt-7"><Choice label="Shift" value={roiShift} values={[1, 2, 3]} onChange={setRoiShift} suffix=" Shift" /></div><div className="mt-7 rounded-xl bg-[#FFFEF0] p-4 text-xs leading-5"><b>Catatan:</b> simulasi persentase adalah indikator awal. Nilai aktual harus diverifikasi berdasarkan duty cycle dan kondisi site.</div></Panel>
              <div className="rounded-[24px] bg-[#0A0A0A] p-7 text-white"><Mono className="text-zinc-400">SIMULASI • {jumlahForklift} unit • {roiJamOperasi} jam • {roiShift} shift</Mono><div className="mt-7 grid gap-4 sm:grid-cols-2"><DarkResult label="Downtime" value={`-${roiDowntime}%`} sub="Potensi pengurangan downtime" /><DarkResult label="Energy" value="Perlu data site" sub="Charging tidak dikonversi menjadi Rupiah" /><DarkResult label="Maintenance" value="-90%" sub="Potensi pengurangan watering & equalizing" /><DarkResult label="Operational Fit" value={operationalFit} sub="Berdasarkan shift dan jam operasi" /></div><div className="mt-6 rounded-[16px] bg-[#FFCC00] p-5 text-black"><b>Potensi operasional:</b> semakin tinggi jam operasi, jumlah unit, dan shift, semakin penting menjaga availability battery dan charging window.</div></div>
            </div>

            <Panel className="mt-6"><Mono>DATA ASSESSMENT — WAJIB</Mono><h3 className="mt-3 text-xl font-black">Lengkapi data sebelum rekomendasi final</h3><p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">Empat data berikut wajib diisi agar hasil assessment dapat ditindaklanjuti oleh DRRKOBE.</p><div className="mt-5 grid gap-4 md:grid-cols-2"><ReportField label="PT / Nama Perusahaan *"><input className="drr-input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Contoh: PT ABC Indonesia" autoComplete="organization" /></ReportField><ReportField label="Lokasi / Site *"><input className="drr-input" value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="Contoh: Plant Cikarang" /></ReportField><ReportField label="Nama User *"><input className="drr-input" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Nama PIC / pengguna" autoComplete="name" /></ReportField><ReportField label="Nomor WhatsApp *"><input className="drr-input" type="tel" inputMode="tel" value={userWhatsapp} onChange={(e) => setUserWhatsapp(e.target.value)} placeholder="Contoh: 081234567890" autoComplete="tel" /></ReportField></div><div className="mt-5 rounded-xl border border-[#FFCC00]/50 bg-[#FFFEF0] px-4 py-3 text-xs leading-5 text-zinc-700">Data disimpan sebelum Step 7 agar permintaan Technical Assessment tetap tercatat.</div></Panel>

            <Panel className="mt-6"><Mono>DATA FINANSIAL — OPSIONAL</Mono><h3 className="mt-3 text-xl font-black">Apakah Anda mengetahui biaya operasional internal?</h3><p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">Isi hanya data yang benar-benar diketahui. Model finansial BIP menggunakan downtime dan Maintenance Lead Acid. Charging tetap dinilai sebagai konteks operasional, bukan komponen Rupiah.</p><div className="mt-6 grid gap-3 lg:grid-cols-3"><FinancialModeCard active={financialMode === 'unknown'} title="Saya tidak tahu biaya internal" description="Lanjutkan tanpa nominal biaya." badge="DISARANKAN" onClick={() => chooseFinancialMode('unknown')} /><FinancialModeCard active={financialMode === 'partial'} title="Saya tahu sebagian biaya" description="Isi perkiraan biaya downtime satu forklift per jam." onClick={() => chooseFinancialMode('partial')} /><FinancialModeCard active={financialMode === 'full'} title="Saya memiliki data lengkap" description="Isi downtime dan Maintenance Lead Acid bila tersedia." onClick={() => chooseFinancialMode('full')} /></div>{financialMode !== 'unknown' && <div className="mt-6 grid gap-4 md:grid-cols-2"><ReportField label="Estimasi biaya downtime 1 forklift / jam (Rp)"><input className="drr-input" type="number" min={0} value={downtimeCostPerHour || ''} onChange={(e) => setDowntimeCostPerHour(Math.max(0, Number(e.target.value) || 0))} placeholder="Masukkan hanya jika diketahui" /></ReportField>{financialMode === 'full' && <ReportField label="Maintenance Lead Acid / unit / bulan (Rp)"><input className="drr-input" type="number" min={0} value={maintenanceCostPerUnitMonth || ''} onChange={(e) => setMaintenanceCostPerUnitMonth(Math.max(0, Number(e.target.value) || 0))} placeholder="Masukkan hanya jika diketahui" /></ReportField>}</div>}<div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.05fr]"><div className="rounded-[18px] border border-zinc-200 bg-[#FCFCF9] p-5"><Mono>OPERATIONAL IMPACT</Mono><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><KeyValue label="Downtime" value={`${downtimeHours} jam/bulan`} /><KeyValue label="Charging" value={chargingDuration === 'unknown' ? 'Belum diketahui' : optionLabel(chargingDurationOptions, chargingDuration)} /><KeyValue label="Maintenance" value={wateringFrequency === 'unknown' ? 'Belum diketahui' : `${maintenanceYear} tindakan/tahun`} /><KeyValue label="Productivity" value={`-${productivityLoss}%`} /></div></div><div className="rounded-[18px] bg-[#0A0A0A] p-5 text-white"><Mono className="text-zinc-400">FINANCIAL STATUS</Mono><div className="mt-3 text-2xl font-black">{hasFinancialInputs ? formatRupiah(annualOperatingExposure) : 'Pending Cost Validation'}</div><p className="mt-2 text-xs leading-5 text-zinc-400">{hasFinancialInputs ? `Operating exposure teridentifikasi dari downtime + maintenance. Skenario awal avoidable cost: ${formatRupiah(annualSavingScenario)} / tahun; nilai final perlu validasi site.` : 'Nilai finansial menunggu data cost internal. Executive Report tetap dapat dibuat tanpa asumsi Rupiah.'}</p></div></div><p className="mt-5 text-xs leading-5 text-zinc-500">Harga pembelian battery tidak dimasukkan. Proposal teknis dan harga final dibahas setelah Technical Assessment.</p></Panel>

            <Nav error={error} onBack={() => setStep(5)} onNext={() => void saveLeadAndContinue()} nextLabel={leadSaving ? 'Menyimpan data assessment...' : 'Lanjut ke Technical Assessment'} disabled={leadSaving} />
          </StepFrame>
        )}

        {step === 7 && diagnosis && (
          <StepFrame eyebrow="STEP 7 / 7 — TECHNICAL ASSESSMENT" title="Rekomendasi DRRKOBE">
            <div className="grid gap-6 lg:grid-cols-[.9fr_1.3fr]">
              <div><Panel><span className="inline-flex rounded-full bg-red-500 px-3 py-1 text-xs font-black text-white">{health <= 65 ? 'TECHNICAL ASSESSMENT DIPRIORITASKAN' : 'PEMANTAUAN & VERIFIKASI'} — {selectedIssues.length} MASALAH TERINDIKASI</span><h3 className="mt-5 text-xl font-black">{selectedModel?.model_code || selectedModel?.name} • Lead Acid {health}% • {shift} shift / {jamOperasi} jam</h3><p className="mt-4 text-sm leading-6 text-zinc-600">Assessment awal membantu menentukan apakah Lithium-ion layak dievaluasi. Keputusan investasi dan harga final belum ditentukan pada tahap ini.</p><div className="mt-6 grid grid-cols-3 gap-3"><Metric label="Keyakinan" value={`${confidence}%`} /><Metric label="Masalah" value={`${selectedIssues.length}`} dark /><Metric label="Next" value="Tech. Assessment" /></div></Panel><div className="mt-4 rounded-[18px] bg-[#0A0A0A] p-5 text-sm leading-6 text-white"><b className="text-[#FFCC00]">Validasi berikutnya:</b> kapasitas aktual, battery compartment, BMS, konektor, berat minimum, duty cycle, temperatur, charging strategy, dan kompatibilitas charger sebelum proposal teknis serta harga final.</div></div>
              <div className="rounded-[28px] bg-[#0A0A0A] p-8 text-center text-white"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#FFCC00] text-3xl text-black">✓</div><h2 className="mt-6 text-3xl font-black">Assessment Selesai</h2><p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-zinc-300">Data assessment sudah tercatat. Gunakan Executive Decision Report sebagai dasar Technical Assessment DRRKOBE sebelum proposal komersial.</p><div className="mx-auto mt-7 max-w-xl rounded-[18px] border border-white/10 bg-white/[0.06] p-5 text-left"><Mono className="text-zinc-400">RINGKASAN DIAGNOSIS • DRRKOBE.COM/BIP</Mono><div className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><KeyValue label="Model" value={selectedModel?.model_code || selectedModel?.name || '-'} dark /><KeyValue label="Battery" value={`Lead Acid • ${health}%`} dark /><KeyValue label="Masalah" value={`${selectedIssues.length} masalah`} dark /><KeyValue label="Urgensi" value={urgency} dark /></div></div><div className="mt-7 flex flex-wrap justify-center gap-3"><button type="button" onClick={handleDownloadReport} className="rounded-full bg-[#FFCC00] px-6 py-3 text-sm font-black text-black transition hover:bg-[#F5C000]">Download Executive Report PDF ↓</button><a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/25 px-6 py-3 text-sm font-black text-white transition hover:border-white">Request Technical Assessment →</a><button type="button" onClick={resetFlow} className="rounded-full border border-white/15 px-6 py-3 text-sm font-bold text-zinc-300">Mulai Diagnosis Baru</button></div></div>
            </div>
          </StepFrame>
        )}
      </div>
      <style jsx global>{`.drr-input{margin-top:.5rem;width:100%;border-radius:12px;border:1px solid #d4d4d8;background:#fff;padding:.8rem 1rem;color:#0a0a0a;outline:none}.drr-input:focus{border-color:#FFCC00;box-shadow:0 0 0 3px rgba(255,204,0,.22)}`}</style>
    </main>
  );
}

function AiLifecyclePanel({ ai, retrying, onRetry }: { ai: AiResult | null; retrying: boolean; onRetry: () => void }) {
  if (!ai || ai.status === 'pending' || ai.status === 'processing') return <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#FFCC00]/50 bg-[#FFFEF0] px-4 py-3 text-xs font-bold text-zinc-700"><span className="mt-1 h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#FFCC00]" /><span>{ai?.message || 'Analisis utama selesai. Pemeriksaan pola masalah sedang dilengkapi.'}</span></div>;
  if (ai.status === 'failed') return <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3"><div className="text-xs font-bold text-red-800">{ai.message || 'Analisis tambahan belum tersedia. Hasil utama tetap dapat digunakan.'}</div>{ai.retryable && <button type="button" onClick={onRetry} disabled={retrying} className="mt-3 rounded-full bg-[#0A0A0A] px-4 py-2 text-xs font-black text-white disabled:opacity-40">{retrying ? 'Mencoba kembali...' : 'Coba Analisis Lagi'}</button>}</div>;
  return <div className="mt-4 flex items-center gap-3 text-xs font-bold text-zinc-500"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Analisis tambahan selesai.</div>;
}

function formatRupiah(value: number) { return `Rp ${Math.round(value).toLocaleString('id-ID')}`; }
function Progress({ step }: { step: number }) { return <div className="border-b border-zinc-200 bg-white"><div className="mx-auto flex min-h-[54px] max-w-[1280px] items-center justify-between gap-5 overflow-x-auto px-4 sm:px-6 lg:px-8"><div className="flex min-w-[520px] items-center">{Array.from({ length: TOTAL_STEPS }, (_, index) => index + 1).map((number) => <div key={number} className="flex items-center"><div className={`grid h-7 w-7 place-items-center rounded-full text-xs font-black ${number <= step ? 'bg-[#0A0A0A] text-white' : 'border border-zinc-200 bg-white text-zinc-400'}`}>{number}</div>{number < TOTAL_STEPS && <div className={`mx-2 h-px w-9 ${number < step ? 'bg-[#0A0A0A]' : 'bg-zinc-200'}`} />}</div>)}</div><div className="whitespace-nowrap text-[11px] font-semibold"><span className="font-mono text-zinc-500">DRRKOBE Diagnostic Engine</span><span className="mx-3 text-zinc-300">|</span>Step {step}/{TOTAL_STEPS}</div></div></div>; }
function StepFrame({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) { return <section className="mx-auto max-w-[1160px]"><Mono>{eyebrow}</Mono><h1 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-4xl"><span className="bg-[linear-gradient(transparent_62%,rgba(255,204,0,.33)_62%)]">{title}</span></h1><div className="mt-8">{children}</div></section>; }
function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <div className={`rounded-[24px] border border-zinc-200 bg-white p-6 ${className}`}>{children}</div>; }
function Label({ children }: { children: React.ReactNode }) { return <div className="text-sm font-black">{children}</div>; }
function ReportField({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-black text-zinc-800">{label}{children}</label>; }
function Mono({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <div className={`font-mono text-[11px] font-semibold tracking-[.12em] text-zinc-500 ${className}`}>{children}</div>; }
function Nav({ onBack, onNext, error, nextLabel = 'Lanjutkan', disabled = false, yellow = false }: { onBack?: () => void; onNext: () => void; error?: string; nextLabel?: string; disabled?: boolean; yellow?: boolean }) { return <div className="mt-8"><div className="flex flex-wrap items-center justify-between gap-3"><div>{onBack && <button type="button" onClick={onBack} className="rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-bold">Kembali</button>}</div><button type="button" onClick={onNext} disabled={disabled} className={`rounded-full px-6 py-3 text-sm font-black disabled:opacity-40 ${yellow ? 'bg-[#FFCC00] text-black' : 'bg-[#0A0A0A] text-white'}`}>{nextLabel} →</button></div>{error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}</div>; }
function FinancialModeCard({ active, title, description, badge, onClick }: { active: boolean; title: string; description: string; badge?: string; onClick: () => void }) { return <button type="button" onClick={onClick} className={`relative rounded-[18px] border p-5 text-left transition ${active ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white shadow-lg' : 'border-zinc-200 bg-white hover:border-zinc-400'}`}>{badge && <span className={`mb-3 inline-flex rounded-full px-2.5 py-1 text-[9px] font-black tracking-[.12em] ${active ? 'bg-[#FFCC00] text-black' : 'bg-[#FFFEF0] text-zinc-700'}`}>{badge}</span>}<div className="font-black">{title}</div><p className={`mt-2 text-xs leading-5 ${active ? 'text-zinc-300' : 'text-zinc-500'}`}>{description}</p><span className={`absolute right-4 top-4 grid h-6 w-6 place-items-center rounded-full text-xs font-black ${active ? 'bg-[#FFCC00] text-black' : 'border border-zinc-300 text-zinc-400'}`}>{active ? '✓' : ''}</span></button>; }
function Metric({ label, value, dark = false }: { label: string; value: string; dark?: boolean }) { return <div className={`rounded-xl border p-4 ${dark ? 'border-white/10 bg-white/[0.06]' : 'border-zinc-200 bg-white'}`}><div className={`text-[10px] font-bold uppercase tracking-[.14em] ${dark ? 'text-zinc-400' : 'text-zinc-500'}`}>{label}</div><div className="mt-1 text-sm font-black">{value}</div></div>; }
function MetricCard({ label, value, sub }: { label: string; value: string; sub: string }) { return <div className="rounded-[20px] border border-zinc-200 bg-white p-6"><Mono>{label}</Mono><div className="mt-4 text-2xl font-black">{value}</div><div className="mt-2 text-xs text-zinc-500">{sub}</div></div>; }
function DarkResult({ label, value, sub }: { label: string; value: string; sub: string }) { return <div className="rounded-[18px] border border-white/10 bg-white/[0.06] p-6"><Mono className="text-zinc-400">{label}</Mono><div className="mt-3 text-2xl font-black">{value}</div><div className="mt-2 text-xs text-zinc-400">{sub}</div></div>; }
function Choice({ label, value, values, onChange, suffix = '' }: { label: string; value: number; values: number[]; onChange: (value: number) => void; suffix?: string }) { return <div><Label>{label}</Label><div className="mt-4 flex flex-wrap gap-2">{values.map((item) => <button key={item} type="button" onClick={() => onChange(item)} className={`min-w-[58px] flex-1 rounded-full border px-3 py-3 text-sm font-black ${value === item ? 'border-black bg-black text-white' : 'border-zinc-200 bg-white'}`}>{item}{suffix}</button>)}</div></div>; }
function DetailChoice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: DetailOption<T>[]; onChange: (value: T) => void }) { return <Panel><Label>{label}</Label><div className="mt-4 grid gap-2 sm:grid-cols-2">{options.map((option) => { const active = value === option.value; return <button key={option.value} type="button" onClick={() => onChange(option.value)} className={`rounded-xl border px-4 py-3 text-left transition ${active ? 'border-black bg-black text-white' : 'border-zinc-200 bg-white hover:border-zinc-400'}`}><div className="text-sm font-black">{option.label}</div>{option.note && <div className={`mt-1 text-[11px] leading-4 ${active ? 'text-zinc-300' : 'text-zinc-500'}`}>{option.note}</div>}</button>; })}</div></Panel>; }
function Range({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) { return <div><Label>{label}</Label><input className="mt-4 w-full accent-[#FFCC00]" type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} /><div className="mt-1 flex justify-between text-[10px] text-zinc-400"><span>{min}</span><span>{max}</span></div></div>; }
function KeyValue({ label, value, dark = false }: { label: string; value: string; dark?: boolean }) { return <div className="flex items-center justify-between gap-4"><span className={dark ? 'text-zinc-400' : 'text-zinc-500'}>{label}</span><strong>{value}</strong></div>; }
function CauseBar({ name, value }: { name: string; value: number }) { return <div><div className="mb-2 flex items-center justify-between text-sm font-black"><span>{name}</span><span>{value}%</span></div><div className="h-2 overflow-hidden rounded-full bg-zinc-100"><div className="h-full bg-[#FFCC00]" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div></div>; }
function HealthGauge({ value }: { value: number }) { const color = value <= 40 ? '#EF4444' : value <= 80 ? '#FFCC00' : '#22C55E'; return <div className="mt-7 flex justify-center"><div className="grid h-44 w-44 place-items-center rounded-full" style={{ background: `conic-gradient(${color} ${value * 3.6}deg,#f4f4f5 0deg)` }}><div className="grid h-36 w-36 place-items-center rounded-full bg-white text-center"><div><div className="text-5xl font-black">{value}%</div><div className="mt-1 text-xs font-black uppercase" style={{ color }}>{value <= 40 ? 'Kritis' : value <= 65 ? 'Buruk' : value <= 80 ? 'Waspada' : 'Baik'}</div></div></div></div></div>; }
