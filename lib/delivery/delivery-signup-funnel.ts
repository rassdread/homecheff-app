/**
 * First-party delivery registration funnel.
 * Sends nothing until analytics consent, and never sends personal fields.
 */
import { ANALYTICS_CONSENT_KEY, analyticsConsentGranted } from '@/lib/meta/commerce';

export const DELIVERY_FUNNEL_EVENTS = [
  'delivery_signup_started',
  'delivery_signup_step_viewed',
  'delivery_signup_step_completed',
  'delivery_signup_validation_failed',
  'delivery_signup_submitted',
  'delivery_signup_completed',
] as const;

export type DeliveryFunnelEvent = (typeof DELIVERY_FUNNEL_EVENTS)[number];

const ALLOWED_KEYS = [
  'step',
  'registrationType',
  'language',
  'flowId',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'reason',
] as const;

const sent = new Set<string>();

export function scrubDeliveryFunnelMetadata(
  metadata: Record<string, unknown> | null | undefined,
): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  const source = metadata && typeof metadata === 'object' ? metadata : {};
  for (const key of ALLOWED_KEYS) {
    const value = source[key];
    if (key === 'step' && typeof value === 'number' && Number.isFinite(value)) {
      out.step = Math.max(0, Math.min(20, Math.round(value)));
      continue;
    }
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (!trimmed || trimmed.length > 80 || trimmed.includes('@') || /[<>"`\\]/.test(trimmed)) {
      continue;
    }
    out[key] = trimmed;
  }
  return out;
}

export function deliveryFunnelConsentGranted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return analyticsConsentGranted(window.localStorage.getItem(ANALYTICS_CONSENT_KEY));
  } catch {
    return false;
  }
}

export function trackDeliverySignupFunnel(
  event: DeliveryFunnelEvent,
  metadata?: Record<string, unknown>,
): void {
  if (typeof window === 'undefined') return;
  if (!DELIVERY_FUNNEL_EVENTS.includes(event)) return;
  if (!deliveryFunnelConsentGranted()) return;
  const clean = scrubDeliveryFunnelMetadata(metadata);
  const dedupeKey = `${event}:${clean.flowId || ''}:${clean.step || ''}:${clean.reason || ''}`;
  if (event === 'delivery_signup_step_viewed' || event === 'delivery_signup_started') {
    if (sent.has(dedupeKey)) return;
    sent.add(dedupeKey);
  }
  try {
    void fetch('/api/analytics/opportunity', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({ eventType: event, metadata: clean }),
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}
