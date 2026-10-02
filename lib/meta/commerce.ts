/**
 * Pure Meta Pixel decisions. No window, no network, no PII.
 * Browser delivery lives in lib/meta/browser.ts.
 *
 * Future Conversions API (not enabled):
 * send the same event_id values from the server. Browser pixel uses Meta's
 * eventID field; CAPI uses event_id. Do not create access tokens here.
 */

export const META_PIXEL_ENV = 'NEXT_PUBLIC_META_PIXEL_ID';

export const MARKETING_CONSENT_KEY = 'hc-marketing-consent';
export const ANALYTICS_CONSENT_KEY = 'privacy-notice-accepted';
export const REGISTER_INTENT_KEY = 'hc_meta_register_intent';
export const NEW_ACCOUNT_COOKIE = 'hc_new_account';

export const META_STANDARD_EVENTS = [
  'PageView',
  'CompleteRegistration',
  'ViewContent',
  'InitiateCheckout',
  'Purchase',
] as const;

export type MetaStandardEventName = (typeof META_STANDARD_EVENTS)[number];

const ALLOWED_PARAM_KEYS = new Set([
  'value',
  'currency',
  'content_ids',
  'content_type',
  'content_name',
  'content_category',
  'num_items',
]);

export type MetaParamValue = string | number | string[];
export type MetaParams = Record<string, MetaParamValue>;

export function resolveMetaPixelId(raw: string | undefined | null): string | null {
  const id = (raw ?? '').trim();
  if (!/^\d{8,20}$/.test(id)) return null;
  return id;
}

/** Analytics consent (privacy-notice-accepted = true | all) is not advertising consent. */
export function analyticsConsentGranted(value: string | null | undefined): boolean {
  return value === 'true' || value === 'all';
}

export function marketingConsentState(
  value: string | null | undefined,
): 'granted' | 'denied' | 'unknown' {
  if (value === 'granted') return 'granted';
  if (value === 'denied') return 'denied';
  return 'unknown';
}

export function shouldLoadMetaPixel(input: {
  pixelId: string | null;
  marketingConsent: string | null | undefined;
}): boolean {
  return Boolean(input.pixelId) && marketingConsentState(input.marketingConsent) === 'granted';
}

export type PageViewDecision = 'fire' | 'skip-duplicate' | 'skip-empty';

/**
 * PageView follows the Next.js pathname only.
 * Query-string updates are UI state (filters, drafts) and must not create another PageView.
 * Prefetch does not change pathname, so it does not fire.
 */
export function decidePageView(input: {
  pathname: string | null | undefined;
  lastPathname: string | null;
}): PageViewDecision {
  const path = (input.pathname ?? '').trim();
  if (!path || path.startsWith('/_next')) return 'skip-empty';
  if (input.lastPathname === path) return 'skip-duplicate';
  return 'fire';
}

export function shouldFireCompleteRegistration(input: {
  accountCreated: boolean;
  surface: 'register' | 'login' | 'social';
  registerIntent?: boolean;
}): boolean {
  if (!input.accountCreated) return false;
  if (input.surface === 'login') return false;
  if (input.surface === 'social') return input.registerIntent === true;
  return input.surface === 'register';
}

export function shouldFireInitiateCheckout(input: {
  ok: boolean;
  checkoutUrl?: string | null;
  sessionId?: string | null;
  hcOnly?: boolean;
}): boolean {
  if (input.hcOnly) return false;
  if (!input.ok) return false;
  return Boolean((input.checkoutUrl && input.checkoutUrl.trim()) || (input.sessionId && input.sessionId.trim()));
}

export function shouldFirePurchase(input: {
  paymentStatus: string | null | undefined;
  amountTotalCents: number | null | undefined;
}): boolean {
  return (
    input.paymentStatus === 'paid' &&
    typeof input.amountTotalCents === 'number' &&
    Number.isFinite(input.amountTotalCents) &&
    input.amountTotalCents > 0
  );
}

export function registrationEventId(userId: string | null | undefined): string | null {
  const id = (userId ?? '').trim();
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(id)) return null;
  return `reg:${id}`;
}

export function purchaseEventId(stripeSessionId: string | null | undefined): string | null {
  const id = (stripeSessionId ?? '').trim();
  if (!/^cs_[A-Za-z0-9_]+$/.test(id)) return null;
  return `purchase:${id}`;
}

export function initiateCheckoutEventId(stripeSessionId: string | null | undefined): string | null {
  const id = (stripeSessionId ?? '').trim();
  if (!/^cs_[A-Za-z0-9_]+$/.test(id)) return null;
  return `ic:${id}`;
}

/** Pull a Checkout Session id out of a Stripe-hosted URL. Returns null when absent. */
export function stripeSessionIdFromCheckoutUrl(url: string | null | undefined): string | null {
  const match = (url ?? '').match(/cs_(?:test|live)_[A-Za-z0-9]+/);
  return match ? match[0] : null;
}

export function eurosFromCents(cents: number | null | undefined): number | null {
  if (typeof cents !== 'number' || !Number.isFinite(cents) || cents <= 0) return null;
  return Math.round(cents) / 100;
}

export function sanitizeMetaParams(params: Record<string, unknown> | undefined | null): MetaParams {
  const out: MetaParams = {};
  if (!params) return out;
  for (const [key, value] of Object.entries(params)) {
    if (!ALLOWED_PARAM_KEYS.has(key)) continue;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed || trimmed.includes('@') || trimmed.length > 120) continue;
      out[key] = trimmed;
      continue;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      out[key] = value;
      continue;
    }
    if (key === 'content_ids' && Array.isArray(value)) {
      const ids = value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter((item) => item.length > 0 && item.length <= 80 && !item.includes('@'))
        .slice(0, 20);
      if (ids.length > 0) out[key] = ids;
    }
  }
  return out;
}
