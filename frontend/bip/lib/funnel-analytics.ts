'use client';

const API_BASE = 'https://api.drrkobe.com/api/v1';
const SESSION_KEY = 'drrkobe_bip_funnel_session';
const SENT_KEY = 'drrkobe_bip_funnel_sent';
const inFlightEvents = new Set<string>();

export type FunnelEventName =
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

function canUseBrowserStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
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
        metadata: payload.metadata ?? null,
      }),
    });

    if (response.ok) markSent(storageKey);
  } catch {
    // Analytics tidak boleh mengganggu alur diagnosis utama.
  } finally {
    inFlightEvents.delete(storageKey);
  }
}
