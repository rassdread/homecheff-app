/**
 * Client helper — fire-and-forget opportunity events to server AnalyticsEvent + optional gtag.
 */
export function trackOpportunityClient(
  eventType: string,
  metadata?: Record<string, unknown>,
): void {
  if (typeof window === 'undefined') return;
  const payload = {
    ...(metadata && typeof metadata === 'object' ? metadata : {}),
    path: window.location?.pathname,
    ts: new Date().toISOString(),
  };
  try {
    const w = window as Window & {
      gtag?: (...args: unknown[]) => void;
      dataLayer?: Record<string, unknown>[];
    };
    if (typeof w.gtag === 'function') w.gtag('event', eventType, payload);
    if (Array.isArray(w.dataLayer)) w.dataLayer.push({ event: eventType, ...payload });
  } catch {
    /* ignore */
  }
  try {
    void fetch('/api/analytics/opportunity', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({ eventType, metadata: payload }),
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}

/** Stable share session id for correlating share → landing → attribution when possible. */
export function newShareSessionId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    /* ignore */
  }
  return `share_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
