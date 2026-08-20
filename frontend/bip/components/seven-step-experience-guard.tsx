'use client';

import { useEffect } from 'react';

const SHIFT_KEY = 'drrkobe_bip_primary_shift';

type NavigationIntent = 'forward' | 'back-through-hidden';

const STEP_LABELS: Record<number, string> = {
  1: 'UNIT & OPERATION CONTEXT',
  2: 'GEJALA OPERASIONAL',
  3: 'DETAIL KONDISI',
  4: 'AI DIAGNOSIS RESULT',
  5: 'TECHNOLOGY COMPARISON',
  6: 'BUSINESS IMPACT & COST CONTEXT',
  7: 'TECHNICAL ASSESSMENT',
};

function normalize(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function leaf(root: ParentNode, text: string): HTMLElement | null {
  return Array.from(root.querySelectorAll<HTMLElement>('*')).find(
    (node) => node.children.length === 0 && normalize(node.textContent) === text,
  ) ?? null;
}

function currentSection(): HTMLElement | null {
  return document.querySelector<HTMLElement>('main section');
}

function sectionTitle(section: HTMLElement): string {
  return normalize(section.querySelector('h1')?.textContent);
}

function visibleStepForTitle(title: string): number | null {
  if (title.includes('Pilih Bidang Industri & Model Forklift')) return 1;
  if (title.includes('Pilih Gejala Yang Benar-Benar Terjadi')) return 2;
  if (title.includes('Lengkapi Kondisi Operasional')) return 3;
  if (title.includes('Hasil Diagnosis DRRKOBE')) return 4;
  if (title.includes('Lead Acid vs Lithium-ion') || title.includes('Masalah Lead Acid vs Keunggulan Lithium-ion')) return 5;
  if (title.includes('Hitung Potensi Efisiensi') || title.includes('Validasi Kebutuhan Operasional')) return 6;
  if (title.includes('Rekomendasi DRRKOBE')) return 7;
  return null;
}

function setStepEyebrow(section: HTMLElement, visibleStep: number) {
  const eyebrow = section.firstElementChild as HTMLElement | null;
  if (!eyebrow) return;
  const next = `STEP ${visibleStep} / 7 — ${STEP_LABELS[visibleStep]}`;
  if (normalize(eyebrow.textContent) !== next) eyebrow.textContent = next;
}

function progressHost(): HTMLElement | null {
  const engine = leaf(document, 'DRRKOBE Diagnostic Engine');
  return engine?.parentElement?.parentElement ?? null;
}

function renderSevenStepProgress(visibleStep: number) {
  const host = progressHost();
  if (!host) return;

  Array.from(host.children).forEach((child) => {
    const element = child as HTMLElement;
    if (element.dataset.drrkobeSevenProgress === '1') return;
    element.dataset.drrkobeLegacyProgress = '1';
    element.style.display = 'none';
  });

  let custom = host.querySelector<HTMLElement>('[data-drrkobe-seven-progress="1"]');
  if (!custom) {
    custom = document.createElement('div');
    custom.dataset.drrkobeSevenProgress = '1';
    custom.className = 'flex w-full min-w-[560px] items-center justify-between gap-5';
    host.appendChild(custom);
  }

  const steps = Array.from({ length: 7 }, (_, index) => index + 1)
    .map((number) => {
      const circleClass = number <= visibleStep
        ? 'grid h-7 w-7 place-items-center rounded-full bg-[#0A0A0A] text-xs font-black text-white'
        : 'grid h-7 w-7 place-items-center rounded-full border border-zinc-200 bg-white text-xs font-black text-zinc-400';
      const connector = number < 7
        ? `<div class="mx-2 h-px w-9 ${number < visibleStep ? 'bg-[#0A0A0A]' : 'bg-zinc-200'}"></div>`
        : '';
      return `<div class="flex items-center"><div class="${circleClass}">${number}</div>${connector}</div>`;
    })
    .join('');

  custom.innerHTML = `
    <div class="flex items-center">${steps}</div>
    <div class="whitespace-nowrap text-[11px] font-semibold">
      <span class="font-mono text-zinc-500">DRRKOBE Diagnostic Engine</span>
      <span class="mx-3 text-zinc-300">|</span>
      Step ${visibleStep}/7
    </div>
  `;
}

function storedShift(): number {
  try {
    const value = Number(window.sessionStorage.getItem(SHIFT_KEY));
    return [1, 2, 3].includes(value) ? value : 2;
  } catch {
    return 2;
  }
}

function saveShift(value: number) {
  try {
    window.sessionStorage.setItem(SHIFT_KEY, String(value));
  } catch {
    // Assessment tetap berjalan bila sessionStorage diblokir.
  }
}

function findOperationCard(section: HTMLElement): HTMLElement | null {
  const marker = leaf(section, 'DRRKOBE OPERATION CONTEXT');
  if (!marker) return null;

  let node: HTMLElement | null = marker.parentElement;
  while (node && node !== section) {
    const className = typeof node.className === 'string' ? node.className : '';
    if (className.includes('bg-[#0A0A0A]') && className.includes('rounded-[24px]')) return node;
    node = node.parentElement;
  }
  return marker.parentElement;
}

function paintShiftButtons(container: HTMLElement) {
  const selected = storedShift();
  const hours = selected * 8;

  container.querySelectorAll<HTMLButtonElement>('[data-drrkobe-shift]').forEach((button) => {
    const value = Number(button.dataset.drrkobeShift);
    const active = value === selected;
    button.className = active
      ? 'rounded-full bg-[#FFCC00] px-4 py-3 text-xs font-black text-black'
      : 'rounded-full border border-white/15 bg-white/[0.05] px-4 py-3 text-xs font-black text-white';
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  });

  const shiftValue = container.querySelector<HTMLElement>('[data-drrkobe-shift-value]');
  const hoursValue = container.querySelector<HTMLElement>('[data-drrkobe-hours-value]');
  if (shiftValue) shiftValue.textContent = `${selected} shift`;
  if (hoursValue) hoursValue.textContent = `${hours} jam/hari`;
}

function injectOperationContext(section: HTMLElement) {
  const card = findOperationCard(section);
  if (!card) return;

  let block = card.querySelector<HTMLElement>('[data-drrkobe-operation-merge="1"]');
  if (!block) {
    block = document.createElement('div');
    block.dataset.drrkobeOperationMerge = '1';
    block.className = 'mt-6 border-t border-white/10 pt-5';
    block.innerHTML = `
      <div class="font-mono text-[10px] font-bold tracking-[.14em] text-[#FFCC00]">OPERATION CONTEXT — PILIH SEKALI DI AWAL</div>
      <div class="mt-2 text-sm font-bold text-white">Model, jam operasi, dan shift berada dalam satu layar.</div>
      <div class="mt-4 flex flex-wrap gap-2">
        <button type="button" data-drrkobe-shift="1">1 Shift • 8 Jam</button>
        <button type="button" data-drrkobe-shift="2">2 Shift • 16 Jam</button>
        <button type="button" data-drrkobe-shift="3">3 Shift • 24 Jam</button>
      </div>
      <div class="mt-4 grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-white/10 bg-white/[0.06] p-3"><div class="text-[9px] font-bold uppercase tracking-[.12em] text-zinc-500">Shift</div><div data-drrkobe-shift-value class="mt-1 text-sm font-black text-white"></div></div>
        <div class="rounded-xl border border-white/10 bg-white/[0.06] p-3"><div class="text-[9px] font-bold uppercase tracking-[.12em] text-zinc-500">Jam Operasi</div><div data-drrkobe-hours-value class="mt-1 text-sm font-black text-white"></div></div>
      </div>
    `;

    block.querySelectorAll<HTMLButtonElement>('[data-drrkobe-shift]').forEach((button) => {
      button.addEventListener('click', () => {
        const value = Number(button.dataset.drrkobeShift);
        if (![1, 2, 3].includes(value)) return;
        saveShift(value);
        paintShiftButtons(block!);
      });
    });

    card.appendChild(block);
  }

  paintShiftButtons(block);
}

function applyStoredShiftToDetail(section: HTMLElement) {
  const label = leaf(section, 'Berapa shift operasional per hari?');
  const panel = label?.parentElement;
  if (!panel) return;

  const selected = storedShift();
  const button = Array.from(panel.querySelectorAll<HTMLButtonElement>('button')).find(
    (candidate) => normalize(candidate.textContent) === `${selected} Shift`,
  );

  if (button && !String(button.className).includes('bg-black')) {
    button.click();
  }

  panel.dataset.drrkobeOperationMoved = '1';
  panel.style.display = 'none';
}

function injectAiWatermark(section: HTMLElement) {
  const scoreLabel = leaf(section, 'SKOR KONDISI BATTERY');
  const resultCard = scoreLabel?.closest<HTMLElement>('.overflow-hidden');

  if (resultCard && !resultCard.querySelector('[data-drrkobe-ai-ghost="1"]')) {
    resultCard.style.position = 'relative';
    const ghost = document.createElement('div');
    ghost.dataset.drrkobeAiGhost = '1';
    ghost.className = 'pointer-events-none absolute bottom-5 right-5 select-none text-4xl font-black tracking-[-.05em] text-black';
    ghost.style.opacity = '0.035';
    ghost.textContent = 'DRRKOBE ENGINE';
    resultCard.appendChild(ghost);
  }

  if (section.querySelector('[data-drrkobe-ai-watermark="1"]')) return;

  const watermark = document.createElement('div');
  watermark.dataset.drrkobeAiWatermark = '1';
  watermark.className = 'mt-5 flex flex-col gap-3 rounded-[18px] border border-zinc-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between';
  watermark.innerHTML = `
    <div>
      <div class="font-mono text-[9px] font-bold uppercase tracking-[.18em] text-zinc-400">ANALYZED BY</div>
      <div class="mt-1 text-sm font-black text-[#0A0A0A]">DRRKOBE Diagnostic Engine</div>
    </div>
    <div class="inline-flex w-fit rounded-full bg-[#FFCC00] px-3 py-2 font-mono text-[10px] font-black tracking-[.12em] text-black">DRRKOBE.COM/BIP</div>
  `;

  const nav = Array.from(section.children).find((child) =>
    Array.from(child.querySelectorAll('button')).some((button) => normalize(button.textContent).includes('Lihat Dampak')),
  );
  if (nav) section.insertBefore(watermark, nav);
  else section.appendChild(watermark);
}

function navigationButton(section: HTMLElement, direction: 'next' | 'back'): HTMLButtonElement | null {
  const buttons = Array.from(section.querySelectorAll<HTMLButtonElement>('button'));
  if (direction === 'back') {
    return buttons.find((button) => normalize(button.textContent).startsWith('Kembali')) ?? null;
  }
  return buttons.find((button) => !normalize(button.textContent).startsWith('Kembali')) ?? null;
}

export default function SevenStepExperienceGuard() {
  useEffect(() => {
    let navigationIntent: NavigationIntent = 'forward';
    let queued = false;

    const onClickCapture = (event: Event) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button') : null;
      if (!target) return;

      const text = normalize(target.textContent);
      const section = target.closest<HTMLElement>('section');
      const title = section ? sectionTitle(section) : '';

      if (text.startsWith('Kembali') && (
        title.includes('Pilih Gejala Yang Benar-Benar Terjadi')
        || title.includes('Lead Acid vs Lithium-ion')
        || title.includes('Masalah Lead Acid vs Keunggulan Lithium-ion')
      )) {
        navigationIntent = 'back-through-hidden';
      } else if (text.includes('Mulai Diagnosis Baru')) {
        try { window.sessionStorage.removeItem(SHIFT_KEY); } catch { /* noop */ }
        navigationIntent = 'forward';
      } else if (!text.startsWith('Kembali')) {
        navigationIntent = 'forward';
      }
    };

    const skipHiddenStep = (section: HTMLElement, kind: 'battery' | 'impact') => {
      if (section.dataset.drrkobeSkipQueued === '1') return;
      section.dataset.drrkobeSkipQueued = '1';
      section.style.display = 'none';

      window.setTimeout(() => {
        if (!document.contains(section)) return;
        const backwards = navigationIntent === 'back-through-hidden';
        const button = navigationButton(section, backwards ? 'back' : 'next');
        navigationIntent = 'forward';
        if (button) button.click();
        else {
          section.style.display = '';
          delete section.dataset.drrkobeSkipQueued;
        }
      }, kind === 'battery' ? 0 : 10);
    };

    const sync = () => {
      queued = false;
      const section = currentSection();
      if (!section) return;
      const title = sectionTitle(section);

      if (title.includes('Konfigurasi Battery Saat Ini')) {
        skipHiddenStep(section, 'battery');
        return;
      }

      if (title.includes('Dampak Operasional Gabungan')) {
        skipHiddenStep(section, 'impact');
        return;
      }

      const visibleStep = visibleStepForTitle(title);
      if (!visibleStep) return;

      setStepEyebrow(section, visibleStep);
      renderSevenStepProgress(visibleStep);

      if (visibleStep === 1) injectOperationContext(section);
      if (visibleStep === 3) applyStoredShiftToDetail(section);
      if (visibleStep === 4) injectAiWatermark(section);
    };

    const schedule = () => {
      if (queued) return;
      queued = true;
      queueMicrotask(sync);
    };

    document.addEventListener('click', onClickCapture, true);
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    schedule();

    return () => {
      document.removeEventListener('click', onClickCapture, true);
      observer.disconnect();
    };
  }, []);

  return null;
}
