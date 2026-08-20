'use client';

import { useEffect } from 'react';

const CHARGER_ERROR_QUESTION = 'Seberapa sering charger menampilkan kode gangguan?';

const TEXT_REPLACEMENTS: Record<string, string> = {
  'Pengisian Battery Terlalu Lama / Charger Bermasalah': 'Pengisian Battery Terlalu Lama',
  'Battery lama siap digunakan kembali atau charger menunjukkan gangguan.': 'Battery membutuhkan waktu terlalu lama hingga siap digunakan kembali.',
  'Forklift Sering Berhenti Karena Battery / Charger': 'Forklift Sering Berhenti Karena Battery / Proses Pengisian',
};

function leaf(root: ParentNode, text: string): HTMLElement | null {
  return Array.from(root.querySelectorAll<HTMLElement>('*')).find(
    (node) => node.children.length === 0 && node.textContent?.trim() === text,
  ) ?? null;
}

function hideChargerErrorQuestion() {
  const question = leaf(document, CHARGER_ERROR_QUESTION);
  const panel = question?.parentElement;
  if (!panel) return;

  panel.dataset.drrkobeChargerFaultQuestion = '1';
  panel.style.display = 'none';
  panel.setAttribute('aria-hidden', 'true');

  panel.querySelectorAll<HTMLInputElement | HTMLButtonElement | HTMLSelectElement>('input, button, select')
    .forEach((control) => {
      control.disabled = true;
      control.tabIndex = -1;
    });
}

function rewriteChargerFaultCopy() {
  Object.entries(TEXT_REPLACEMENTS).forEach(([from, to]) => {
    Array.from(document.querySelectorAll<HTMLElement>('*')).forEach((node) => {
      if (node.children.length !== 0 || node.textContent?.trim() !== from) return;
      node.textContent = to;
    });
  });
}

export default function ChargerDiagnosisScopeGuard() {
  useEffect(() => {
    let queued = false;

    const apply = () => {
      queued = false;
      hideChargerErrorQuestion();
      rewriteChargerFaultCopy();
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

  return <style jsx global>{`[data-drrkobe-charger-fault-question="1"]{display:none!important}`}</style>;
}
