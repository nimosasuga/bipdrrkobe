import Link from 'next/link';

const steps = [
  ['01', 'Pilih Model'],
  ['02', 'Battery Lead Acid'],
  ['03', 'Multi-Issue'],
  ['04', 'Detail Operasional'],
  ['05', 'Diagnosis'],
  ['06', 'Impact'],
  ['07', 'Compare'],
  ['08', 'ROI'],
  ['09', 'Recommendation'],
];

const capabilities = [
  {
    code: 'DRR-01',
    title: 'Deterministic Health Score',
    body: 'Health Score dihitung oleh engine Laravel berdasarkan input operasional. AI tidak dapat mengubah skor utama.',
  },
  {
    code: 'DRR-02',
    title: 'Aggregated Multi-Issue',
    body: 'Sepuluh kelompok masalah dibaca sebagai pola lintas keluhan agar diagnosis tidak berhenti pada satu gejala.',
  },
  {
    code: 'DRR-03',
    title: 'AI Technical Enrichment',
    body: 'AI memperkaya root cause, interpretation, dan priority checks tanpa mengarang telemetry yang tidak tersedia.',
  },
  {
    code: 'DRR-04',
    title: 'Operational Impact',
    body: 'Downtime, charging exposure, maintenance, dan productivity divisualisasikan sebagai indikator operasional.',
  },
];

const issues = [
  'Battery Cepat Habis',
  'Charger Lama / Error',
  'Downtime Sering',
  'Maintenance Tinggi',
  'Produktivitas Menurun',
  'Electrical Issue',
  'Hydraulic Lambat',
  'Drive / Steering',
  'Overheat',
  'Isi Air Sering',
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#FCFCF9] text-[#0A0A0A]">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-[76px] max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-10">
            <Link href="/" className="block">
              <div className="flex items-center gap-2 text-2xl font-black tracking-[-.045em]">
                DRRKOBE
                <span className="bg-[#FFCC00] px-1.5 py-0.5 text-[10px] font-black tracking-normal">BIP</span>
              </div>
              <div className="text-[8px] font-bold leading-[1.15] tracking-[.18em] text-zinc-400">
                DIAGNOSTIC RELIABILITY REPORTING<br />BATTERY INTELLIGENCE PLATFORM
              </div>
            </Link>

            <nav className="hidden items-center gap-8 text-sm font-semibold text-zinc-600 md:flex">
              <a href="#platform" className="transition hover:text-black">Platform</a>
              <Link href="/diagnosis/form" className="transition hover:text-black">Diagnosis</Link>
              <a href="#knowledge" className="transition hover:text-black">Knowledge</a>
            </nav>
          </div>

          <Link
            href="/diagnosis/form"
            className="rounded-full bg-[#FFCC00] px-5 py-3 text-sm font-black text-black transition hover:bg-[#F5C000]"
          >
            Mulai Diagnosis →
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-zinc-200 bg-white">
        <div className="pointer-events-none absolute -right-12 top-4 select-none text-[240px] font-black leading-none tracking-[-.08em] text-zinc-100 sm:text-[320px] lg:text-[420px]">
          BIP
        </div>

        <div className="relative mx-auto grid min-h-[680px] max-w-[1280px] items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.08fr_.92fr] lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[.14em]">
              <span className="h-2 w-2 rounded-full bg-[#FFCC00]" />
              Battery Intelligence Platform V2
            </div>

            <h1 className="mt-7 max-w-4xl text-[46px] font-black leading-[.94] tracking-[-.055em] sm:text-[64px] lg:text-[78px]">
              We Don&apos;t Sell Batteries.
              <span className="mt-2 block bg-[linear-gradient(transparent_65%,rgba(255,204,0,.6)_65%)]">We Reduce Your Downtime.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg">
              Platform diagnosis battery forklift Lead Acid berbasis data, deterministic Health Score, aggregated multi-issue analysis, dan AI technical enrichment.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/diagnosis/form" className="rounded-full bg-[#0A0A0A] px-7 py-4 text-sm font-black text-white transition hover:bg-black">
                Jalankan Diagnosis 9-Step →
              </Link>
              <a href="#platform" className="rounded-full border border-zinc-300 bg-white px-7 py-4 text-sm font-black transition hover:border-black">
                Lihat Cara Kerja
              </a>
            </div>

            <div className="mt-12 grid max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-[20px] border border-zinc-200 bg-zinc-200 sm:grid-cols-4">
              {[
                ['9', 'Diagnostic Steps'],
                ['10', 'Issue Types'],
                ['100%', 'No Pricing'],
                ['AI+', 'Technical Enrichment'],
              ].map(([value, label]) => (
                <div key={label} className="bg-white p-5">
                  <div className="text-2xl font-black">{value}</div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-[.12em] text-zinc-500">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[30px] bg-[#0A0A0A] p-6 text-white shadow-[0_30px_80px_rgba(0,0,0,.18)] sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-zinc-500">LIVE DIAGNOSTIC PREVIEW</div>
                  <div className="mt-2 text-xl font-black">Cross-Issue Battery Health</div>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-full bg-[#FFCC00] font-black text-black">BIP</div>
              </div>

              <div className="mt-8 grid gap-5 sm:grid-cols-[180px_1fr]">
                <div className="grid place-items-center rounded-[24px] border border-white/10 bg-white/[.04] p-5">
                  <div className="grid h-36 w-36 place-items-center rounded-full bg-[conic-gradient(#EF4444_0deg,#EF4444_108deg,#27272a_108deg)]">
                    <div className="grid h-28 w-28 place-items-center rounded-full bg-[#0A0A0A] text-center">
                      <div>
                        <div className="text-4xl font-black">30%</div>
                        <div className="mt-1 text-[10px] font-black uppercase tracking-[.14em] text-red-400">Critical</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    ['Battery Aging', 88],
                    ['Sulfation', 76],
                    ['Charging Inefficiency', 64],
                    ['Maintenance Gap', 52],
                  ].map(([name, value]) => (
                    <div key={String(name)}>
                      <div className="mb-2 flex justify-between text-xs font-bold">
                        <span>{name}</span><span>{value}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                        <div className="h-full rounded-full bg-[#FFCC00]" style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-7 rounded-[18px] bg-[#FFCC00] p-5 text-black">
                <div className="text-xs font-black uppercase tracking-[.12em]">DRRKOBE Interpretation</div>
                <p className="mt-2 text-sm leading-6">Health Score deterministic tampil terlebih dahulu. AI memperdalam root cause tanpa menahan user menunggu hasil utama.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="platform" className="border-b border-zinc-200 bg-[#FCFCF9]">
        <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-zinc-500">THE 9-STEP DIAGNOSTIC JOURNEY</p>
            <h2 className="mt-3 text-4xl font-black leading-[.98] tracking-[-.05em] sm:text-5xl">Satu alur dari kondisi aktual sampai rekomendasi teknis.</h2>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map(([number, label], index) => (
              <div key={number} className={`group rounded-[20px] border p-5 transition ${index === 4 ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white' : 'border-zinc-200 bg-white hover:border-zinc-400'}`}>
                <div className={`text-xs font-black ${index === 4 ? 'text-[#FFCC00]' : 'text-zinc-400'}`}>{number}</div>
                <div className="mt-6 flex items-end justify-between gap-4">
                  <h3 className="text-lg font-black">{label}</h3>
                  <span className={`text-xl ${index === 4 ? 'text-[#FFCC00]' : 'text-zinc-300'}`}>→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-zinc-500">AGGREGATED MULTI-ISSUE</p>
              <h2 className="mt-3 text-4xl font-black leading-[.98] tracking-[-.05em] sm:text-5xl">Satu battery bisa menunjukkan banyak gejala sekaligus.</h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-zinc-600">DRRKOBE tidak memaksa user memilih satu masalah utama. Semua gejala dapat dipilih lalu dianalisis sebagai satu konteks operasional.</p>
            </div>

            <div className="flex flex-wrap content-start gap-3">
              {issues.map((issue, index) => (
                <span key={issue} className={`rounded-full border px-4 py-2.5 text-sm font-bold ${index < 3 ? 'border-[#FFCC00] bg-[#FFFEF0]' : 'border-zinc-200 bg-[#FCFCF9]'}`}>
                  {issue}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="knowledge" className="border-b border-zinc-200 bg-[#FCFCF9]">
        <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-zinc-500">ENGINE CAPABILITIES</p>
            <h2 className="mt-3 text-4xl font-black leading-[.98] tracking-[-.05em] sm:text-5xl">Diagnosis yang tajam tanpa menjadi black box.</h2>
          </div>

          <div className="mt-10 grid gap-px overflow-hidden rounded-[24px] border border-zinc-200 bg-zinc-200 md:grid-cols-2">
            {capabilities.map((item) => (
              <article key={item.code} className="bg-white p-7 sm:p-8">
                <div className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-zinc-400">{item.code}</div>
                <h3 className="mt-5 text-2xl font-black tracking-[-.03em]">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-zinc-600">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0A0A0A] text-white">
        <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-end lg:px-8 lg:py-20">
          <div className="max-w-4xl">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-zinc-500">START DIAGNOSTIC SESSION</p>
            <h2 className="mt-4 text-4xl font-black leading-[.95] tracking-[-.05em] sm:text-6xl">Kenali sumber downtime sebelum memutuskan langkah berikutnya.</h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-400">Tidak ada harga yang ditampilkan. Hasil diarahkan ke technical assessment dan validasi aktual di lapangan.</p>
          </div>

          <Link href="/diagnosis/form" className="inline-flex items-center justify-center rounded-full bg-[#FFCC00] px-7 py-4 text-sm font-black text-black transition hover:bg-[#F5C000]">
            Mulai Diagnosis →
          </Link>
        </div>
      </section>
    </main>
  );
}
