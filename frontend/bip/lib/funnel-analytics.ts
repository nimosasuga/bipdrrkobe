'use client';

const API_BASE = 'https://api.drrkobe.com/api/v1';
const SESSION_KEY = 'drrkobe_bip_funnel_session';
const SENT_KEY = 'drrkobe_bip_funnel_sent';
const ATTRIBUTION_KEY = 'drrkobe_bip_ads_attribution';
const inFlightEvents = new Set<string>();

export type FunnelEventName =
  | 'bip_visited'
  | 'diagnosis_started'
  | 'model_selected'
  | 'diagnosis_completed'
  | 'step_5_viewed'
  | 'step_7_viewed'
  | 'step_8_viewed'
  | 'report_downloaded'
  | 'assessment_clicked'
  | 'lead_captured';

export type FunnelEventPayload = {
  diagnosisId?: string | null;
  leadId?: string | null;
  metadata?: Record<string, unknown>;
};

type AdsAttribution = {
  utm_source: string;
  utm_campaign: string;
  utm_content: string;
};

function canUseBrowserStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

export function captureAdsAttribution(): AdsAttribution {
  const direct: AdsAttribution = {
    utm_source: 'direct',
    utm_campaign: 'direct',
    utm_content: '',
  };

  if (!canUseBrowserStorage()) return direct;

  const params = new URLSearchParams(window.location.search);
  const source = (params.get('utm_source') || '').trim().slice(0, 100);
  const campaign = (params.get('utm_campaign') || '').trim().slice(0, 150);
  const content = (params.get('utm_content') || '').trim().slice(0, 150);

  if (source || campaign || content) {
    const attribution: AdsAttribution = {
      utm_source: source || 'unknown',
      utm_campaign: campaign || 'unknown',
      utm_content: content,
    };

    window.sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
    return attribution;
  }

  try {
    const stored = JSON.parse(window.sessionStorage.getItem(ATTRIBUTION_KEY) || 'null');
    if (stored && typeof stored === 'object' && typeof stored.utm_source === 'string') {
      return {
        utm_source: stored.utm_source || 'direct',
        utm_campaign: typeof stored.utm_campaign === 'string' ? stored.utm_campaign : 'direct',
        utm_content: typeof stored.utm_content === 'string' ? stored.utm_content : '',
      };
    }
  } catch {
    // Gunakan direct jika data attribution browser tidak valid.
  }

  window.sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(direct));
  return direct;
}

export function getFunnelSessionId(): string {
  if (!canUseBrowserStorage()) return crypto.randomUUID();

  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;

  const sessionId = crypto.randomUUID();
  window.sessionStorage.setItem(SESSION_KEY, sessionId);
  return sessionId;
}

export function resetFunnelSession(): string {
  const sessionId = crypto.randomUUID();

  if (canUseBrowserStorage()) {
    window.sessionStorage.setItem(SESSION_KEY, sessionId);
    window.sessionStorage.removeItem(SENT_KEY);
  }

  inFlightEvents.clear();

  return sessionId;
}

function eventStorageKey(sessionId: string, event: FunnelEventName): string {
  return `${sessionId}:${event}`;
}

function wasSent(key: string): boolean {
  if (!canUseBrowserStorage()) return false;

  try {
    const stored = JSON.parse(window.sessionStorage.getItem(SENT_KEY) || '[]');
    return Array.isArray(stored) && stored.includes(key);
  } catch {
    return false;
  }
}

function markSent(key: string): void {
  if (!canUseBrowserStorage()) return;

  try {
    const stored = JSON.parse(window.sessionStorage.getItem(SENT_KEY) || '[]');
    const next = Array.isArray(stored) ? [...new Set([...stored, key])] : [key];
    window.sessionStorage.setItem(SENT_KEY, JSON.stringify(next));
  } catch {
    window.sessionStorage.setItem(SENT_KEY, JSON.stringify([key]));
  }
}

export async function trackFunnelEvent(
  event: FunnelEventName,
  payload: FunnelEventPayload = {},
): Promise<void> {
  if (typeof window === 'undefined') return;

  const sessionId = getFunnelSessionId();
  const storageKey = eventStorageKey(sessionId, event);

  if (wasSent(storageKey) || inFlightEvents.has(storageKey)) return;

  inFlightEvents.add(storageKey);

  try {
    const attribution = captureAdsAttribution();
    const response = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      keepalive: true,
      body: JSON.stringify({
        event_key: crypto.randomUUID(),
        session_id: sessionId,
        diagnosis_id: payload.diagnosisId ?? null,
        lead_id: payload.leadId ?? null,
        event,
        source: 'bip',
        metadata: {
          ...(payload.metadata ?? {}),
          ...attribution,
        },
      }),
    });

    if (response.ok) markSent(storageKey);
  } catch {
    // Analytics tidak boleh mengganggu alur diagnosis utama.
  } finally {
    inFlightEvents.delete(storageKey);
  }
}
