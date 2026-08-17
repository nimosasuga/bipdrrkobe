'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const API_BASE = 'https://api.drrkobe.com/api/v1';

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
      probable_causes: Array<{ cause: string; confidence: number; reason: string }>;
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

  useEffect(() => {
    if (!params?.id) return;

    fetch(`${API_BASE}/diagnosis/${params.id}/result`, {
      headers: { Accept: 'application/json' },
    })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) throw new Error(json.message ?? 'Hasil diagnosis tidak dapat dimuat.');
        return json;
      })
      .then(setPayload)
      .catch((err: Error) => setError(err.message));
  }, [params?.id]);

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
      </main>
    );
  }

  if (!payload) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="text-sm font-semibold text-slate-600">Memuat hasil diagnosis...</div>
      </main>
    );
  }

  const { data } = payload;

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 md:px-10 md:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-700">DRRKOBE BIP</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">Hasil Diagnosis Battery</h1>
          </div>
          <Link href="/diagnosis/form" className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">Diagnosis Baru</Link>
        </div>

        <section className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_1.9fr]">
          <div className="rounded-3xl bg-slate-950 p-7 text-white">
            <p className="text-sm font-semibold text-slate-400">Battery Health Score</p>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-7xl font-black tracking-tight">{data.health_score}</span>
              <span className="mb-2 text-xl text-slate-400">/100</span>
            </div>
            <div className="mt-5 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-bold">{data.category}</div>
            <div className="mt-8 space-y-2 text-sm text-slate-300">
              <div>{data.forklift.brand || '-'} · {data.forklift.model_code || data.forklift.model || '-'}</div>
              <div>{data.battery_type === 'lead_acid' ? 'Lead Acid' : 'Lithium-ion'} · {data.umur_battery} tahun</div>
              <div>{data.shift} shift · {data.jam_operasi} jam operasi/hari</div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-950">Analisis Teknis AI</h2>
              <div className="flex gap-2 text-xs font-bold">
                <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-700">Urgency: {data.ai.urgency || '-'}</span>
                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-blue-700">Confidence: {data.ai.confidence ?? '-'}%</span>
              </div>
            </div>
            <p className="mt-5 leading-7 text-slate-700">{data.ai.summary || 'Analisis AI belum tersedia.'}</p>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <ResultCard title="Probable Causes">
            <div className="space-y-4">
              {data.ai.probable_causes.map((item, index) => (
                <div key={`${item.cause}-${index}`} className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-bold text-slate-950">{item.cause}</h3>
                    <span className="text-sm font-bold text-blue-700">{item.confidence}%</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.reason}</p>
                </div>
              ))}
            </div>
          </ResultCard>

          <ResultCard title="Technical Findings">
            <BulletList items={data.ai.technical_findings} />
          </ResultCard>

          <ResultCard title="Recommended Actions">
            <BulletList items={data.ai.recommended_actions} />
          </ResultCard>

          <ResultCard title="Limitations">
            <BulletList items={data.ai.limitations} />
          </ResultCard>
        </section>

        <section className="mt-6 rounded-3xl bg-blue-700 p-7 text-white md:flex md:items-center md:justify-between md:gap-8">
          <div>
            <h2 className="text-xl font-bold">Butuh assessment teknis lebih lanjut?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">Hasil ini merupakan diagnosis awal berbasis data yang Anda masukkan. Validasi kondisi aktual tetap memerlukan pemeriksaan teknis di lapangan.</p>
          </div>
          <span className="mt-5 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-700 md:mt-0">Technical Assessment</span>
        </section>
      </div>
    </main>
  );
}

function ResultCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </article>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (!items.length) return <p className="text-sm text-slate-500">Belum ada data.</p>;

  return (
    <ul className="space-y-3 text-sm leading-6 text-slate-700">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-700" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
