'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = 'https://api.drrkobe.com/api/v1';

type Brand = {
  id: string;
  name: string;
  slug: string;
};

type ForkliftModel = {
  id: string;
  brand_id: string;
  name: string;
  model_code: string | null;
  category: string | null;
  capacity_kg: number | null;
  battery_voltage: number | null;
  battery_capacity_ah: number | null;
  default_battery_type: 'lead_acid' | 'lithium' | null;
};

export default function DiagnosisFormPage() {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<ForkliftModel[]>([]);
  const [brandId, setBrandId] = useState('');
  const [modelId, setModelId] = useState('');
  const [batteryType, setBatteryType] = useState<'lead_acid' | 'lithium'>('lead_acid');
  const [umur, setUmur] = useState(4);
  const [shift, setShift] = useState(2);
  const [jamOperasi, setJamOperasi] = useState(16);
  const [cepatHabis, setCepatHabis] = useState(true);
  const [chargingLama, setChargingLama] = useState(true);
  const [isiAir, setIsiAir] = useState(1);
  const [downtime, setDowntime] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/master/brands`, {
      headers: { Accept: 'application/json' },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Gagal mengambil data brand.');
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
    setError('');

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

  const selectedModel = useMemo(
    () => models.find((model) => model.id === modelId) ?? null,
    [models, modelId],
  );

  useEffect(() => {
    if (selectedModel?.default_battery_type === 'lead_acid' || selectedModel?.default_battery_type === 'lithium') {
      setBatteryType(selectedModel.default_battery_type);
    }
  }, [selectedModel]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!brandId || !modelId) {
      setError('Pilih brand dan model forklift terlebih dahulu.');
      return;
    }

    setLoading(true);

    try {
      const sessionId = crypto.randomUUID();

      const diagnosisResponse = await fetch(`${API_BASE}/diagnose`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          model_id: modelId,
          battery_type: batteryType,
          umur,
          shift,
          jam_operasi: jamOperasi,
          answers: {
            cepat_habis: cepatHabis,
            charging_lama: chargingLama,
            isi_air: isiAir,
            downtime,
          },
        }),
      });

      const diagnosisPayload = await diagnosisResponse.json();

      if (!diagnosisResponse.ok || !diagnosisPayload.diagnosis_id) {
        throw new Error(diagnosisPayload.message ?? 'Diagnosis gagal diproses.');
      }

      const diagnosisId = diagnosisPayload.diagnosis_id as string;

      const aiResponse = await fetch(`${API_BASE}/ai/diagnosis/${diagnosisId}/analyze`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });

      if (!aiResponse.ok) {
        throw new Error('Health Score berhasil dihitung, tetapi analisis AI gagal diproses.');
      }

      router.push(`/diagnosis/result/${diagnosisId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses diagnosis.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 md:px-10 md:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-700">DRRKOBE BIP</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">Form Diagnosis Battery</h1>
          <p className="mt-3 max-w-2xl text-slate-600">Isi data aktual unit. Health Score dihitung oleh engine Laravel, kemudian AI hanya memperkaya analisis teknis.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">1. Identifikasi Forklift</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                Brand
                <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal text-slate-950 outline-none focus:border-blue-600">
                  <option value="">Pilih brand</option>
                  {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                </select>
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Model Forklift
                <select value={modelId} onChange={(e) => setModelId(e.target.value)} disabled={!brandId || loadingModels} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal text-slate-950 outline-none disabled:bg-slate-100 focus:border-blue-600">
                  <option value="">{loadingModels ? 'Memuat model...' : 'Pilih model'}</option>
                  {models.map((model) => <option key={model.id} value={model.id}>{model.model_code || model.name} — {model.name}</option>)}
                </select>
              </label>
            </div>

            {selectedModel && (
              <div className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
                <div><span className="font-semibold">Kategori:</span> {selectedModel.category || '-'}</div>
                <div><span className="font-semibold">Kapasitas:</span> {selectedModel.capacity_kg ? `${selectedModel.capacity_kg} kg` : '-'}</div>
                <div><span className="font-semibold">Voltage:</span> {selectedModel.battery_voltage ? `${selectedModel.battery_voltage} V` : '-'}</div>
                <div><span className="font-semibold">Battery:</span> {selectedModel.battery_capacity_ah ? `${selectedModel.battery_capacity_ah} Ah` : '-'}</div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">2. Data Operasional Battery</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <label className="text-sm font-semibold text-slate-700">Tipe Battery
                <select value={batteryType} onChange={(e) => setBatteryType(e.target.value as 'lead_acid' | 'lithium')} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal">
                  <option value="lead_acid">Lead Acid</option>
                  <option value="lithium">Lithium-ion</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-700">Usia Battery (tahun)
                <input type="number" min={0} max={20} value={umur} onChange={(e) => setUmur(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" />
              </label>
              <label className="text-sm font-semibold text-slate-700">Shift per hari
                <input type="number" min={1} max={3} value={shift} onChange={(e) => setShift(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" />
              </label>
              <label className="text-sm font-semibold text-slate-700">Jam operasi / hari
                <input type="number" min={1} max={24} value={jamOperasi} onChange={(e) => setJamOperasi(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">3. Kondisi Aktual</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Toggle label="Battery terasa cepat habis" checked={cepatHabis} onChange={setCepatHabis} />
              <Toggle label="Proses charging terasa lama" checked={chargingLama} onChange={setChargingLama} />
              <Toggle label="Terjadi downtime terkait battery" checked={downtime} onChange={setDowntime} />
              <label className="rounded-xl border border-slate-200 p-4 text-sm font-semibold text-slate-700">Frekuensi isi air / minggu
                <input type="number" min={0} max={7} value={isiAir} onChange={(e) => setIsiAir(Number(e.target.value))} className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" />
              </label>
            </div>
          </section>

          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

          <button type="submit" disabled={loading} className="w-full rounded-xl bg-slate-950 px-5 py-4 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? 'Menghitung Health Score & Analisis AI...' : 'Proses Diagnosis'}
          </button>
        </form>
      </div>
    </main>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-blue-700" />
    </label>
  );
}
