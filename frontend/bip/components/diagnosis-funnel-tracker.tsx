'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  captureAdsAttribution,
  resetFunnelSession,
  trackFunnelEvent,
} from '../lib/funnel-analytics';

const DIAGNOSIS_PATH = '/diagnosis/form';

export default function DiagnosisFunnelTracker() {
  const pathname = usePathname();

  useEffect(() => {
    captureAdsAttribution();
    void trackFunnelEvent('bip_visited', { metadata: { path: pathname } });

    if (pathname !== DIAGNOSIS_PATH) return;

    let currentDiagnosisId: string | null = null;
    let currentLeadId: string | null = null;

    void trackFunnelEvent('diagnosis_started', {
      metadata: { path: DIAGNOSIS_PATH, flow_version: '7-step' },
    });

    const handleModelChange = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLSelectElement) || !target.value) return;

      const selects = Array.from(document.querySelectorAll('select'));
      if (selects[1] !== target) return;

      void trackFunnelEvent('model_selected', {
        metadata: { model_id: target.value, visible_step: 1, flow_version: '7-step' },
      });
    };

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const button = target.closest('button');
      const link = target.closest('a');

      if (button?.textContent?.includes('Mulai Diagnosis Baru')) {
        currentDiagnosisId = null;
        currentLeadId = null;
        resetFunnelSession();
        window.setTimeout(() => {
          void trackFunnelEvent('bip_visited', { metadata: { path: DIAGNOSIS_PATH, restarted: true } });
          void trackFunnelEvent('diagnosis_started', { metadata: { path: DIAGNOSIS_PATH, restarted: true, flow_version: '7-step' } });
        }, 0);
        return;
      }

      if (currentDiagnosisId && button?.textContent?.includes('Download Executive Report PDF')) {
        void trackFunnelEvent('report_downloaded', {
          diagnosisId: currentDiagnosisId,
          leadId: currentLeadId,
          metadata: { format: 'pdf', flow_version: '7-step' },
        });
        return;
      }

      if (currentDiagnosisId && link && link.href.startsWith('https://wa.me/')) {
        void trackFunnelEvent('assessment_clicked', {
          diagnosisId: currentDiagnosisId,
          leadId: currentLeadId,
          metadata: { channel: 'whatsapp', visible_step: 7, flow_version: '7-step' },
        });
      }
    };

    const detectViewedSteps = () => {
      if (!currentDiagnosisId) return;
      const content = document.querySelector('main')?.textContent ?? '';

      // Event keys are retained for backend/dashboard compatibility. Metadata records
      // the native seven-step position so historical funnels remain comparable.
      if (content.includes('STEP 4 / 7')) {
        void trackFunnelEvent('step_5_viewed', {
          diagnosisId: currentDiagnosisId,
          metadata: { visible_step: 4, stage: 'ai_diagnosis_result', flow_version: '7-step' },
        });
      }

      if (content.includes('STEP 5 / 7')) {
        void trackFunnelEvent('step_7_viewed', {
          diagnosisId: currentDiagnosisId,
          metadata: { visible_step: 5, stage: 'technology_comparison', flow_version: '7-step' },
        });
      }

      if (content.includes('STEP 6 / 7')) {
        void trackFunnelEvent('step_8_viewed', {
          diagnosisId: currentDiagnosisId,
          metadata: { visible_step: 6, stage: 'business_impact', flow_version: '7-step' },
        });
      }
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
            currentDiagnosisId = payload.diagnosis_id;
            currentLeadId = null;
            return trackFunnelEvent('diagnosis_completed', {
              diagnosisId: payload.diagnosis_id,
              metadata: {
                health_score: payload.health_score ?? null,
                category: payload.category ?? null,
                visible_step: 4,
                flow_version: '7-step',
              },
            });
          })
          .catch(() => undefined);
      }

      if (method === 'POST' && url.includes('/api/v1/leads') && response.ok) {
        void response.clone().json()
          .then((payload) => {
            if (!payload?.success || !payload?.lead_id || !currentDiagnosisId) return;
            currentLeadId = payload.lead_id;
            return trackFunnelEvent('lead_captured', {
              diagnosisId: currentDiagnosisId,
              leadId: payload.lead_id,
              metadata: { source: 'step_6', visible_step: 6, flow_version: '7-step' },
            });
          })
          .catch(() => undefined);
      }

      return response;
    };

    const observer = new MutationObserver(detectViewedSteps);
    window.fetch = wrappedFetch;
    document.addEventListener('change', handleModelChange);
    document.addEventListener('click', handleDocumentClick);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      document.removeEventListener('change', handleModelChange);
      document.removeEventListener('click', handleDocumentClick);
      if (window.fetch === wrappedFetch) window.fetch = originalFetch;
    };
  }, [pathname]);

  return null;
}
