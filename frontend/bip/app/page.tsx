import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-10 md:px-10">
      <div className="mx-auto flex min-h-[80vh] max-w-6xl items-center">
        <section className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-14">
          <div className="mb-6 inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            DRRKOBE Battery Intelligence Platform
          </div>

          <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
            Diagnosis teknis battery forklift berbasis data.
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            Evaluasi kondisi battery, pola operasional, spesifikasi forklift, charger, dan aturan diagnostik untuk menghasilkan health score serta rekomendasi assessment teknis.
          </p>

          <div className="mt-10">
            <Link
              href="/diagnosis/start"
              className="inline-flex rounded-xl bg-slate-950 px-6 py-3.5 font-semibold text-white transition hover:bg-slate-800"
            >
              Mulai Diagnosis
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
