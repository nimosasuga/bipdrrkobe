'use client';

import { useEffect } from 'react';

const CHARGER_ERROR_QUESTION = 'Seberapa sering charger menampilkan kode gangguan?';
const CHARGER_FAULT_PATTERN = /(charger\s*(bermasalah|error|gangguan))|((gangguan|error)\s+.*charger)|(performa\s+charger)/i;

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
  const leaves = Array.from(document.querySelectorAll<HTMLElement>('*')).filter(
    (node) => node.children.length === 0 && Boolean(node.textContent?.trim()),
  );

  Object.entries(TEXT_REPLACEMENTS).forEach(([from, to]) => {
    leaves.forEach((node) => {
      if (node.textContent?.trim() === from) node.textContent = to;
    });
  });

  leaves.forEach((node) => {
    const text = node.textContent?.trim() ?? '';
    if (!text || !CHARGER_FAULT_PATTERN.test(text)) return;

    // Jangan menghapus konteks compatibility Technical Assessment.
    if (/kompatibilitas|compatible|compatibility/i.test(text)) return;

    node.textContent = 'Charging window perlu diverifikasi terhadap kebutuhan operasi.';
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
