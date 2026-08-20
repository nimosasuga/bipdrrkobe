'use client';

import { useEffect } from 'react';

const LEGACY_CHARGING_COST_LABELS = [
  'charging / listrik / unit / bulan',
  'biaya charging / listrik / unit / bulan',
  'biaya pengisian / unit / bulan',
];

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function stepEight(): HTMLElement | null {
  return Array.from(document.querySelectorAll<HTMLElement>('section')).find((section) => {
    const title = section.querySelector('h1')?.textContent ?? '';
    return title.includes('Hitung Potensi Efisiensi') || title.includes('Validasi Kebutuhan Operasional');
  }) ?? null;
}

function hideLegacyChargingCostField(section: HTMLElement) {
  Array.from(section.querySelectorAll<HTMLLabelElement>('label')).forEach((label) => {
    const text = normalize(label.textContent ?? '');
    const isLegacyChargingCost = LEGACY_CHARGING_COST_LABELS.some((item) => text.includes(item));
    if (!isLegacyChargingCost) return;

    label.dataset.drrkobeLegacyChargingCostCopyGuard = '1';
    label.style.display = 'none';
    label.setAttribute('aria-hidden', 'true');

    const input = label.querySelector<HTMLInputElement>('input');
    if (input) {
      input.disabled = true;
      input.tabIndex = -1;
      input.value = '';
    }
  });
}

function rewriteFinancialCopy(section: HTMLElement) {
  const fullModeButton = Array.from(section.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
    button.textContent?.includes('Saya memiliki data lengkap'),
  );

  const fullModeDescription = fullModeButton?.querySelector('p');
  if (fullModeDescription) {
    fullModeDescription.textContent = 'Isi biaya downtime dan Maintenance Lead Acid bila tersedia.';
  }

  const intro = Array.from(section.querySelectorAll<HTMLParagraphElement>('p')).find((paragraph) =>
    paragraph.textContent?.includes('Tidak mengetahui biaya internal tidak menghambat diagnosis'),
  );

  if (intro) {
    intro.textContent = 'Tidak mengetahui biaya internal tidak menghambat diagnosis. Laporan tetap menampilkan downtime, durasi/charging window, maintenance, dan dampak produktivitas tanpa membuat asumsi Rupiah. Nominal biaya hanya menggunakan downtime dan Maintenance Lead Acid yang benar-benar diketahui.';
  }
}

export default function FinancialUiCopyGuard() {
  useEffect(() => {
    let queued = false;

    const apply = () => {
      queued = false;
      const section = stepEight();
      if (!section) return;
      hideLegacyChargingCostField(section);
      rewriteFinancialCopy(section);
    };

    const queue = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(apply);
    };

    queue();
    const observer = new MutationObserver(queue);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return <style jsx global>{`[data-drrkobe-legacy-charging-cost-copy-guard="1"]{display:none!important}`}</style>;
}
