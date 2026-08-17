import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DRRKOBE Battery Intelligence Platform',
  description: 'Platform diagnosis teknis battery forklift dan material handling equipment.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
