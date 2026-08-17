'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const API_BASE = 'https://api.drrkobe.com/api/v1';

type Cause = { cause: string; confidence: number; reason: string };
type ResultPayload = {
  success: boolean;
  data: {
    diagnosis_id: string;
    health_score: number;
    category: string;
    battery_type: string;
    umur_battery: number;
    shift: number;
    jam_operasi: number;
    answers?: { cepat_habis?: boolean; charging_lama?: boolean; isi_air?: number; downtime?: boolean };
    forklift: {
      brand?: string;
      model?: string;
      model_code?: string;
      category?: string;
      capacity_kg?: number;
      battery_voltage?: number;
      battery_capacity_ah?: number;
    };
    ai: {
      analyzed: boolean;
      summary: string | null;
      probable_causes: Cause[];
      technical_findings: string[];
      recommended_actions: string[];
      limitations: string[];
      urgency: string | null;
      confidence: number | null;
      analyzed_at: string | null;
    };
  };
};

export default function DiagnosisResultPage() {
  const params = useParams<{ id: string }>();
  const [payload, setPayload] = useState<ResultPayload | null>(null);
  const [error, setError] = useState('');
  const [aiRunning, setAiRunning] = useState(false);
  const analyzeStarted = useRef(false);

  async function loadResult(id: string) {
    const response = await fetch(`${API_BASE}/diagnosis/${id}/result`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.message ?? 'Hasil diagnosis tidak dapat dimuat.');
    setPayload(json);
    return json as ResultPayload;
  }

  useEffect(() => {
    if (!params?.id) return;
    loadResult(params.id).catch((err: Error) => setError(err.message));
  }, [params?.id]);

  useEffect(() => {
    if (!params?.id || !payload || payload.data.ai.analyzed || analyzeStarted.current) return;

    analyzeStarted.current = true;
    setAiRunning(true);

    fetch(`${API_BASE}/ai/diagnosis/${params.id}/analyze`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Analisis AI belum berhasil diselesaikan.');
        await loadResult(params.id);
      })
      .catch(() => {
        // Health Score tetap valid walaupun enrichment AI gagal.
      })
      .finally(() => setAiRunning(false));
  }, [params?.id, payload?.data.ai.analyzed]);

  if (error) return <main className="min-h-screen bg-[#FCFCF9] px-5 py-10"><div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-6 font-semibold text-red-700">{error}</div></main>;
  if (!payload) return <main className="flex min-h-screen items-center justify-center bg-[#FCFCF9]"><div className="font-bold text-zinc-600">Menghitung hasil diagnosis...</div></main>;

  const { data } = payload;
  const score = Math.max(0, Math.min(100, data.health_score));
  const circumference = 2 * Math.PI * 58;
  const dash = (score / 100) * circumference;
  const isLeadAcid = data.battery_type === 'lead_acid';
  const utilizationLabel = data.shift >= 3 || data.jam_operasi >= 18 ? 'Sangat tinggi' : data.shift >= 2 || data.jam_operasi >= 12 ? 'Tinggi' : 'Normal';

  return (
    <main className="min-h-screen bg-[#FCFCF9] pb-16 text-[#0A0A0A]">
      <header className="border-b border-zinc-200 bg-white/90 px-5 py-4 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div><div className="text-sm font-black tracking-[0.22em]">DRRKOBE</div><div className="text-[10px] font-bold tracking-[0.18em] text-zinc-500">BATTERY INTELLIGENCE PLATFORM</div></div>
          <Link href="/diagnosis/form" className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-bold hover:border-black">Diagnosis Baru</Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 pt-8 md:px-8 md:pt-10">
        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <article className="relative overflow-hidden rounded-[28px] bg-[#0A0A0A] p-7 text-white shadow-[0_20px_60px_rgba(0,0,0,0.16)]">
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#FFCC00]/20 blur-[40px]" />
            <p className="relative text-xs font-black uppercase tracking-[0.18em] text-[#FFCC00]">Battery Health</p>
            <div className="relative mt-5 grid place-items-center">
              <svg viewBox="0 0 140 140" className="h-44 w-44 -rotate-90">
                <circle cx="70" cy="70" r="58" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="12" />
                <circle cx="70" cy="70" r="58" fill="none" stroke="#FFCC00" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${dash} ${circumference - dash}`} />
              </svg>
              <div className="absolute text-center"><div className="text-5xl font-black">{score}</div><div className="text-xs font-bold text-zinc-400">/ 100</div></div>
            </div>
            <div className="relative mt-5 text-center"><span className="rounded-full bg-white/10 px-4 py-2 text-sm font-black uppercase tracking-wide">{data.category}</span></div>
            <div className="relative mt-7 border-t border-white/10 pt-5 text-sm leading-7 text-zinc-300">
              <div className="font-bold text-white">{data.forklift.brand || '-'} · {data.forklift.model_code || data.forklift.model || '-'}</div>
              <div>{isLeadAcid ? 'Lead Acid' : 'Lithium-ion'} · {data.umur_battery} tahun</div>
              <div>{data.shift} shift · {data.jam_operasi} jam operasi/hari</div>
            </div>
          </article>

          <article className="rounded-[28px] border border-zinc-200 bg-white p-7 shadow-sm md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">DRRKOBE Interpretation</p><h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Kondisi battery perlu perhatian.</h1></div>
              <StatusPill running={aiRunning || !data.ai.analyzed} confidence={data.ai.confidence} urgency={data.ai.urgency} />
            </div>

            {data.ai.analyzed ? (
              <p className="mt-6 max-w-3xl text-[16px] leading-8 text-zinc-700">{data.ai.summary}</p>
            ) : (
              <div className="mt-7 rounded-2xl border border-[#FFCC00]/40 bg-[#FFFEF0] p-5">
                <div className="flex items-center gap-3"><span className="h-3 w-3 animate-pulse rounded-full bg-[#FFCC00]" /><span className="font-black">Health Score sudah siap.</span></div>
                <p className="mt-2 text-sm leading-6 text-zinc-600">DRRKOBE Engine sedang memperdalam root cause dan rekomendasi teknis. Halaman ini tidak perlu di-refresh.</p>
              </div>
            )}

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <Metric label="Operational Load" value={utilizationLabel} />
              <Metric label="Shift" value={`${data.shift} / hari`} />
              <Metric label="Runtime" value={`${data.jam_operasi} jam`} />
            </div>
          </article>
        </section>

        <section className="mt-8 rounded-[28px] border border-zinc-200 bg-white p-7 shadow-sm md:p-8">
          <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Root Cause Analysis</p><h2 className="mt-2 text-2xl font-black">Indikasi penyebab utama</h2></div>{data.ai.analyzed && <span className="text-xs font-bold text-zinc-500">AI confidence {data.ai.confidence ?? '-'}%</span>}</div>
          <div className="mt-7 space-y-6">
            {data.ai.analyzed && data.ai.probable_causes.length ? data.ai.probable_causes.map((item, index) => (
              <div key={`${item.cause}-${index}`}>
                <div className="flex items-center justify-between gap-4"><span className="font-black">{item.cause}</span><span className="text-sm font-black">{item.confidence}%</span></div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100"><div className="h-full rounded-full bg-[#FFCC00] transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, item.confidence))}%` }} /></div>
                <p className="mt-2 max-w-4xl text-sm leading-6 text-zinc-600">{item.reason}</p>
              </div>
            )) : <LoadingLines />}
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <InfoCard eyebrow="Operational Impact" title="Paparan operasional">
            <BigValue>{data.jam_operasi}h</BigValue>
            <p className="text-sm leading-6 text-zinc-600">Jam operasi harian dengan pola {data.shift} shift. Semakin tinggi duty cycle, semakin penting konsistensi charging dan maintenance.</p>
          </InfoCard>
          <InfoCard eyebrow="Battery Profile" title="Konfigurasi unit">
            <BigValue>{data.forklift.battery_voltage ? `${data.forklift.battery_voltage}V` : '—'}</BigValue>
            <p className="text-sm leading-6 text-zinc-600">{data.forklift.battery_capacity_ah ? `${data.forklift.battery_capacity_ah}Ah · ` : ''}{isLeadAcid ? 'Lead Acid' : 'Lithium-ion'} · usia {data.umur_battery} tahun.</p>
          </InfoCard>
          <InfoCard eyebrow="Priority" title="Tingkat perhatian">
            <BigValue>{data.ai.urgency ? data.ai.urgency.toUpperCase() : data.category.toUpperCase()}</BigValue>
            <p className="text-sm leading-6 text-zinc-600">Prioritas final tetap perlu dikonfirmasi melalui pemeriksaan aktual di lapangan.</p>
          </InfoCard>
        </section>

        {isLeadAcid && (
          <section className="mt-8 overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 p-7 md:p-8"><p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Technology Comparison</p><h2 className="mt-2 text-2xl font-black">Lead Acid vs Lithium-ion</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">Perbandingan bersifat teknis dan operasional. Tidak menggunakan harga atau estimasi komersial.</p></div>
            <div className="grid md:grid-cols-2">
              <CompareColumn title="Lead Acid" highlighted={false} rows={[['Charging','Durasi lebih panjang'],['Maintenance','Watering & inspeksi rutin'],['Opportunity charging','Terbatas'],['Operational pattern','Perlu disiplin charging']]} />
              <CompareColumn title="Lithium-ion" highlighted rows={[['Charging','Lebih cepat'],['Maintenance','Lebih minimal'],['Opportunity charging','Lebih fleksibel'],['Operational pattern','Cocok untuk intensitas tinggi']]} />
            </div>
          </section>
        )}

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <InfoCard eyebrow="Technical Findings" title="Temuan utama">
            {data.ai.analyzed ? <BulletList items={data.ai.technical_findings.slice(0, 5)} /> : <LoadingLines />}
          </InfoCard>
          <InfoCard eyebrow="Recommended Actions" title="Langkah pemeriksaan">
            {data.ai.analyzed ? <BulletList items={data.ai.recommended_actions.slice(0, 5)} /> : <LoadingLines />}
          </InfoCard>
        </section>

        <section className="mt-8 rounded-[28px] bg-[#0A0A0A] p-7 text-white md:flex md:items-center md:justify-between md:gap-8 md:p-8">
          <div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#FFCC00]">DRRKOBE Recommendation</p><h2 className="mt-2 text-2xl font-black">Validasi kondisi aktual melalui technical assessment.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">Diagnosis ini membantu menentukan area pemeriksaan prioritas. Keputusan teknis akhir tetap berdasarkan inspeksi dan pengukuran aktual.</p></div>
          <span className="mt-6 inline-flex shrink-0 rounded-xl bg-[#FFCC00] px-5 py-3 text-sm font-black text-[#0A0A0A] md:mt-0">REQUEST TECHNICAL ASSESSMENT</span>
        </section>

        {data.ai.analyzed && data.ai.limitations.length > 0 && (
          <details className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600"><summary className="cursor-pointer font-bold text-zinc-900">Batasan analisis</summary><div className="mt-4"><BulletList items={data.ai.limitations} /></div></details>
        )}
      </div>
    </main>
  );
}

function StatusPill({ running, confidence, urgency }: { running: boolean; confidence: number | null; urgency: string | null }) {
  return running ? <span className="rounded-full bg-[#FFCC00]/20 px-4 py-2 text-xs font-black">AI ANALYSIS RUNNING</span> : <div className="flex gap-2"><span className="rounded-full bg-zinc-100 px-3 py-2 text-xs font-black">{urgency?.toUpperCase() || 'READY'}</span><span className="rounded-full bg-[#FFCC00]/20 px-3 py-2 text-xs font-black">{confidence ?? '-'}%</span></div>;
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-zinc-50 p-4"><div className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">{label}</div><div className="mt-1 text-lg font-black">{value}</div></div>; }
function InfoCard({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) { return <article className="rounded-[24px] border border-zinc-200 bg-white p-6 shadow-sm"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">{eyebrow}</p><h3 className="mt-2 text-xl font-black">{title}</h3><div className="mt-5">{children}</div></article>; }
function BigValue({ children }: { children: React.ReactNode }) { return <div className="mb-3 text-4xl font-black tracking-tight">{children}</div>; }
function BulletList({ items }: { items: string[] }) { return <ul className="space-y-3 text-sm leading-6 text-zinc-700">{items.map((item, index) => <li key={index} className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#FFCC00]" /><span>{item}</span></li>)}</ul>; }
function LoadingLines() { return <div className="space-y-3"><div className="h-4 w-3/4 animate-pulse rounded bg-zinc-100" /><div className="h-4 w-full animate-pulse rounded bg-zinc-100" /><div className="h-4 w-2/3 animate-pulse rounded bg-zinc-100" /></div>; }
function CompareColumn({ title, highlighted, rows }: { title: string; highlighted: boolean; rows: string[][] }) { return <div className={`p-7 md:p-8 ${highlighted ? 'bg-[#FFFEF0]' : ''}`}><div className="flex items-center justify-between"><h3 className="text-xl font-black">{title}</h3>{highlighted && <span className="rounded-full bg-[#FFCC00] px-3 py-1 text-[10px] font-black">HIGH-DUTY OPTION</span>}</div><div className="mt-6 space-y-4">{rows.map(([label,value]) => <div key={label} className="border-b border-zinc-200 pb-3"><div className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">{label}</div><div className="mt-1 font-bold">{value}</div></div>)}</div></div>; }
