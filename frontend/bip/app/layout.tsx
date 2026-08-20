import type { Metadata } from 'next';
import SiteHeader from '../components/site-header';
import DiagnosisFunnelTracker from '../components/diagnosis-funnel-tracker';
import BuildRevisionGuard from '../components/build-revision-guard';
import PdfFinalBoundsGuard from '../components/pdf-final-bounds-guard';
import PdfTextSafety from '../components/pdf-text-safety';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://bip.drrkobe.com'),
  title: {
    default: 'Cek Kondisi Battery Forklift | DRRKOBE BIP',
    template: '%s | DRRKOBE BIP',
  },
  description: 'Assessment battery forklift dan baterai forklift Lead Acid untuk membaca gejala, kondisi operasional, risiko downtime, serta langkah pemeriksaan sebelum maintenance, penggantian battery, atau evaluasi Lithium-ion.',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'DRRKOBE Battery Intelligence Platform',
    title: 'Cek Kondisi Battery Forklift | DRRKOBE BIP',
    description: 'Baca kondisi battery forklift, gejala operasional, dan area yang perlu diperiksa sebelum downtime berulang atau keputusan penggantian battery.',
    url: 'https://bip.drrkobe.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cek Kondisi Battery Forklift | DRRKOBE BIP',
    description: 'Assessment battery forklift untuk membaca kondisi, gejala, risiko downtime, dan langkah pemeriksaan berikutnya.',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <BuildRevisionGuard />
        <PdfFinalBoundsGuard />
        <PdfTextSafety />
        <DiagnosisFunnelTracker />
        <SiteHeader />
        <div className="drr-app-shell">{children}</div>

        <footer className="drr-footer">
          <div className="drr-footer__inner">
            <section className="drr-footer__brand">
              <div className="drr-footer__logo-row">
                <strong className="drr-footer__logo">DRRKOBE</strong>
                <span className="drr-footer__badge">BIP</span>
              </div>
              <p className="drr-footer__kicker">DIAGNOSTIC RELIABILITY REPORTING • BATTERY INTELLIGENCE PLATFORM</p>
              <div className="drr-footer__copy">
                <p><strong>DRR</strong> = Diagnostic Reliability Reporting — metodologi analisa downtime berbasis data.</p>
                <p><strong>KOBE</strong> = Knowledge Of Battery Excellence — pengetahuan mendalam battery industrial.</p>
                <p>Domain: <strong>BIP.DRRKOBE.COM</strong></p>
              </div>
            </section>

            <section>
              <p className="drr-footer__label">FOKUS</p>
              <h2 className="drr-footer__headline">Baca Kondisi Battery.<br />Kurangi Keputusan Berbasis Asumsi.</h2>
              <p className="drr-footer__muted">Tidak menampilkan harga. Fokus pada kondisi unit, bukti yang tersedia, dan langkah pemeriksaan berikutnya.</p>
            </section>

            <section>
              <p className="drr-footer__label">BIP • 9 LANGKAH</p>
              <p className="drr-footer__muted drr-footer__muted--dark">
                Dari identifikasi bidang dan unit, gejala, kondisi operasional, diagnosis, dampak, perbandingan teknologi, validasi kebutuhan operasi, hingga rekomendasi technical assessment.
              </p>
              <p className="drr-footer__palette">BLACK #0A0A0A · WHITE · YELLOW #FFCC00</p>
            </section>
          </div>

          <div className="drr-footer__bottom">
            <span>© 2026 DRRKOBE Battery Intelligence Platform</span>
            <span>Assessment battery forklift berbasis data yang tersedia</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
