import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cek Kondisi Battery Forklift',
  description: 'Battery forklift cepat drop, charging lama, atau downtime berulang? Gunakan DRRKOBE BIP untuk assessment battery forklift Lead Acid berdasarkan kondisi unit dan operasi yang Anda masukkan.',
  alternates: {
    canonical: 'https://bip.drrkobe.com/',
  },
};

const steps = [
  ['01', 'Pilih bidang & forklift'],
  ['02', 'Konfigurasi battery'],
  ['03', 'Pilih gejala'],
  ['04', 'Lengkapi kondisi operasi'],
  ['05', 'Baca hasil diagnosis'],
  ['06', 'Lihat dampak yang dilaporkan'],
  ['07', 'Bandingkan teknologi'],
  ['08', 'Validasi kebutuhan operasi'],
  ['09', 'Dapatkan rekomendasi'],
];

const deliverables = [
  {
    code: '01',
    title: 'Skor Kondisi Battery',
    body: 'Membantu melihat tingkat kondisi battery berdasarkan data operasional yang Anda masukkan.',
  },
  {
    code: '02',
    title: 'Indikasi Penyebab',
    body: 'Menunjukkan kondisi yang perlu diverifikasi tanpa menganggap dugaan sebagai kerusakan yang sudah terbukti.',
  },
  {
    code: '03',
    title: 'Prioritas Pemeriksaan',
    body: 'Membantu menentukan apa yang perlu diperiksa lebih dahulu pada battery, charger, konektor, unit, atau pola operasi.',
  },
  {
    code: '04',
    title: 'Executive Report',
    body: 'Hasil assessment dapat dibawa ke diskusi internal atau digunakan sebagai dasar technical assessment berikutnya.',
  },
];

const principles = [
  {
    code: '01',
    title: 'Skor dihitung dengan aturan diagnosis yang konsisten',
    body: 'Skor Kondisi Battery menggunakan data yang Anda masukkan dan aturan diagnosis yang telah ditetapkan. Hasil screening tidak diposisikan sebagai pengukuran laboratorium.',
  },
  {
    code: '02',
    title: 'Beberapa gejala dibaca sebagai satu konteks',
    body: 'Battery cepat habis, charging lama, downtime, perawatan, dan keluhan lain dibaca bersama agar interpretasi tidak dimulai dari satu gejala saja.',
  },
  {
    code: '03',
    title: 'Hasil diarahkan ke pemeriksaan yang bisa diverifikasi',
    body: 'Rekomendasi difokuskan pada inspeksi, pengujian, riwayat charging, konektor, kondisi cell, dan bukti teknis lain yang relevan.',
  },
  {
    code: '04',
    title: 'Keputusan teknis tetap memerlukan kondisi aktual',
    body: 'BIP membantu mempersempit area pemeriksaan. Maintenance, penggantian battery, atau perubahan teknologi tetap memerlukan validasi lapangan.',
  },
];

const issues = [
  'Battery cepat habis',
  'Charging terlalu lama',
  'Charger error',
  'Downtime berulang',
  'Isi air terlalu sering',
  'Hydraulic terasa lambat',
  'Overheat',
  'Masalah electrical',
  'Drive / steering issue',
  'Produktivitas menurun',
];

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://bip.drrkobe.com/#website',
      url: 'https://bip.drrkobe.com/',
      name: 'DRRKOBE Battery Intelligence Platform',
      inLanguage: 'id-ID',
    },
    {
      '@type': 'Service',
      '@id': 'https://bip.drrkobe.com/#battery-assessment',
      name: 'Assessment Battery Forklift DRRKOBE BIP',
      serviceType: 'Assessment kondisi battery forklift dan material handling equipment',
      url: 'https://bip.drrkobe.com/diagnosis/form',
      provider: {
        '@type': 'Organization',
        name: 'DRRKOBE',
        url: 'https://drrkobe.com/',
      },
      areaServed: 'ID',
      description: 'Assessment battery forklift Lead Acid berdasarkan data unit, pola shift, charging, maintenance, downtime, dan gejala yang dilaporkan untuk membantu menentukan area pemeriksaan berikutnya.',
    },
  ],
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#FCFCF9] text-[#0A0A0A]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <section className="relative overflow-hidden border-b border-zinc-200 bg-white">
        <div className="pointer-events-none absolute -right-12 top-4 select-none text-[240px] font-black leading-none tracking-[-.08em] text-zinc-100 sm:text-[320px] lg:text-[420px]">
          BIP
        </div>

        <div className="relative mx-auto grid min-h-[680px] max-w-[1280px] items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.08fr_.92fr] lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[.14em]">
              <span className="h-2 w-2 rounded-full bg-[#FFCC00]" />
              BATTERY FORKLIFT ASSESSMENT • BEFORE DOWNTIME
            </div>

            <h1 className="mt-7 max-w-4xl text-[46px] font-black leading-[.94] tracking-[-.055em] sm:text-[64px] lg:text-[78px]">
              Battery forklift cepat drop?
              <span className="mt-2 block bg-[linear-gradient(transparent_65%,rgba(255,204,0,.6)_65%)]">Baca kondisinya sebelum downtime berulang.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg">
              Masukkan model forklift, umur battery, pola shift, charging, maintenance, dan gejala yang benar-benar terjadi. DRRKOBE BIP membantu membaca kondisi battery, indikasi penyebab, dan langkah pemeriksaan berikutnya sebelum Anda memutuskan maintenance, penggantian battery, atau evaluasi Lithium-ion.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/diagnosis/form" className="rounded-full bg-[#FFCC00] px-7 py-4 text-sm font-black text-black transition hover:bg-[#F5C000]">
                Cek Kondisi Battery Saya →
              </Link>
              <Link href="/platform" className="rounded-full border border-zinc-300 bg-white px-7 py-4 text-sm font-black transition hover:border-black">
                Lihat Cara Kerja
              </Link>
            </div>

            <p className="mt-4 text-xs leading-5 text-zinc-500">Tanpa harga • Tanpa komitmen pembelian • Hasil berdasarkan data yang Anda masukkan</p>
          </div>

          <div className="relative">
            <div className="rounded-[30px] bg-[#0A0A0A] p-6 text-white shadow-[0_30px_80px_rgba(0,0,0,.18)] sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-zinc-500">YANG ANDA DAPATKAN</div>
                  <div className="mt-2 text-xl font-black">Bukan sekadar sebuah angka.</div>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-full bg-[#FFCC00] font-black text-black">BIP</div>
              </div>

              <div className="mt-8 space-y-3">
                {deliverables.map((item) => (
                  <div key={item.code} className="rounded-[18px] border border-white/10 bg-white/[.04] p-4">
                    <div className="flex items-start gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#FFCC00] text-xs font-black text-black">{item.code}</span>
                      <div><div className="font-black">{item.title}</div><p className="mt-1 text-xs leading-5 text-zinc-400">{item.body}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-200 bg-[#FCFCF9]">
        <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-zinc-500">MASALAH YANG SERING DILAPORKAN</p>
            <h2 className="mt-3 text-4xl font-black leading-[.98] tracking-[-.05em] sm:text-5xl">Satu battery bisa menunjukkan lebih dari satu masalah.</h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-600">Battery forklift cepat habis, charging semakin lama, atau unit sering berhenti tidak selalu berasal dari satu penyebab. Pilih semua gejala yang benar-benar terjadi agar assessment membaca konteks yang lebih lengkap.</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {issues.map((issue, index) => (
              <span key={issue} className={`rounded-full border px-4 py-2.5 text-sm font-bold ${index < 4 ? 'border-[#FFCC00] bg-[#FFFEF0]' : 'border-zinc-200 bg-white'}`}>{issue}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-zinc-500">9 LANGKAH ASSESSMENT</p>
            <h2 className="mt-3 text-4xl font-black leading-[.98] tracking-[-.05em] sm:text-5xl">Anda isi kondisi yang diketahui. BIP membantu menyusun apa yang perlu diperiksa.</h2>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map(([number, label], index) => (
              <div key={number} className={`group rounded-[20px] border p-5 transition ${index === 4 ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white' : 'border-zinc-200 bg-[#FCFCF9] hover:border-zinc-400'}`}>
                <div className={`text-xs font-black ${index === 4 ? 'text-[#FFCC00]' : 'text-zinc-400'}`}>{number}</div>
                <div className="mt-6 flex items-end justify-between gap-4"><h3 className="text-lg font-black">{label}</h3><span className={index === 4 ? 'text-xl text-[#FFCC00]' : 'text-xl text-zinc-300'}>→</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-200 bg-[#FCFCF9]">
        <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-zinc-500">DASAR HASIL</p>
            <h2 className="mt-3 text-4xl font-black leading-[.98] tracking-[-.05em] sm:text-5xl">Baca kondisi lebih dulu. Jangan mulai dari asumsi penggantian battery.</h2>
          </div>

          <div className="mt-10 grid gap-px overflow-hidden rounded-[24px] border border-zinc-200 bg-zinc-200 md:grid-cols-2">
            {principles.map((item) => (
              <article key={item.code} className="bg-white p-7 sm:p-8">
                <div className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-zinc-400">{item.code}</div>
                <h3 className="mt-5 text-2xl font-black tracking-[-.03em]">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-zinc-600">{item.body}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 rounded-[20px] border border-[#FFCC00] bg-[#FFFEF0] p-6 text-sm leading-7 text-zinc-700">
            <strong className="text-black">Catatan:</strong> istilah battery dan baterai forklift digunakan untuk menjelaskan topik yang sama. Hasil BIP adalah assessment awal berdasarkan data yang tersedia dan bukan pengganti inspeksi teknis langsung atau pengukuran State of Health.
          </div>
        </div>
      </section>

      <section className="bg-[#0A0A0A] text-white">
        <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-end lg:px-8 lg:py-20">
          <div className="max-w-4xl">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-zinc-500">SEBELUM MAINTENANCE ATAU PENGGANTIAN BATTERY</p>
            <h2 className="mt-4 text-4xl font-black leading-[.95] tracking-[-.05em] sm:text-6xl">Pastikan Anda tahu masalah apa yang sedang Anda selesaikan.</h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-400">Mulai dari kondisi forklift yang digunakan hari ini. Baca hasilnya, lihat apa yang perlu diverifikasi, lalu tentukan apakah langkah berikutnya adalah maintenance, pemeriksaan teknis, atau evaluasi teknologi battery.</p>
          </div>

          <Link href="/diagnosis/form" className="inline-flex items-center justify-center rounded-full bg-[#FFCC00] px-7 py-4 text-sm font-black text-black transition hover:bg-[#F5C000]">
            Cek Kondisi Battery Saya →
          </Link>
        </div>
      </section>
    </main>
  );
}
