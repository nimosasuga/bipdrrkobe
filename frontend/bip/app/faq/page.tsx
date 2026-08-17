import Link from 'next/link';

const faqs = [
  {
    q: 'Apa fungsi utama DRRKOBE BIP?',
    a: 'DRRKOBE BIP membantu melakukan screening awal kondisi battery forklift Lead Acid berdasarkan model unit, umur battery, pola kerja, charging, downtime, maintenance, dan gejala yang dialami. Hasilnya digunakan sebagai dasar untuk menentukan pemeriksaan teknis berikutnya.',
  },
  {
    q: 'Apakah Health Score dihitung oleh AI?',
    a: 'Tidak. Health Score dihitung oleh engine deterministic berbasis aturan yang tetap. AI hanya membantu menjelaskan kemungkinan penyebab, hubungan antar-gejala, dan prioritas pemeriksaan. AI tidak boleh mengubah Health Score.',
  },
  {
    q: 'Apakah hasil diagnosis berarti battery harus langsung diganti?',
    a: 'Tidak. Hasil BIP adalah screening awal. Battery dengan skor rendah tetap perlu diverifikasi melalui assessment teknis seperti capacity test, pemeriksaan specific gravity, charger, konektor, temperatur, dan kondisi fisik battery sebelum keputusan dibuat.',
  },
  {
    q: 'Mengapa BIP hanya menerima battery Lead Acid pada tahap awal?',
    a: 'Versi awal BIP difokuskan pada fleet yang saat ini menggunakan Lead Acid. Lithium-ion digunakan sebagai pembanding teknologi pada tahap evaluasi. Fokus yang sempit membantu menjaga aturan diagnosis tetap konsisten dan mudah diverifikasi.',
  },
  {
    q: 'Apakah website ini menampilkan harga battery?',
    a: 'Tidak. BIP tidak menampilkan harga. Fokusnya adalah diagnosis teknis, dampak operasional, perbandingan teknologi, dan potensi efisiensi. Pembahasan komersial dilakukan setelah kebutuhan teknis benar-benar dipahami.',
  },
  {
    q: 'Apakah BIP menggantikan teknisi atau inspeksi lapangan?',
    a: 'Tidak. BIP membantu mempercepat proses screening dan memperjelas area yang perlu diperiksa. Validasi fisik tetap dilakukan oleh personel teknis yang kompeten sesuai prosedur keselamatan perusahaan.',
  },
  {
    q: 'Apakah DRRKOBE BIP sudah bersertifikat ISO?',
    a: 'Tidak ada klaim sertifikasi ISO pada BIP. Cara kerjanya disusun dengan prinsip dokumentasi, ketertelusuran, keputusan berbasis bukti, dan pengendalian risiko yang umum digunakan dalam lingkungan kerja berstandar internasional. Sertifikasi ISO hanya dapat dinyatakan jika ada proses audit dan sertifikat resmi dari lembaga yang berwenang.',
  },
  {
    q: 'Data apa yang paling penting agar hasil diagnosis berguna?',
    a: 'Model forklift, umur battery, jumlah shift, jam operasi, durasi charging, frekuensi isi air, frekuensi downtime, error charger, serta gejala yang benar-benar dialami. Jika tersedia, hasil capacity test dan specific gravity akan sangat membantu validasi lanjutan.',
  },
  {
    q: 'Mengapa beberapa penyebab ditampilkan dengan confidence?',
    a: 'Confidence menunjukkan seberapa kuat data yang tersedia mendukung suatu kemungkinan penyebab. Nilai tersebut bukan kepastian kerusakan. Semakin lengkap data lapangan, semakin baik dasar untuk menentukan prioritas pemeriksaan.',
  },
  {
    q: 'Apa yang dilakukan setelah diagnosis selesai?',
    a: 'Gunakan hasil diagnosis untuk menentukan pemeriksaan prioritas. Jika masalah berdampak pada downtime, produktivitas, atau keselamatan, lanjutkan dengan technical assessment agar kondisi aktual battery, charger, dan unit dapat diverifikasi di lapangan.',
  },
];

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-[#FCFCF9] text-[#0A0A0A]">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-zinc-500">FAQ</p>
          <h1 className="mt-4 max-w-5xl text-5xl font-black leading-[.94] tracking-[-.055em] sm:text-6xl lg:text-7xl">
            Pertanyaan yang biasanya muncul sebelum technical assessment.
          </h1>
          <p className="mt-7 max-w-3xl text-base leading-8 text-zinc-600 sm:text-lg">
            Jawaban dibuat singkat dan langsung pada hal yang penting: apa yang dihitung, apa yang tidak dapat dipastikan dari website, dan kapan pemeriksaan lapangan diperlukan.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-[980px] px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
          <div className="space-y-3">
            {faqs.map((item, index) => (
              <details key={item.q} className="group rounded-[18px] border border-zinc-200 bg-white p-5 open:border-[#FFCC00] sm:p-6">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-5 font-black">
                  <span><span className="mr-3 font-mono text-[10px] text-zinc-400">{String(index + 1).padStart(2, '0')}</span>{item.q}</span>
                  <span className="text-xl leading-none transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 max-w-3xl pl-0 text-sm leading-7 text-zinc-600 sm:pl-8">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200 bg-[#0A0A0A] text-white">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-zinc-500">NEED A TECHNICAL CHECK?</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-.04em]">Mulai dari diagnosis awal, lalu verifikasi di lapangan.</h2>
          </div>
          <Link href="/diagnosis/form" className="inline-flex rounded-full bg-[#FFCC00] px-7 py-4 text-sm font-black text-black">
            Mulai Diagnosis →
          </Link>
        </div>
      </section>
    </main>
  );
}
