import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DRRKOBE Battery Intelligence Platform',
  description: 'Platform diagnosis teknis battery forklift dan material handling equipment.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
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
                <p>Domain: <strong>DRRKOBE.COM/BIP</strong></p>
              </div>
            </section>

            <section>
              <p className="drr-footer__label">TAGLINE</p>
              <h2 className="drr-footer__headline">We Don't Sell Batteries.<br />We Reduce Your Downtime.</h2>
              <p className="drr-footer__muted">No pricing. Pure diagnostic intelligence. Premium industrial battery assessment experience.</p>
            </section>

            <section>
              <p className="drr-footer__label">BIP V2 • 9-STEP JOURNEY</p>
              <p className="drr-footer__muted drr-footer__muted--dark">
                Aggregated multi-issue analysis, deterministic Health Score, AI enrichment, operational impact, technology comparison, ROI indicator, dan technical assessment.
              </p>
              <p className="drr-footer__palette">BLACK #0A0A0A · WHITE · YELLOW #FFCC00</p>
            </section>
          </div>

          <div className="drr-footer__bottom">
            <span>© 2026 DRRKOBE Battery Intelligence Platform</span>
            <span>Diagnostic Reliability Reporting Engine</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
