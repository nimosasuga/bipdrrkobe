import Link from 'next/link';

const steps = [
  'Unit & Operation Context',
  'Pilih Gejala Operasional',
  'Lengkapi Detail Kondisi',
  'AI Diagnosis Result',
  'Lead Acid vs Lithium-ion',
  'Business Impact & Cost Context',
  'Technical Assessment DRRKOBE',
];

export default function DiagnosisStartPage() {
  return (
    <main className="min-h-screen bg-[#FCFCF9] text-[#0A0A0A]">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-[76px] max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div>
            <div className="flex items-center gap-2 text-2xl font-black tracking-tight">DRRKOBE <span className="bg-[#FFCC00] px-1.5 py-0.5 text-[10px]">BIP</span></div>
            <div className="text-[8px] font-bold tracking-[.18em] text-zinc-400">DIAGNOSTIC RELIABILITY REPORTING<br/>BATTERY INTELLIGENCE PLATFORM</div>
          </div>
          <Link href="/diagnosis/form" className="rounded-full bg-[#FFCC00] px-5 py-3 text-sm font-black">Mulai Diagnosis →</Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1280px] gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-20">
        <div>
          <div className="font-mono text-[11px] font-semibold tracking-[.14em] text-zinc-500">DRRKOBE DIAGNOSTIC ENGINE • 7-STEP JOURNEY</div>
          <h1 className="mt-5 max-w-3xl text-5xl font-black tracking-[-.055em] sm:text-6xl">Diagnosis Lead Acid yang lebih ringkas di awal, tetapi tetap kuat untuk <span className="bg-[linear-gradient(transparent_62%,rgba(255,204,0,.55)_62%)]">technical assessment.</span></h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-600">Model forklift, jam operasi, dan shift digabung pada layar pertama. Health Score tetap dihitung deterministic engine; AI memperkaya interpretasi tanpa mengubah skor utama.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/diagnosis/form" className="rounded-full bg-[#0A0A0A] px-7 py-4 text-sm font-black text-white">Mulai 7-Step Diagnosis →</Link>
            <div className="rounded-full border border-zinc-200 bg-white px-5 py-4 text-sm font-bold">No Price • Technical Insight Only</div>
          </div>
        </div>

        <div className="rounded-[28px] bg-[#0A0A0A] p-6 text-white sm:p-8">
          <div className="font-mono text-[11px] tracking-[.14em] text-zinc-400">DIAGNOSTIC FLOW</div>
          <div className="mt-6 space-y-2">
            {steps.map((label, index) => (
              <div key={label} className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black ${index === 3 ? 'bg-[#FFCC00] text-black' : 'bg-white/10 text-white'}`}>{index + 1}</div>
                <div className="text-sm font-bold">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
