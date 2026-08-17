import Link from 'next/link';

const principles = [
  {
    title: 'Data sebelum kesimpulan',
    body: 'DRRKOBE meminta data model, pola kerja, umur battery, kebiasaan charging, downtime, dan gejala aktual sebelum memberikan hasil. Tujuannya sederhana: keputusan teknis harus punya dasar yang bisa ditelusuri.',
  },
  {
    title: 'Health Score tetap deterministic',
    body: 'Nilai utama dihitung oleh engine berbasis aturan. AI tidak boleh mengubah Health Score. AI hanya membantu menjelaskan pola, kemungkinan penyebab, dan prioritas pemeriksaan.',
  },
  {
    title: 'Temuan harus bisa diverifikasi',
    body: 'Setiap rekomendasi diarahkan ke pemeriksaan yang dapat dilakukan di lapangan: capacity test, specific gravity, konektor, charger, temperatur, dan kondisi fisik battery.',
  },
  {
    title: 'Tidak menggantikan inspeksi teknis',
    body: 'Hasil BIP adalah screening awal berbasis data yang dimasukkan pengguna. Keputusan penggantian, perbaikan, atau perubahan teknologi tetap membutuhkan assessment teknis aktual.',
  },
];

export default function PlatformPage() {
  return (
    <main className="min-h-screen bg-[#FCFCF9] text-[#0A0A0A]">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-zinc-500">PLATFORM</p>
          <h1 className="mt-4 max-w-5xl text-5xl font-black leading-[.94] tracking-[-.055em] sm:text-6xl lg:text-7xl">
            Diagnosis battery yang bisa dijelaskan, ditelusuri, dan diperiksa ulang.
          </h1>
          <p className="mt-7 max-w-3xl text-base leading-8 text-zinc-600 sm:text-lg">
            DRRKOBE BIP membantu perusahaan membaca kondisi battery forklift Lead Acid dari data operasional yang nyata. Fokusnya bukan membuat prediksi yang terdengar canggih, tetapi membantu tim teknis menemukan apa yang perlu diperiksa lebih dulu.
          </p>
        </div>
      </section>

      <section className="border-b border-zinc-200">
        <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-px overflow-hidden rounded-[24px] border border-zinc-200 bg-zinc-200 md:grid-cols-2">
            {principles.map((item, index) => (
              <article key={item.title} className="bg-white p-7 sm:p-8">
                <div className="font-mono text-[10px] font-bold tracking-[.14em] text-zinc-400">0{index + 1}</div>
                <h2 className="mt-5 text-2xl font-black tracking-[-.03em]">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-zinc-600">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:px-8 lg:py-20">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-zinc-500">INTERNATIONAL-STANDARD ORIENTATION</p>
            <h2 className="mt-3 text-4xl font-black leading-[.98] tracking-[-.05em]">Cara kerja yang rapi, bukan klaim sertifikasi.</h2>
          </div>
          <div className="space-y-5 text-sm leading-7 text-zinc-600">
            <p>
              Struktur BIP mengikuti prinsip yang umum dipakai dalam lingkungan kerja berstandar internasional: informasi terdokumentasi, keputusan berbasis bukti, pengendalian risiko, ketertelusuran hasil, dan verifikasi sebelum tindakan.
            </p>
            <p>
              Untuk konteks operasional, pendekatan ini sejalan dengan prinsip manajemen mutu ISO 9001 dan keselamatan kerja ISO 45001. Untuk forklift dan battery industrial, assessment tetap harus memperhatikan persyaratan keselamatan alat, battery, charger, ventilasi, dan prosedur kerja yang berlaku di lokasi pengguna.
            </p>
            <div className="rounded-[18px] border border-[#FFCC00] bg-[#FFFEF0] p-5 font-semibold text-black">
              DRRKOBE BIP bukan lembaga sertifikasi ISO dan hasil diagnosis bukan sertifikat kepatuhan. BIP adalah alat screening dan decision support untuk membantu technical assessment.
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0A0A0A] text-white">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-zinc-500">NEXT STEP</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-.04em]">Mulai dari data unit yang benar.</h2>
          </div>
          <Link href="/diagnosis/form" className="inline-flex rounded-full bg-[#FFCC00] px-7 py-4 text-sm font-black text-black">
            Mulai Diagnosis →
          </Link>
        </div>
      </section>
    </main>
  );
}
