'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { label: 'Platform', href: '/platform' },
  { label: 'Diagnosis', href: '/diagnosis/form' },
  { label: 'Knowledge', href: '/knowledge' },
  { label: 'FAQ', href: '/faq' },
];

export default function SiteHeader() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/diagnosis/form') return pathname.startsWith('/diagnosis');
    return pathname === href;
  };

  return (
    <header className="drr-site-header">
      <div className="drr-site-header__inner">
        <div className="drr-site-header__left">
          <Link href="/" className="drr-site-brand" aria-label="DRRKOBE BIP Home">
            <div className="drr-site-brand__row">
              <strong>DRRKOBE</strong>
              <span>BIP</span>
            </div>
            <small>DIAGNOSTIC RELIABILITY REPORTING<br />BATTERY INTELLIGENCE PLATFORM</small>
          </Link>

          <nav className="drr-site-nav" aria-label="Navigasi utama">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={isActive(item.href) ? 'is-active' : ''}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <Link href="/diagnosis/form" className="drr-site-cta">
          Mulai Diagnosis <span aria-hidden="true">→</span>
        </Link>
      </div>
    </header>
  );
}
