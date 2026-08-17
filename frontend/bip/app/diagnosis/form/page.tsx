'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const API_BASE = 'https://api.drrkobe.com/api/v1';
const WHATSAPP_NUMBER = '6285133331476';

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

type Cause = { name?: string; prob?: number; cause?: string; confidence?: number; reason?: string };
type DiagnosisResponse = {
  diagnosis_id: string;
  health_score: number;
  category: string;
  urgency: string;
  confidence: number;
  recommendation: string;
  causes: Cause[];
};

type AiResult = {
  analyzed: boolean;
  summary: string | null;
  probable_causes: Array<{ cause: string; confidence: number; reason: string }>;
  technical_findings: string[];
  recommended_actions: string[];
  limitations: string[];
  urgency: string | null;
  confidence: number | null;
};

const issues = [
  ['battery_fast', 'Battery Cepat Habis', 'Drop < 4 jam per shift'],
  ['charger_long', 'Charger Lama / Error', 'Charge > 10 jam / error code'],
  ['downtime', 'Downtime Sering', '> 2x breakdown / bulan'],
  ['maintenance', 'Maintenance Tinggi', 'Service & isi air rutin'],
  ['productivity', 'Produktivitas Menurun', 'Cycle time melambat'],
  ['electrical', 'Error Code / Electrical', 'Kode error di display'],
  ['hydraulic', 'Hydraulic Lambat', 'Angkat lambat saat low batt'],
  ['drive', 'Drive / Steering Issue', 'Tarik berat / steering liar'],
  ['overheat', 'Overheat', 'Battery / motor panas'],
  ['watering', 'Isi Air Sering', 'Top-up >2x seminggu'],
] as const;

const comparisonRows = [
  ['Charging Time', '8–12 jam + cooling', '1.5–2.5 jam, opportunity charge'],
  ['Lifespan (cycles)', '~1,200 cycles', '~3,000+ cycles'],
  ['Maintenance', 'Isi air, equalizing, cleaning', 'Minimal routine maintenance'],
  ['Energy Efficiency', '75–80%', '95%+'],
  ['Downtime Risk', 'Tinggi pada operasi multi-shift', 'Lebih rendah dengan opportunity charging'],
  ['Opportunity Charging', 'Tidak direkomendasikan', 'Dapat dilakukan saat break'],
  ['Safety / Emission', 'Gas H2, acid handling', 'Sealed, no watering'],
];

export default function DiagnosisFormPage() {
  const [step, setStep] = useState(1);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<ForkliftModel[]>([]);
  const [brandId, setBrandId] = useState('');
  const [modelId, setModelId] = useState('');
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [umur, setUmur] = useState(4);
  const [shift, setShift] = useState(2);
  const [isiAir, setIsiAir] = useState(2);
  const [cepatHabis, setCepatHabis] = useState(true);
  const [chargingLama, setChargingLama] = useState(true);
  const [downtime, setDowntime] = useState(true);
  const [chargerError, setChargerError] = useState(false);
  const [hydraulicLambat, setHydraulicLambat] = useState(false);
  const [jumlahForklift, setJumlahForklift] = useState(5);
  const [roiJamOperasi, setRoiJamOperasi] = useState(16);
  const [roiShift, setRoiShift] = useState(2);
  const [loadingModels, setLoadingModels] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [diagnosis, setDiagnosis] = useState<DiagnosisResponse | null>(null);
  const [diagnosisId, setDiagnosisId] = useState<string | null>(null);
  const [ai, setAi] = useState<AiResult | null>(null);
  const aiRequested = useRef(false);

  const jamOperasi = Math.min(24, shift * 8);
  const selectedModel = useMemo(() => models.find((item) => item.id === modelId) ?? null, [models, modelId]);
  const selectedBrand = useMemo(() => brands.find((item) => item.id === brandId) ?? null, [brands, brandId]);
  const selectedIssueLabels = useMemo(
    () => issues.filter(([key]) => selectedIssues.includes(key)).map(([, label]) => label),
    [selectedIssues],
  );

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

    const refresh = async () => {
      try {
        const response = await fetch(`${API_BASE}/diagnosis/${diagnosisId}/result`, {
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) return;
        const payload = await response.json();
        if (stopped) return;
        const nextAi = payload?.data?.ai as AiResult | undefined;
        if (nextAi) {
          setAi(nextAi);
          if (nextAi.analyzed && timer) clearInterval(timer);
        }
      } catch {
        // Enrichment tidak boleh memblokir hasil utama.
      }
    };

    void fetch(`${API_BASE}/ai/diagnosis/${diagnosisId}/analyze`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
    }).finally(() => void refresh());

    timer = setInterval(refresh, 2500);
    void refresh();

    return () => {
      stopped = true;
      if (timer) clearInterval(timer);
    };
  }, [diagnosisId]);

  function goNext() {
    setError('');
    if (step === 1 && !modelId) return setError('Pilih brand dan model forklift terlebih dahulu.');
    if (step === 3 && selectedIssues.length === 0) return setError('Pilih minimal satu masalah yang dialami.');
    setStep((current) => Math.min(9, current + 1));
  }

  function goBack() {
    setError('');
    setStep((current) => Math.max(1, current - 1));
  }

  function toggleIssue(key: string) {
    setSelectedIssues((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  }

  async function createDiagnosis() {
    if (!modelId) return;
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
            cepat_habis: cepatHabis,
            charging_lama: chargingLama,
            isi_air: isiAir,
            downtime,
            charger_error: chargerError,
            hydraulic_lambat: hydraulicLambat,
            issues: selectedIssueLabels,
          },
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.diagnosis_id) {
        throw new Error(payload.message ?? 'Diagnosis gagal diproses.');
      }

      setDiagnosis(payload);
      setDiagnosisId(payload.diagnosis_id);
      setStep(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Diagnosis gagal diproses.');
    } finally {
      setProcessing(false);
    }
  }

  function resetFlow() {
    setStep(1);
    setBrandId('');
    setModelId('');
    setSelectedIssues([]);
    setDiagnosis(null);
    setDiagnosisId(null);
    setAi(null);
    aiRequested.current = false;
  }

  const health = diagnosis?.health_score ?? 0;
  const confidence = ai?.confidence ?? diagnosis?.confidence ?? 0;
  const urgency = ai?.urgency ?? diagnosis?.urgency ?? '-';
  const causeRows = (ai?.probable_causes?.length
    ? ai.probable_causes.map((item) => ({ name: item.cause, value: item.confidence, reason: item.reason }))
    : (diagnosis?.causes ?? []).map((item) => ({ name: item.name ?? 'Diagnostic signal', value: item.prob ?? 0, reason: '' }))
  ).slice(0, 4);

  const downtimeHours = Math.round(((umur * 1.5 + shift * 2) * 1.2) * 10) / 10;
  const chargingWaste = chargingLama ? Math.max(0, (8 - 2) * 26) : 0;
  const maintenanceYear = isiAir * 52 + 12;
  const operationalHoursMonth = Math.max(1, jamOperasi * 26);
  const productivityLoss = Math.min(100, Math.round((downtimeHours / operationalHoursMonth) * 100));
  const roiDowntime = roiShift >= 3 ? 75 : roiShift >= 2 ? 70 : 65;
  const payback = roiJamOperasi >= 16 && roiShift >= 2 ? 'Cepat' : 'Sedang';

  const rootCauseText = causeRows.length
    ? causeRows.slice(0, 3).map((cause, index) => `${index + 1}. ${cause.name} (${cause.value}%)`).join('\n')
    : '- Belum tersedia';

  const issueText = selectedIssueLabels.length
    ? selectedIssueLabels.map((label, index) => `${index + 1}. ${label}`).join('\n')
    : '- Tidak ada';

  const whatsappMessage = [
    'Halo tim DRRKOBE,',
    '',
    'Saya sudah menyelesaikan diagnosis di DRRKOBE Battery Intelligence Platform dan ingin mengajukan technical assessment.',
    '',
    '*DATA UNIT*',
    `Brand: ${selectedBrand?.name || '-'}`,
    `Model: ${selectedModel?.model_code || selectedModel?.name || '-'}`,
    `Kategori: ${selectedModel?.category || '-'}`,
    `Battery: Lead Acid`,
    `Tegangan: ${selectedModel?.battery_voltage ? `${selectedModel.battery_voltage} V` : '-'}`,
    `Kapasitas nominal: ${selectedModel?.battery_capacity_ah ? `${selectedModel.battery_capacity_ah} Ah` : '-'}`,
    `Umur battery: ${umur} tahun`,
    `Operasional: ${shift} shift / ${jamOperasi} jam per hari`,
    '',
    '*MASALAH YANG DIALAMI*',
    issueText,
    '',
    '*DETAIL KONDISI*',
    `Battery cepat habis dalam 1 shift: ${cepatHabis ? 'Ya' : 'Tidak'}`,
    `Charging lebih dari 8 jam: ${chargingLama ? 'Ya' : 'Tidak'}`,
    `Frekuensi isi air: ${isiAir}x per minggu`,
    `Downtime lebih dari 2x per bulan: ${downtime ? 'Ya' : 'Tidak'}`,
    `Charger muncul error code: ${chargerError ? 'Ya' : 'Tidak'}`,
    `Hydraulic lambat saat battery low: ${hydraulicLambat ? 'Ya' : 'Tidak'}`,
    '',
    '*HASIL DRRKOBE BIP*',
    `Health Score: ${health}%`,
    `Kategori: ${diagnosis?.category || '-'}`,
    `Urgensi: ${urgency}`,
    `Confidence: ${confidence}%`,
    `Diagnosis ID: ${diagnosisId || '-'}`,
    '',
    '*INDIKASI AKAR MASALAH*',
    rootCauseText,
    '',
    '*SIMULASI OPERASIONAL*',
    `Jumlah forklift: ${jumlahForklift} unit`,
    `Jam operasi: ${roiJamOperasi} jam/hari`,
    `Shift: ${roiShift} shift`,
    `Potensi pengurangan downtime: ${roiDowntime}%`,
    'Potensi peningkatan efisiensi energi: 28%',
    'Potensi pengurangan aktivitas maintenance: 90%',
    `Indikator payback operasional: ${payback}`,
    '',
    'Mohon dibantu untuk langkah technical assessment berikutnya. Data di atas merupakan hasil awal BIP dan saya memahami bahwa keputusan teknis tetap memerlukan verifikasi kondisi aktual di lapangan.',
  ].join('\n');

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <main className="min-h-screen bg-[#FCFCF9] text-[#0A0A0A]">
      <Progress step={step} />

      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {step === 1 && (
          <StepFrame eyebrow="STEP 1 / 9 — MODEL SELECTION" title="Pilih Model Forklift">
            <div className="grid gap-5 lg:grid-cols-[.85fr_1.15fr]">
              <Panel>
                <Label>Brand</Label>
                <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className="drr-input">
                  <option value="">Pilih brand</option>
                  {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                </select>
                <div className="mt-6">
                  <Label>Model Forklift</Label>
                  <select value={modelId} onChange={(e) => setModelId(e.target.value)} disabled={!brandId || loadingModels} className="drr-input disabled:bg-zinc-100">
                    <option value="">{loadingModels ? 'Memuat model...' : 'Pilih model'}</option>
                    {models.map((model) => <option key={model.id} value={model.id}>{model.model_code || model.name} — {model.name}</option>)}
                  </select>
                </div>
              </Panel>
              <div className="rounded-[24px] bg-[#0A0A0A] p-7 text-white">
                <Mono>DRRKOBE MODEL CONTEXT</Mono>
                <h2 className="mt-5 text-3xl font-black tracking-tight">{selectedModel?.model_code || selectedModel?.name || 'Pilih model forklift'}</h2>
                <p className="mt-2 text-sm text-zinc-400">{selectedBrand?.name || 'Data model akan tampil setelah dipilih'}</p>
                <div className="mt-8 grid grid-cols-2 gap-3">
                  <Metric label="Category" value={selectedModel?.category || '-'} dark />
                  <Metric label="Capacity" value={selectedModel?.capacity_kg ? `${selectedModel.capacity_kg} kg` : '-'} dark />
                  <Metric label="Voltage" value={selectedModel?.battery_voltage ? `${selectedModel.battery_voltage} V` : '-'} dark />
                  <Metric label="Battery" value={selectedModel?.battery_capacity_ah ? `${selectedModel.battery_capacity_ah} Ah` : '-'} dark />
                </div>
              </div>
            </div>
            <Nav error={error} onNext={goNext} />
          </StepFrame>
        )}

        {step === 2 && (
          <StepFrame eyebrow="STEP 2 / 9 — CURRENT BATTERY" title="Konfigurasi Battery Saat Ini">
            <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
              <Panel>
                <div className="flex items-center justify-between gap-4 rounded-2xl border-2 border-[#FFCC00] bg-[#FFFEF0] p-5">
                  <div>
                    <Mono>CURRENT TECHNOLOGY</Mono>
                    <h3 className="mt-2 text-2xl font-black">Lead Acid</h3>
                    <p className="mt-2 text-sm text-zinc-600">Diagnosis saat ini difokuskan pada unit yang masih menggunakan battery Lead Acid. Lithium-ion digunakan sebagai bahan perbandingan teknis pada tahap berikutnya.</p>
                  </div>
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-[#FFCC00] text-2xl font-black">LA</div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <Metric label="Model" value={selectedModel?.model_code || selectedModel?.name || '-'} />
                  <Metric label="System Voltage" value={selectedModel?.battery_voltage ? `${selectedModel.battery_voltage} V` : '-'} />
                  <Metric label="Nominal Capacity" value={selectedModel?.battery_capacity_ah ? `${selectedModel.battery_capacity_ah} Ah` : '-'} />
                </div>
              </Panel>
              <div className="rounded-[24px] border border-zinc-200 bg-white p-6">
                <Mono>WHY THIS MATTERS</Mono>
                <h3 className="mt-3 text-xl font-black">Kondisi awal harus jelas sebelum diagnosis.</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-600">Tipe battery dikunci pada Lead Acid agar Health Score, perbandingan teknologi, dan rekomendasi tetap konsisten dengan kondisi unit yang dinilai.</p>
                <div className="mt-5 rounded-xl bg-[#0A0A0A] p-4 text-sm font-semibold text-white">Tidak ada harga yang ditampilkan pada proses diagnosis.</div>
              </div>
            </div>
            <Nav error={error} onBack={goBack} onNext={goNext} />
          </StepFrame>
        )}

        {step === 3 && (
          <StepFrame eyebrow="STEP 3 / 9 — MULTI-ISSUE FINDER" title="Pilih Semua Masalah Yang Kamu Alami">
            <p className="mb-6 max-w-3xl text-sm leading-6 text-zinc-600">Pilih semua gejala yang benar-benar terjadi. DRRKOBE akan membaca keterkaitan antar-masalah sebagai satu kondisi operasional.</p>
            <div className="grid gap-3 md:grid-cols-2">
              {issues.map(([key, title, description]) => {
                const active = selectedIssues.includes(key);
                return (
                  <button key={key} type="button" onClick={() => toggleIssue(key)} className={`rounded-[18px] border p-5 text-left transition ${active ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white shadow-lg' : 'border-zinc-200 bg-white hover:border-zinc-400'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div><div className="font-black">{title}</div><div className={`mt-1 text-sm ${active ? 'text-zinc-300' : 'text-zinc-500'}`}>{description}</div></div>
                      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-black ${active ? 'bg-[#FFCC00] text-black' : 'border border-zinc-300'}`}>{active ? '✓' : '+'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 flex items-center justify-between rounded-xl bg-[#FFFEF0] px-4 py-3 text-sm">
              <span>Masalah dipilih</span><strong>{selectedIssues.length} / 10</strong>
            </div>
            <Nav error={error} onBack={goBack} onNext={goNext} nextLabel="Detail Operasional" />
          </StepFrame>
        )}

        {step === 4 && (
          <StepFrame eyebrow="STEP 4 / 9 — OPERATIONAL DETAIL" title="Detail Operasional Untuk Diagnosis Gabungan">
            <div className="grid gap-4 lg:grid-cols-2">
              <YesNo label="Apakah battery cepat habis dalam 1 shift?" value={cepatHabis} onChange={setCepatHabis} />
              <YesNo label="Durasi charging lebih dari 8 jam?" value={chargingLama} onChange={setChargingLama} />
              <Choice label="Berapa shift operasional per hari?" value={shift} values={[1, 2, 3]} onChange={setShift} suffix=" Shift" />
              <Range label={`Umur battery: ${umur} tahun`} value={umur} min={0} max={8} onChange={setUmur} />
              <Choice label="Frekuensi isi air per minggu?" value={isiAir} values={[0, 1, 2, 3, 4]} onChange={setIsiAir} suffix="x" />
              <YesNo label="Downtime lebih dari 2x per bulan?" value={downtime} onChange={setDowntime} />
              <YesNo label="Charger muncul error code?" value={chargerError} onChange={setChargerError} />
              <YesNo label="Hydraulic lambat saat battery low?" value={hydraulicLambat} onChange={setHydraulicLambat} />
            </div>
            <div className="mt-5 rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">Jam operasi dihitung dari pola shift: <b className="text-black">{jamOperasi} jam/hari</b>. Health Score dihitung dari data yang diisi pada proses ini.</div>
            <Nav error={error} onBack={goBack} onNext={() => void createDiagnosis()} nextLabel={processing ? 'Menganalisis...' : 'Jalankan Diagnosis'} disabled={processing} />
          </StepFrame>
        )}

        {step === 5 && diagnosis && (
          <StepFrame eyebrow="STEP 5 / 9 — AGGREGATED DIAGNOSIS" title="Hasil Diagnosis DRRKOBE">
            <div className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white">
              <div className="border-b border-zinc-200 p-5 lg:flex lg:items-center lg:justify-between lg:gap-5">
                <div><div className="font-black">{selectedIssues.length} masalah dianalisis sebagai satu kondisi operasional</div><Mono>Confidence {confidence}% • Multi-Issue Analysis</Mono></div>
                <div className="mt-4 flex flex-wrap gap-2 lg:mt-0">{selectedIssueLabels.map((label) => <span key={label} className="rounded-full border border-[#FFCC00] bg-[#FFFEF0] px-3 py-1 text-xs font-bold">{label}</span>)}</div>
              </div>
              <div className="grid lg:grid-cols-[340px_1fr]">
                <div className="border-b border-zinc-200 p-7 lg:border-b-0 lg:border-r">
                  <Mono>BATTERY HEALTH SCORE</Mono>
                  <HealthGauge value={health} />
                  <div className="mt-7 space-y-3 text-sm">
                    <KeyValue label="Urgency" value={urgency} />
                    <KeyValue label="Confidence" value={`${confidence}%`} />
                    <KeyValue label="Issues" value={`${selectedIssues.length} masalah`} />
                  </div>
                  <Mono className="mt-8">DRRKOBE.COM/BIP • Diagnostic Engine</Mono>
                </div>
                <div className="p-7">
                  <Mono>ROOT CAUSE ANALYSIS</Mono>
                  <div className="mt-6 space-y-5">
                    {causeRows.map((cause, index) => <CauseBar key={`${cause.name}-${index}`} name={cause.name} value={cause.value} />)}
                  </div>
                  <div className="mt-7 rounded-[18px] bg-[#0A0A0A] p-5 text-white">
                    <div className="font-black text-[#FFCC00]">DRRKOBE INTERPRETATION</div>
                    <p className="mt-2 text-sm leading-6 text-zinc-300">{ai?.summary || `Health Score ${health}% terbentuk dari kombinasi usia battery, pola ${shift} shift, charging, downtime, frekuensi isi air, dan ${selectedIssues.length} masalah yang dipilih. Analisis lanjutan sedang diproses tanpa menahan hasil utama.`}</p>
                  </div>
                  {!ai?.analyzed && <div className="mt-4 flex items-center gap-3 text-xs font-bold text-zinc-500"><span className="h-2 w-2 animate-pulse rounded-full bg-[#FFCC00]" /> Analisis teknis lanjutan sedang diproses...</div>}
                  <div className="mt-7 grid gap-3 sm:grid-cols-2">
                    <Metric label="Dampak" value={`${selectedIssues.length} masalah saling berkaitan`} />
                    <Metric label="Selanjutnya" value="Dampak operasional & perbandingan teknologi" />
                  </div>
                </div>
              </div>
            </div>
            <Nav onBack={() => setStep(4)} onNext={() => setStep(6)} nextLabel="Lihat Dampak" />
          </StepFrame>
        )}

        {step === 6 && diagnosis && (
          <StepFrame eyebrow="STEP 6 / 9 — AGGREGATED IMPACT" title="Dampak Operasional Gabungan">
            <Mono>DRRKOBE Reporting Engine • {selectedIssues.length} masalah • tanpa nominal harga</Mono>
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Downtime" value={`${downtimeHours} jam/bulan`} sub="Perkiraan waktu berhenti tidak terencana" />
              <MetricCard label="Charging Exposure" value={`${chargingWaste} jam/bulan`} sub="Waktu charging yang tidak produktif" />
              <MetricCard label="Maintenance" value={`${maintenanceYear} tindakan/tahun`} sub="Isi air dan pemeriksaan rutin" />
              <MetricCard label="Productivity" value={`-${productivityLoss}%`} sub="Terhadap jam operasional tersedia" />
            </div>
            <Panel className="mt-6">
              <div className="font-black">Kontribusi tiap masalah terhadap kondisi operasional</div>
              <div className="mt-6 space-y-5">
                {selectedIssueLabels.slice(0, 5).map((label, index) => {
                  const width = Math.max(25, 78 - index * 9);
                  return <div key={label}><div className="mb-2 flex justify-between text-xs text-zinc-600"><span>{label}</span><span>{width}% bobot indikasi</span></div><div className="h-3 overflow-hidden rounded-full bg-zinc-100"><div className="h-full bg-[#0A0A0A]" style={{ width: `${width}%` }} /></div></div>;
                })}
              </div>
              <p className="mt-6 text-xs leading-5 text-zinc-500">Angka di atas adalah indikator operasional berdasarkan data yang diisi. Tidak ada harga atau nominal biaya yang ditampilkan.</p>
            </Panel>
            <Nav onBack={() => setStep(5)} onNext={() => setStep(7)} nextLabel="Lihat Perbandingan Teknologi" />
          </StepFrame>
        )}

        {step === 7 && (
          <StepFrame eyebrow="STEP 7 / 9 — TECHNOLOGY COMPARISON" title="Lead Acid vs Lithium-ion — Perbandingan Teknis">
            <div className="overflow-x-auto rounded-[24px] border border-zinc-200 bg-white">
              <table className="min-w-[760px] w-full border-collapse text-sm">
                <thead><tr className="bg-[#0A0A0A] text-left text-white"><th className="p-5">PARAMETER</th><th className="p-5">LEAD ACID (CURRENT)</th><th className="bg-[#FFCC00] p-5 text-black">LI-ION (TARGET)</th></tr></thead>
                <tbody>{comparisonRows.map(([parameter, lead, lithium]) => <tr key={parameter} className="border-b border-zinc-100 last:border-0"><td className="p-5 font-black">{parameter}</td><td className="p-5 text-zinc-600">{lead}</td><td className="bg-[#FFFEF0] p-5 font-bold">{lithium}</td></tr>)}</tbody>
              </table>
            </div>
            <div className="mt-4 rounded-xl border border-dashed border-zinc-300 bg-white p-4 text-xs leading-5 text-zinc-600"><b className="text-black">Tidak ada harga yang ditampilkan.</b> Perbandingan ini digunakan sebagai bahan evaluasi teknis dan operasional.</div>
            <Nav onBack={() => setStep(6)} onNext={() => setStep(8)} nextLabel="Hitung Potensi Efisiensi" yellow />
          </StepFrame>
        )}

        {step === 8 && (
          <StepFrame eyebrow="STEP 8 / 9 — ROI SIMULATOR" title={`Hitung Potensi Efisiensi — ${selectedIssues.length} Masalah`}>
            <div className="grid gap-6 lg:grid-cols-[.9fr_1.35fr]">
              <Panel>
                <Range label={`Jumlah Forklift: ${jumlahForklift}`} value={jumlahForklift} min={1} max={20} onChange={setJumlahForklift} />
                <div className="mt-7"><Range label={`Jam Operasi / Hari: ${roiJamOperasi}h`} value={roiJamOperasi} min={8} max={24} onChange={setRoiJamOperasi} /></div>
                <div className="mt-7"><Choice label="Shift" value={roiShift} values={[1, 2, 3]} onChange={setRoiShift} suffix=" Shift" /></div>
                <div className="mt-7 rounded-xl bg-[#FFFEF0] p-4 text-xs leading-5"><b>Catatan:</b> simulasi hanya menampilkan potensi efisiensi operasional tanpa nominal harga.</div>
              </Panel>
              <div className="rounded-[24px] bg-[#0A0A0A] p-7 text-white">
                <Mono className="text-zinc-400">SIMULASI • {jumlahForklift} unit • {roiJamOperasi} jam • {roiShift} shift</Mono>
                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  <DarkResult label="Downtime" value={`-${roiDowntime}%`} sub="Potensi pengurangan downtime" />
                  <DarkResult label="Energy" value="+28%" sub="Potensi peningkatan efisiensi energi" />
                  <DarkResult label="Maintenance" value="-90%" sub="Potensi pengurangan watering & equalizing" />
                  <DarkResult label="Payback" value={payback} sub="Indikator operasional, tanpa nominal harga" />
                </div>
                <div className="mt-6 rounded-[16px] bg-[#FFCC00] p-5 text-black"><b>Potensi operasional:</b> semakin tinggi jam operasi, jumlah unit, dan shift, semakin besar manfaat opportunity charging dan pengurangan downtime yang perlu divalidasi melalui assessment.</div>
              </div>
            </div>
            <Nav onBack={() => setStep(7)} onNext={() => setStep(9)} nextLabel="Lihat Rekomendasi Final" />
          </StepFrame>
        )}

        {step === 9 && diagnosis && (
          <StepFrame eyebrow="STEP 9 / 9 — RECOMMENDATION" title="Rekomendasi DRRKOBE">
            <div className="grid gap-6 lg:grid-cols-[.9fr_1.3fr]">
              <div>
                <Panel>
                  <span className="inline-flex rounded-full bg-red-500 px-3 py-1 text-xs font-black text-white">{health <= 65 ? 'UPGRADE LAYAK DIPERTIMBANGKAN' : 'ASSESSMENT DIREKOMENDASIKAN'} — {selectedIssues.length} MASALAH TERINDIKASI</span>
                  <h3 className="mt-5 text-xl font-black">{selectedModel?.model_code || selectedModel?.name} • Lead Acid health {health}% • Urgensi {urgency}</h3>
                  <p className="mt-4 text-sm leading-6 text-zinc-600">Diagnosis membaca {selectedIssues.length} masalah yang saling berkaitan pada pola operasi {shift} shift / {jamOperasi} jam per hari. Rekomendasi akhir tetap membutuhkan validasi kondisi aktual sebelum keputusan perubahan teknologi.</p>
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <Metric label="Confidence" value={`${confidence}%`} />
                    <Metric label="Issues" value={`${selectedIssues.length}`} dark />
                    <Metric label="Target" value="Li-ion" />
                  </div>
                </Panel>
                <div className="mt-4 rounded-[18px] bg-[#0A0A0A] p-5 text-sm text-white"><b className="text-[#FFCC00]">Pemeriksaan berikutnya:</b> {ai?.recommended_actions?.[0] || 'Jadwalkan battery assessment on-site untuk memeriksa kapasitas aktual, charger, kondisi cell, dan duty cycle.'}</div>
              </div>
              <div className="rounded-[28px] bg-[#0A0A0A] p-8 text-center text-white">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#FFCC00] text-3xl text-black">✓</div>
                <h2 className="mt-6 text-3xl font-black">Diagnosis Selesai</h2>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-zinc-300">Data diagnosis, kondisi operasional, dampak, dan simulasi efisiensi sudah dirangkum. Kirim ringkasan ini melalui WhatsApp untuk melanjutkan technical assessment.</p>
                <div className="mx-auto mt-7 max-w-xl rounded-[18px] border border-white/10 bg-white/[0.06] p-5 text-left">
                  <Mono className="text-zinc-400">DIAGNOSIS SUMMARY • DRRKOBE.COM/BIP</Mono>
                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><KeyValue label="Model" value={selectedModel?.model_code || selectedModel?.name || '-'} dark /><KeyValue label="Battery" value={`Lead Acid • ${health}% health`} dark /><KeyValue label="Issues" value={`${selectedIssues.length} masalah`} dark /><KeyValue label="Urgency" value={urgency} dark /></div>
                </div>
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#FFCC00] px-6 py-3 text-sm font-black text-black transition hover:bg-[#F5C000]">Request Assessment via WhatsApp →</a>
                  <button type="button" onClick={resetFlow} className="rounded-full border border-white/20 px-6 py-3 text-sm font-bold">Mulai Diagnosis Baru</button>
                </div>
                <p className="mt-4 text-xs leading-5 text-zinc-500">Pesan WhatsApp dibuat otomatis dari data yang Anda isi dan hasil diagnosis pada sesi ini.</p>
              </div>
            </div>
          </StepFrame>
        )}
      </div>

      <style jsx global>{`
        .drr-input{margin-top:.5rem;width:100%;border-radius:12px;border:1px solid #d4d4d8;background:#fff;padding:.8rem 1rem;color:#0a0a0a;outline:none}.drr-input:focus{border-color:#FFCC00;box-shadow:0 0 0 3px rgba(255,204,0,.22)}
      `}</style>
    </main>
  );
}

function Progress({ step }: { step: number }) {
  return <div className="border-b border-zinc-200 bg-white"><div className="mx-auto flex min-h-[54px] max-w-[1280px] items-center justify-between gap-5 overflow-x-auto px-4 sm:px-6 lg:px-8"><div className="flex min-w-[650px] items-center">{Array.from({ length: 9 }, (_, index) => index + 1).map((number) => <div key={number} className="flex items-center"><div className={`grid h-7 w-7 place-items-center rounded-full text-xs font-black ${number <= step ? 'bg-[#0A0A0A] text-white' : 'border border-zinc-200 bg-white text-zinc-400'}`}>{number}</div>{number < 9 && <div className={`mx-2 h-px w-9 ${number < step ? 'bg-[#0A0A0A]' : 'bg-zinc-200'}`} />}</div>)}</div><div className="whitespace-nowrap text-[11px] font-semibold"><span className="font-mono text-zinc-500">DRRKOBE Diagnostic Engine</span><span className="mx-3 text-zinc-300">|</span>Step {step}/9</div></div></div>;
}

function StepFrame({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <section className="mx-auto max-w-[1160px]"><Mono>{eyebrow}</Mono><h1 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-4xl"><span className="bg-[linear-gradient(transparent_62%,rgba(255,204,0,.33)_62%)]">{title}</span></h1><div className="mt-8">{children}</div></section>;
}

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <div className={`rounded-[24px] border border-zinc-200 bg-white p-6 ${className}`}>{children}</div>; }
function Label({ children }: { children: React.ReactNode }) { return <div className="text-sm font-black">{children}</div>; }
function Mono({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <div className={`font-mono text-[11px] font-semibold tracking-[.12em] text-zinc-500 ${className}`}>{children}</div>; }

function Nav({ onBack, onNext, error, nextLabel = 'Lanjutkan', disabled = false, yellow = false }: { onBack?: () => void; onNext: () => void; error?: string; nextLabel?: string; disabled?: boolean; yellow?: boolean }) {
  return <div className="mt-8"><div className="flex flex-wrap items-center justify-between gap-3"><div>{onBack && <button type="button" onClick={onBack} className="rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-bold">Kembali</button>}</div><button type="button" onClick={onNext} disabled={disabled} className={`rounded-full px-6 py-3 text-sm font-black disabled:opacity-40 ${yellow ? 'bg-[#FFCC00] text-black' : 'bg-[#0A0A0A] text-white'}`}>{nextLabel} →</button></div>{error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}</div>;
}

function Metric({ label, value, dark = false }: { label: string; value: string; dark?: boolean }) { return <div className={`rounded-xl border p-4 ${dark ? 'border-white/10 bg-white/[0.06]' : 'border-zinc-200 bg-white'}`}><div className={`text-[10px] font-bold uppercase tracking-[.14em] ${dark ? 'text-zinc-400' : 'text-zinc-500'}`}>{label}</div><div className="mt-1 text-sm font-black">{value}</div></div>; }
function MetricCard({ label, value, sub }: { label: string; value: string; sub: string }) { return <div className="rounded-[20px] border border-zinc-200 bg-white p-6"><Mono>{label}</Mono><div className="mt-4 text-2xl font-black">{value}</div><div className="mt-2 text-xs text-zinc-500">{sub}</div></div>; }
function DarkResult({ label, value, sub }: { label: string; value: string; sub: string }) { return <div className="rounded-[18px] border border-white/10 bg-white/[0.06] p-6"><Mono className="text-zinc-400">{label}</Mono><div className="mt-3 text-3xl font-black">{value}</div><div className="mt-2 text-xs text-zinc-400">{sub}</div></div>; }

function YesNo({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) { return <Panel><Label>{label}</Label><div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => onChange(true)} className={`rounded-full border px-4 py-3 text-sm font-black ${value ? 'border-black bg-black text-white' : 'border-zinc-200'}`}>Ya</button><button type="button" onClick={() => onChange(false)} className={`rounded-full border px-4 py-3 text-sm font-black ${!value ? 'border-black bg-black text-white' : 'border-zinc-200'}`}>Tidak</button></div></Panel>; }
function Choice({ label, value, values, onChange, suffix = '' }: { label: string; value: number; values: number[]; onChange: (value: number) => void; suffix?: string }) { return <Panel><Label>{label}</Label><div className="mt-4 flex flex-wrap gap-2">{values.map((item) => <button key={item} type="button" onClick={() => onChange(item)} className={`min-w-[58px] flex-1 rounded-full border px-3 py-3 text-sm font-black ${value === item ? 'border-black bg-black text-white' : 'border-zinc-200 bg-white'}`}>{item}{suffix}</button>)}</div></Panel>; }
function Range({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) { return <div><Label>{label}</Label><input className="mt-4 w-full" type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} /><div className="mt-1 flex justify-between text-[10px] text-zinc-400"><span>{min}</span><span>{max}</span></div></div>; }
function KeyValue({ label, value, dark = false }: { label: string; value: string; dark?: boolean }) { return <div className="flex items-center justify-between gap-4"><span className={dark ? 'text-zinc-400' : 'text-zinc-500'}>{label}</span><strong>{value}</strong></div>; }
function CauseBar({ name, value }: { name: string; value: number }) { return <div><div className="mb-2 flex items-center justify-between text-sm font-black"><span>{name}</span><span>{value}%</span></div><div className="h-2 overflow-hidden rounded-full bg-zinc-100"><div className="h-full bg-[#FFCC00]" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div></div>; }
function HealthGauge({ value }: { value: number }) { const color = value <= 40 ? '#EF4444' : value <= 80 ? '#FFCC00' : '#22C55E'; return <div className="mt-7 flex justify-center"><div className="grid h-44 w-44 place-items-center rounded-full" style={{ background: `conic-gradient(${color} ${value * 3.6}deg,#f4f4f5 0deg)` }}><div className="grid h-36 w-36 place-items-center rounded-full bg-white text-center"><div><div className="text-5xl font-black">{value}%</div><div className="mt-1 text-xs font-black uppercase" style={{ color }}>{value <= 40 ? 'Critical' : value <= 65 ? 'Bad' : value <= 80 ? 'Caution' : 'Good'}</div></div></div></div></div>; }
