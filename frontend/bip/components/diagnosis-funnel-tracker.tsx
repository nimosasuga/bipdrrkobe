'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { resetFunnelSession, trackFunnelEvent } from '../lib/funnel-analytics';

const DIAGNOSIS_PATH = '/diagnosis/form';

export default function DiagnosisFunnelTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== DIAGNOSIS_PATH) return;

    void trackFunnelEvent('diagnosis_started', {
      metadata: { path: DIAGNOSIS_PATH },
    });

    const handleModelChange = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLSelectElement) || !target.value) return;

      const selects = Array.from(document.querySelectorAll('select'));
      if (selects[1] !== target) return;

      void trackFunnelEvent('model_selected', {
        metadata: { model_id: target.value },
      });
    };

    const handleResetClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const button = target.closest('button');
      if (!button?.textContent?.includes('Mulai Diagnosis Baru')) return;

      resetFunnelSession();
      window.setTimeout(() => {
        void trackFunnelEvent('diagnosis_started', {
          metadata: { path: DIAGNOSIS_PATH, restarted: true },
        });
      }, 0);
    };

    const originalFetch = window.fetch.bind(window);

    const wrappedFetch: typeof window.fetch = async (...args) => {
      const [input, init] = args;
      const url = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
      const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();

      const response = await originalFetch(...args);

      if (method === 'POST' && url.includes('/api/v1/diagnose') && response.ok) {
        void response.clone().json()
          .then((payload) => {
            if (!payload?.diagnosis_id) return;

            return trackFunnelEvent('diagnosis_completed', {
              diagnosisId: payload.diagnosis_id,
              metadata: {
                health_score: payload.health_score ?? null,
                category: payload.category ?? null,
              },
            });
          })
          .catch(() => undefined);
      }

      return response;
    };

    window.fetch = wrappedFetch;
    document.addEventListener('change', handleModelChange);
    document.addEventListener('click', handleResetClick);

    return () => {
      document.removeEventListener('change', handleModelChange);
      document.removeEventListener('click', handleResetClick);
      if (window.fetch === wrappedFetch) window.fetch = originalFetch;
    };
  }, [pathname]);

  return null;
}
