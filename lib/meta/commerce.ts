/**
 * Pure Meta Pixel decisions. No window, no network, no PII.
 * Browser delivery lives in lib/meta/browser.ts.
 *
 * Conversions API is not enabled. Do not add an access token here.
 * Custom data is intentionally empty: HomeCheff sends event names only.
 */

export const META_PIXEL_ENV = 'NEXT_PUBLIC_META_PIXEL_ID';

export const MARKETING_CONSENT_KEY = 'hc-marketing-consent';
export const ANALYTICS_CONSENT_KEY = 'privacy-notice-accepted';
export const REGISTER_INTENT_KEY = 'hc_meta_register_intent';
export const NEW_ACCOUNT_COOKIE = 'hc_new_account';
/** Presence flag only. Never store a user id in this cookie. */
export const NEW_ACCOUNT_COOKIE_VALUE = '1';
export const META_CLICK_STORAGE_KEY = 'hc_meta_click';

/**
 * Lowest set that can still answer:
 * - did a HomeCheff campaign generate registrations?
 * - did it generate a genuine paid marketplace conversion?
 * - what was the approximate cost per conversion (ad spend / attributed conversions)?
 *
 * PageView, ViewContent and InitiateCheckout are not in this set.
 * Order value is not sent. Cost per conversion does not need the euro amount.
 */
export const META_APPROVED_EVENTS = ['CompleteRegistration', 'Purchase'] as const;

export type MetaApprovedEventName = (typeof META_APPROVED_EVENTS)[number];

export type MetaParamValue = string | number | string[];
export type MetaParams = Record<string, MetaParamValue>;

const SENSITIVE_QUERY_KEYS = new Set([
  'session_id',
  'payment_intent',
  'payment_intent_client_secret',
  'hc_ref',
  'ref',
  'email',
  'phone',
  'name',
  'address',
  'q',
  'query',
  'search',
]);

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

export function shouldTransmitMetaEvent(input: {
  name: string;
  marketingConsent: string | null | undefined;
}): boolean {
  if (marketingConsentState(input.marketingConsent) !== 'granted') return false;
  return (META_APPROVED_EVENTS as readonly string[]).includes(input.name);
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

export function isStripeCheckoutSessionId(value: string | null | undefined): boolean {
  return /^cs_(?:test|live)_[A-Za-z0-9]+$/.test((value ?? '').trim());
}

/**
 * Event id sent to Meta. Random. Must not contain the source identifier.
 * Duplicate protection uses a separate local key that is never put on the wire.
 */
export function opaqueMetaEventId(createRandom?: () => string): string | null {
  let raw = '';
  try {
    raw = createRandom
      ? createRandom()
      : typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : '';
  } catch {
    raw = '';
  }
  const id = raw.trim();
  if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) return null;
  if (/^cs_/i.test(id) || id.includes('@') || id.toLowerCase().startsWith('reg')) return null;
  return id;
}

export function metaWirePayload(input: {
  eventId: string;
  hiddenSources: Array<string | null | undefined>;
}): { eventId: string; params: MetaParams } | null {
  const eventId = input.eventId.trim();
  if (!opaqueMetaEventId(() => eventId)) return null;
  for (const source of input.hiddenSources) {
    const secret = (source ?? '').trim();
    if (secret.length >= 6 && eventId.includes(secret)) return null;
  }
  return { eventId, params: {} };
}

/** Drop every custom parameter. HomeCheff does not send a Meta custom-data payload. */
export function sanitizeMetaParams(params: Record<string, unknown> | undefined | null): MetaParams {
  void params;
  return {};
}

export function fbclidFromSearch(search: string | null | undefined): string | null {
  const params = new URLSearchParams((search ?? '').replace(/^\?/, ''));
  const value = (params.get('fbclid') ?? '').trim();
  if (!/^[A-Za-z0-9_-]{8,200}$/.test(value)) return null;
  return value;
}

/** Meta click cookie. Set only after marketing consent, and only when a conversion is sent. */
export function fbcCookieValue(fbclid: string, nowMs: number): string | null {
  if (!fbclidFromSearch(`?fbclid=${fbclid}`)) return null;
  if (!Number.isFinite(nowMs)) return null;
  return `fb.1.${Math.floor(nowMs)}.${fbclid}`;
}

export function redactUrlForMeta(href: string): string {
  let url: URL;
  try {
    url = new URL(href, 'https://homecheff.eu');
  } catch {
    return '/';
  }
  const keys = [...url.searchParams.keys()];
  for (const key of keys) {
    const lower = key.toLowerCase();
    const value = url.searchParams.get(key) ?? '';
    const sensitive =
      SENSITIVE_QUERY_KEYS.has(lower) ||
      lower.includes('email') ||
      lower.includes('phone') ||
      lower.includes('address') ||
      lower.includes('name') ||
      value.includes('@');
    if (sensitive) url.searchParams.delete(key);
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

export function maySendMetaFromLocation(href: string): boolean {
  let url: URL;
  try {
    url = new URL(href, 'https://homecheff.eu');
  } catch {
    return false;
  }
  if (url.pathname === '/welkom' || url.pathname.startsWith('/welkom/')) return false;
  if (url.searchParams.has('hc_ref') || url.searchParams.has('ref')) return false;
  const redacted = redactUrlForMeta(href);
  if (redacted.includes('hc_ref=') || redacted.includes('/welkom/')) return false;
  return true;
}

export function metaCookieClearDirectives(hostname: string): string[] {
  const names = ['_fbp', '_fbc'];
  const directives: string[] = [];
  for (const name of names) {
    const base = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
    directives.push(base);
    const host = hostname.trim();
    if (!host || host === 'localhost') continue;
    directives.push(`${base}; Domain=${host}`);
    const parts = host.split('.').filter(Boolean);
    if (parts.length >= 2) {
      directives.push(`${base}; Domain=.${parts.slice(-2).join('.')}`);
    }
  }
  return directives;
}

/** Device-local dedupe key. The source id is not recoverable from the key and is not sent to Meta. */
export function metaLocalDedupeKey(
  purpose: 'registration' | 'purchase',
  source: string,
): string | null {
  const value = source.trim();
  if (!value) return null;
  let a = 2166136261;
  let b = 2166136261 ^ 0x9e3779b9;
  for (let i = 0; i < value.length; i++) {
    a ^= value.charCodeAt(i);
    a = Math.imul(a, 16777619);
    b ^= value.charCodeAt(value.length - 1 - i);
    b = Math.imul(b, 16777619);
  }
  const key = `${purpose}:${(a >>> 0).toString(16)}${(b >>> 0).toString(16)}`;
  if (value.length >= 8 && key.includes(value)) return null;
  return key;
}

export function isNewAccountCookieSignal(value: string | null | undefined): boolean {
  const raw = (value ?? '').trim();
  if (raw === NEW_ACCOUNT_COOKIE_VALUE) return true;
  // Older cookies stored reg:{userId}. Treat them as a one-shot signal only.
  // The caller must not forward that value to Meta.
  return /^reg:[A-Za-z0-9_-]{8,64}$/.test(raw);
}
