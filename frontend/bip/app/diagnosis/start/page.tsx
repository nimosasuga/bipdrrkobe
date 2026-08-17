import Link from 'next/link';

const steps = [
  {
    number: '01',
    title: 'Identifikasi Forklift',
    description: 'Pilih brand dan model forklift yang akan dianalisis.',
  },
  {
    number: '02',
    title: 'Data Battery',
    description: 'Masukkan tipe, usia battery, shift, dan jam operasional.',
  },
  {
    number: '03',
    title: 'Kondisi Operasional',
    description: 'Jawab gejala utama yang terjadi pada battery dan proses charging.',
  },
  {
    number: '04',
    title: 'Hasil Diagnosis',
    description: 'Health Score dihitung engine Laravel lalu diperkaya analisis teknis AI.',
  },
];

export default function DiagnosisStartPage() {
  return (
    <main className="min-h-screen px-5 py-8 md:px-10 md:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-slate-950">
            DRRKOBE BIP
          </Link>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            Technical Diagnostic
          </span>
        </header>

        <section className="mt-12 max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-700">Battery Intelligence</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
            Mulai diagnosis kondisi battery forklift.
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-600 md:text-lg">
            Proses diagnosis menggunakan data unit dan kondisi aktual. Health Score dihitung secara deterministik dan tidak ditentukan oleh AI.
          </p>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          {steps.map((step) => (
            <article key={step.number} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-bold text-blue-700">{step.number}</div>
              <h2 className="mt-3 text-xl font-bold text-slate-950">{step.title}</h2>
              <p className="mt-2 leading-7 text-slate-600">{step.description}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white md:flex md:items-center md:justify-between md:gap-8 md:p-8">
          <div>
            <h2 className="text-xl font-bold">Siapkan data unit sebelum mulai</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Minimal diperlukan brand, model forklift, tipe battery, usia battery, shift kerja, jam operasi, dan gejala utama.
            </p>
          </div>

          <button
            type="button"
            disabled
            className="mt-6 inline-flex cursor-not-allowed rounded-xl bg-white/70 px-5 py-3 font-semibold text-slate-500 md:mt-0"
            title="Form diagnosis akan dibuat pada tahap berikutnya"
          >
            Lanjutkan Diagnosis
          </button>
        </section>
      </div>
    </main>
  );
}
