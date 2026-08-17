'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = 'https://api.drrkobe.com/api/v1';

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
    fetch(`${API_BASE}/master/brands`, { headers: { Accept: 'application/json' } })
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
      const diagnosisResponse = await fetch(`${API_BASE}/diagnose`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: crypto.randomUUID(),
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

      // Health Score sudah tersedia. Jangan menahan customer menunggu AI.
      router.push(`/diagnosis/result/${diagnosisPayload.diagnosis_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses diagnosis.');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FCFCF9] px-5 py-8 md:px-10 md:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#0A0A0A]">DRRKOBE BIP</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-[#0A0A0A] md:text-4xl">Form Diagnosis Battery</h1>
          <p className="mt-3 max-w-2xl text-zinc-600">Isi data aktual unit. Health Score dihitung langsung oleh engine DRRKOBE. Analisis AI diproses setelah hasil utama tampil.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Section title="01 · Identifikasi Forklift">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Brand">
                <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className="input">
                  <option value="">Pilih brand</option>
                  {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                </select>
              </Field>
              <Field label="Model Forklift">
                <select value={modelId} onChange={(e) => setModelId(e.target.value)} disabled={!brandId || loadingModels} className="input disabled:bg-zinc-100">
                  <option value="">{loadingModels ? 'Memuat model...' : 'Pilih model'}</option>
                  {models.map((model) => <option key={model.id} value={model.id}>{model.model_code || model.name} — {model.name}</option>)}
                </select>
              </Field>
            </div>
            {selectedModel && (
              <div className="mt-5 grid gap-3 rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-700 sm:grid-cols-2 lg:grid-cols-4">
                <div><b>Kategori</b><br />{selectedModel.category || '-'}</div>
                <div><b>Kapasitas</b><br />{selectedModel.capacity_kg ? `${selectedModel.capacity_kg} kg` : '-'}</div>
                <div><b>Voltage</b><br />{selectedModel.battery_voltage ? `${selectedModel.battery_voltage} V` : '-'}</div>
                <div><b>Battery</b><br />{selectedModel.battery_capacity_ah ? `${selectedModel.battery_capacity_ah} Ah` : '-'}</div>
              </div>
            )}
          </Section>

          <Section title="02 · Data Operasional">
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <Field label="Tipe Battery"><select value={batteryType} onChange={(e) => setBatteryType(e.target.value as 'lead_acid' | 'lithium')} className="input"><option value="lead_acid">Lead Acid</option><option value="lithium">Lithium-ion</option></select></Field>
              <Field label="Usia Battery (tahun)"><input type="number" min={0} max={20} value={umur} onChange={(e) => setUmur(Number(e.target.value))} className="input" /></Field>
              <Field label="Shift per hari"><input type="number" min={1} max={3} value={shift} onChange={(e) => setShift(Number(e.target.value))} className="input" /></Field>
              <Field label="Jam operasi / hari"><input type="number" min={1} max={24} value={jamOperasi} onChange={(e) => setJamOperasi(Number(e.target.value))} className="input" /></Field>
            </div>
          </Section>

          <Section title="03 · Kondisi Aktual">
            <div className="grid gap-4 md:grid-cols-2">
              <Toggle label="Battery terasa cepat habis" checked={cepatHabis} onChange={setCepatHabis} />
              <Toggle label="Proses charging terasa lama" checked={chargingLama} onChange={setChargingLama} />
              <Toggle label="Terjadi downtime terkait battery" checked={downtime} onChange={setDowntime} />
              <Field label="Frekuensi isi air / minggu"><input type="number" min={0} max={7} value={isiAir} onChange={(e) => setIsiAir(Number(e.target.value))} className="input" /></Field>
            </div>
          </Section>

          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

          <button type="submit" disabled={loading} className="w-full rounded-2xl bg-[#FFCC00] px-5 py-4 font-black text-[#0A0A0A] transition hover:bg-[#F5C000] disabled:opacity-50">
            {loading ? 'Menghitung Health Score...' : 'PROSES DIAGNOSIS'}
          </button>
        </form>
      </div>
      <style jsx global>{`.input{margin-top:.5rem;width:100%;border-radius:.75rem;border:1px solid #d4d4d8;background:white;padding:.75rem 1rem;font-weight:400;color:#0a0a0a;outline:none}.input:focus{border-color:#FFCC00;box-shadow:0 0 0 3px rgba(255,204,0,.2)}`}</style>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-[24px] border border-zinc-200 bg-white p-6 shadow-sm"><h2 className="mb-5 text-lg font-black text-[#0A0A0A]">{title}</h2>{children}</section>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-bold text-zinc-700">{label}{children}</label>;
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-zinc-200 p-4 text-sm font-bold text-zinc-700"><span>{label}</span><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-[#FFCC00]" /></label>;
}
