import Link from 'next/link';

const steps = [
  ['01', 'Pilih Model'],
  ['02', 'Battery Lead Acid'],
  ['03', 'Pilih Masalah'],
  ['04', 'Detail Operasional'],
  ['05', 'Hasil Diagnosis'],
  ['06', 'Dampak Operasional'],
  ['07', 'Bandingkan Teknologi'],
  ['08', 'Potensi Efisiensi'],
  ['09', 'Rekomendasi'],
];

const capabilities = [
  {
    code: '01',
    title: 'Skor dihitung dengan aturan yang tetap',
    body: 'Health Score berasal dari data yang Anda masukkan dan aturan diagnosis yang sudah ditetapkan. AI tidak dapat mengubah skor utama.',
  },
  {
    code: '02',
    title: 'Beberapa gejala dibaca bersama',
    body: 'Battery cepat habis, charging lama, downtime, isi air, dan keluhan lain tidak dipisahkan begitu saja. Hubungannya dibaca sebagai satu kondisi operasional.',
  },
  {
    code: '03',
    title: 'Hasil harus bisa diperiksa ulang',
    body: 'Rekomendasi diarahkan ke pemeriksaan yang nyata di lapangan, seperti capacity test, specific gravity, charger, konektor, temperatur, dan kondisi cell.',
  },
  {
    code: '04',
    title: 'Keputusan tetap berada di tangan tim teknis',
    body: 'BIP membantu mempersempit area pemeriksaan. Keputusan perbaikan, penggantian, atau perubahan teknologi tetap memerlukan validasi aktual.',
  },
];

const issues = [
  'Battery Cepat Habis',
  'Charger Lama / Error',
  'Downtime Sering',
  'Maintenance Tinggi',
  'Produktivitas Menurun',
  'Error Code / Electrical',
  'Hydraulic Lambat',
  'Drive / Steering Issue',
  'Overheat',
  'Isi Air Sering',
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#FCFCF9] text-[#0A0A0A]">
      <section className="relative overflow-hidden border-b border-zinc-200 bg-white">
        <div className="pointer-events-none absolute -right-12 top-4 select-none text-[240px] font-black leading-none tracking-[-.08em] text-zinc-100 sm:text-[320px] lg:text-[420px]">
          BIP
        </div>

        <div className="relative mx-auto grid min-h-[680px] max-w-[1280px] items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.08fr_.92fr] lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[.14em]">
              <span className="h-2 w-2 rounded-full bg-[#FFCC00]" />
              DRRKOBE Battery Intelligence Platform
            </div>

            <h1 className="mt-7 max-w-4xl text-[46px] font-black leading-[.94] tracking-[-.055em] sm:text-[64px] lg:text-[78px]">
              We Don&apos;t Sell Batteries.
              <span className="mt-2 block bg-[linear-gradient(transparent_65%,rgba(255,204,0,.6)_65%)]">We Reduce Your Downtime.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg">
              Masukkan kondisi unit yang benar, pilih masalah yang benar-benar terjadi, lalu gunakan hasilnya untuk menentukan pemeriksaan teknis berikutnya. Tidak ada harga dan tidak ada kesimpulan yang dibuat tanpa dasar data.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/diagnosis/form" className="rounded-full bg-[#0A0A0A] px-7 py-4 text-sm font-black text-white transition hover:bg-black">
                Mulai Diagnosis 9 Langkah →
              </Link>
              <Link href="/platform" className="rounded-full border border-zinc-300 bg-white px-7 py-4 text-sm font-black transition hover:border-black">
                Lihat Cara Kerja
              </Link>
            </div>

            <div className="mt-12 grid max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-[20px] border border-zinc-200 bg-zinc-200 sm:grid-cols-4">
              {[
                ['9', 'Langkah Diagnosis'],
                ['10', 'Jenis Masalah'],
                ['0', 'Harga Ditampilkan'],
                ['1', 'Tujuan: Assessment'],
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
                  <div className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-zinc-500">CONTOH HASIL DIAGNOSIS</div>
                  <div className="mt-2 text-xl font-black">Kondisi Battery dan Akar Masalah</div>
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
                <div className="text-xs font-black uppercase tracking-[.12em]">Cara membaca hasil</div>
                <p className="mt-2 text-sm leading-6">Skor utama keluar dari aturan yang tetap. Penjelasan teknis membantu menunjukkan bagian yang perlu diperiksa lebih dulu, bukan menggantikan inspeksi lapangan.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-200 bg-[#FCFCF9]">
        <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-zinc-500">9 LANGKAH DIAGNOSIS</p>
            <h2 className="mt-3 text-4xl font-black leading-[.98] tracking-[-.05em] sm:text-5xl">Dari kondisi aktual sampai rekomendasi teknis.</h2>
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
              <p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-zinc-500">BACA BEBERAPA GEJALA SEKALIGUS</p>
              <h2 className="mt-3 text-4xl font-black leading-[.98] tracking-[-.05em] sm:text-5xl">Satu battery bisa menunjukkan lebih dari satu masalah.</h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-zinc-600">Anda tidak perlu memilih satu keluhan utama. Pilih semua masalah yang benar-benar terjadi agar hasilnya lebih dekat dengan kondisi unit di lapangan.</p>
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

      <section className="border-b border-zinc-200 bg-[#FCFCF9]">
        <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-zinc-500">PRINSIP KERJA</p>
            <h2 className="mt-3 text-4xl font-black leading-[.98] tracking-[-.05em] sm:text-5xl">Hasil yang bisa dijelaskan, bukan kotak hitam.</h2>
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

          <div className="mt-6 rounded-[20px] border border-[#FFCC00] bg-[#FFFEF0] p-6 text-sm leading-7 text-zinc-700">
            <strong className="text-black">Pendekatan berstandar kerja internasional:</strong> informasi harus terdokumentasi, keputusan harus punya dasar bukti, risiko perlu dikendalikan, dan hasil harus dapat ditelusuri. BIP tidak mengklaim sebagai sertifikasi ISO; BIP membantu menyiapkan data dan keputusan teknis dengan disiplin yang sejalan dengan praktik tersebut.
          </div>
        </div>
      </section>

      <section className="bg-[#0A0A0A] text-white">
        <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-end lg:px-8 lg:py-20">
          <div className="max-w-4xl">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-zinc-500">MULAI DARI DATA YANG BENAR</p>
            <h2 className="mt-4 text-4xl font-black leading-[.95] tracking-[-.05em] sm:text-6xl">Kenali sumber downtime sebelum memutuskan langkah berikutnya.</h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-400">Hasil diagnosis digunakan untuk menentukan pemeriksaan prioritas. Validasi lapangan tetap menjadi bagian penting sebelum keputusan teknis dibuat.</p>
          </div>

          <Link href="/diagnosis/form" className="inline-flex items-center justify-center rounded-full bg-[#FFCC00] px-7 py-4 text-sm font-black text-black transition hover:bg-[#F5C000]">
            Mulai Diagnosis →
          </Link>
        </div>
      </section>
    </main>
  );
}
