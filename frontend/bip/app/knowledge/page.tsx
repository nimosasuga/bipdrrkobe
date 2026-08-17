import Link from 'next/link';

const topics = [
  {
    title: 'Battery cepat habis tidak selalu berarti battery harus diganti',
    body: 'Runtime yang turun bisa dipengaruhi usia battery, kebiasaan charging, beban kerja, suhu, kondisi cell, konektor, atau charger. Karena itu DRRKOBE tidak langsung menyimpulkan penggantian hanya dari satu gejala.',
  },
  {
    title: 'Charging lama perlu dilihat bersama duty cycle',
    body: 'Durasi charging baru punya arti jika dibandingkan dengan jam operasi, jumlah shift, kapasitas battery, output charger, dan waktu istirahat battery. Satu angka tidak cukup untuk menjelaskan penyebab.',
  },
  {
    title: 'Frekuensi isi air adalah sinyal operasional',
    body: 'Top-up yang terlalu sering bisa menjadi tanda pola charging, temperatur, atau pemakaian yang perlu diperiksa. Nilainya harus dibaca bersama specific gravity, level elektrolit, dan kondisi fisik cell.',
  },
  {
    title: 'Downtime adalah hasil dari beberapa faktor yang saling terkait',
    body: 'Battery, charger, konektor, kebiasaan kerja, dan maintenance dapat menghasilkan keluhan yang terlihat terpisah. Karena itu BIP membaca beberapa issue sekaligus agar akar masalah tidak dipersempit terlalu cepat.',
  },
];

export default function KnowledgePage() {
  return (
    <main className="min-h-screen bg-[#FCFCF9] text-[#0A0A0A]">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-zinc-500">KNOWLEDGE</p>
          <h1 className="mt-4 max-w-5xl text-5xl font-black leading-[.94] tracking-[-.055em] sm:text-6xl lg:text-7xl">
            Memahami gejala sebelum mengambil keputusan teknis.
          </h1>
          <p className="mt-7 max-w-3xl text-base leading-8 text-zinc-600 sm:text-lg">
            Halaman ini menjelaskan cara membaca gejala battery forklift dengan bahasa kerja sehari-hari. Tujuannya agar user memahami alasan di balik hasil diagnosis, bukan hanya menerima skor.
          </p>
        </div>
      </section>

      <section className="border-b border-zinc-200">
        <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-2">
            {topics.map((item, index) => (
              <article key={item.title} className="rounded-[22px] border border-zinc-200 bg-white p-7">
                <div className="font-mono text-[10px] font-bold tracking-[.14em] text-zinc-400">K-{String(index + 1).padStart(2, '0')}</div>
                <h2 className="mt-5 text-2xl font-black tracking-[-.03em]">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-zinc-600">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[.75fr_1.25fr]">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-zinc-500">GOOD DIAGNOSTIC PRACTICE</p>
              <h2 className="mt-3 text-4xl font-black leading-[.98] tracking-[-.05em]">Apa yang sebaiknya dicatat di lapangan.</h2>
            </div>
            <div className="grid gap-px overflow-hidden rounded-[22px] border border-zinc-200 bg-zinc-200 sm:grid-cols-2">
              {[
                'Model forklift dan identitas battery',
                'Umur battery dan pola shift',
                'Durasi charging aktual',
                'Frekuensi downtime',
                'Frekuensi isi air',
                'Error code dari charger atau unit',
                'Hasil capacity test jika tersedia',
                'Specific gravity dan kondisi cell jika diukur',
              ].map((item) => (
                <div key={item} className="bg-[#FCFCF9] p-5 text-sm font-semibold leading-6">{item}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0A0A0A] text-white">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-zinc-500">APPLY THE KNOWLEDGE</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-.04em]">Gunakan data aktual unit untuk mulai diagnosis.</h2>
          </div>
          <Link href="/diagnosis/form" className="inline-flex rounded-full bg-[#FFCC00] px-7 py-4 text-sm font-black text-black">
            Mulai Diagnosis →
          </Link>
        </div>
      </section>
    </main>
  );
}
