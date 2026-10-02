/**
 * Client-only Meta Pixel delivery.
 * Failures are swallowed. HomeCheff flows must not depend on fbq.
 *
 * The pixel loads only after marketing consent and only for an approved
 * conversion event. Automatic Advanced Matching stays off: init receives
 * the pixel id only, and autoConfig is off so the pixel does not scrape forms.
 */
import {
  fbclidFromSearch,
  fbcCookieValue,
  isNewAccountCookieSignal,
  isStripeCheckoutSessionId,
  MARKETING_CONSENT_KEY,
  marketingConsentState,
  maySendMetaFromLocation,
  META_APPROVED_EVENTS,
  META_CLICK_STORAGE_KEY,
  metaCookieClearDirectives,
  metaLocalDedupeKey,
  metaWirePayload,
  NEW_ACCOUNT_COOKIE,
  opaqueMetaEventId,
  redactUrlForMeta,
  REGISTER_INTENT_KEY,
  resolveMetaPixelId,
  sanitizeMetaParams,
  shouldFireCompleteRegistration,
  shouldFirePurchase,
  type MetaApprovedEventName,
  type MetaParams,
} from '@/lib/meta/commerce';

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
  push?: Fbq;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

const PENDING_KEY = 'hc_meta_pending_events';
const SCRIPT_SRC = 'https://connect.facebook.net/en_US/fbevents.js';

type PendingEvent = {
  name: MetaApprovedEventName;
  params: MetaParams;
  eventId: string;
};

let initializedPixelId: string | null = null;
let scriptFailed = false;
const recentEventIds = new Map<string, number>();

function claimEventDelivery(dedupeKey: string | undefined): boolean {
  if (!dedupeKey) return false;
  const now = Date.now();
  const previous = recentEventIds.get(dedupeKey);
  if (previous && now - previous < 2500) return true;
  try {
    const key = `hc_meta_once:${dedupeKey}`;
    if (window.sessionStorage.getItem(key) === '1') return true;
    window.sessionStorage.setItem(key, '1');
  } catch {
    /* still allow a single in-memory send */
  }
  recentEventIds.set(dedupeKey, now);
  return false;
}

function readMarketingRaw(): string | null {
  try {
    return window.localStorage.getItem(MARKETING_CONSENT_KEY);
  } catch {
    return null;
  }
}

export function resetMetaBrowserStateForTests(): void {
  initializedPixelId = null;
  scriptFailed = false;
  recentEventIds.clear();
}

function readPending(): PendingEvent[] {
  try {
    const raw = window.sessionStorage.getItem(PENDING_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PendingEvent[];
    return Array.isArray(parsed) ? parsed.slice(0, 10) : [];
  } catch {
    return [];
  }
}

function writePending(events: PendingEvent[]): void {
  try {
    if (events.length === 0) {
      window.sessionStorage.removeItem(PENDING_KEY);
      return;
    }
    window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(events.slice(-10)));
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearPendingMetaEvents(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

function installStub(): Fbq | null {
  if (typeof window === 'undefined') return null;
  if (typeof window.fbq === 'function') return window.fbq;
  const n = function fbq(this: Fbq, ...args: unknown[]) {
    if (typeof n.callMethod === 'function') {
      n.callMethod.apply(n, args);
      return;
    }
    n.queue = n.queue || [];
    n.queue.push(args);
  } as Fbq;
  n.queue = [];
  n.loaded = true;
  n.version = '2.0';
  n.push = n;
  window.fbq = n;
  if (!window._fbq) window._fbq = n;
  return n;
}

function callFbq(args: unknown[]): void {
  const fbq = installStub();
  if (!fbq) return;
  fbq(...args);
}

export function initMetaPixel(pixelId: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (!pixelId || scriptFailed) return;
  installStub();
  if (initializedPixelId === pixelId) {
    callFbq(['consent', 'grant']);
    return;
  }
  initializedPixelId = pixelId;
  // Do not queue consent-revoke before grant. fbevents stops draining its
  // queue when it sees revoke, so the grant (and every event behind it)
  // would stay stuck until a later live fbq('consent','grant').
  callFbq(['set', 'autoConfig', false, pixelId]);
  callFbq(['init', pixelId]);
  callFbq(['consent', 'grant']);

  const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
  if (existing) return;
  const script = document.createElement('script');
  script.async = true;
  script.src = SCRIPT_SRC;
  script.onerror = () => {
    scriptFailed = true;
  };
  document.head.appendChild(script);
}

function clearMetaBrowserCookies(): void {
  if (typeof document === 'undefined') return;
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  for (const directive of metaCookieClearDirectives(host)) {
    try {
      document.cookie = directive;
    } catch {
      /* ignore */
    }
  }
}

export function revokeMetaPixelConsent(): void {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  try {
    window.fbq('consent', 'revoke');
  } catch {
    /* ignore */
  }
}

/** Stop future events and delete Meta cookies this site can reach. */
export function withdrawMetaMarketingConsent(): void {
  revokeMetaPixelConsent();
  clearPendingMetaEvents();
  clearMetaBrowserCookies();
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(META_CLICK_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * After marketing consent, keep the ad click id on this device so a later
 * conversion can be attributed. This does not load the pixel and does not
 * set a Meta cookie. Nothing is stored before consent.
 */
export function rememberAdClickAfterConsent(): void {
  if (typeof window === 'undefined') return;
  if (marketingConsentState(readMarketingRaw()) !== 'granted') return;
  try {
    const fbclid = fbclidFromSearch(window.location.search);
    if (!fbclid) return;
    window.sessionStorage.setItem(META_CLICK_STORAGE_KEY, fbclid);
  } catch {
    /* ignore */
  }
}

function redactCurrentLocation(): void {
  try {
    const next = redactUrlForMeta(window.location.href);
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (next !== current) {
      window.history.replaceState(window.history.state, '', next);
    }
  } catch {
    /* ignore */
  }
}

function attachClickCookie(): void {
  try {
    const fbclid = window.sessionStorage.getItem(META_CLICK_STORAGE_KEY);
    const value = fbcCookieValue(fbclid ?? '', Date.now());
    if (!value) return;
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `_fbc=${value}; Path=/; Max-Age=7776000; SameSite=Lax${secure}`;
  } catch {
    /* ignore */
  }
}

function deliver(name: MetaApprovedEventName, eventId: string, hiddenSources: string[]): void {
  if (marketingConsentState(readMarketingRaw()) !== 'granted') return;
  if (!maySendMetaFromLocation(window.location.href)) return;
  const wire = metaWirePayload({ eventId, hiddenSources });
  if (!wire) return;
  const pixelId = resolveMetaPixelId(process.env.NEXT_PUBLIC_META_PIXEL_ID);
  if (!pixelId) return;
  redactCurrentLocation();
  attachClickCookie();
  initMetaPixel(pixelId);
  if (scriptFailed && typeof window.fbq !== 'function') return;
  callFbq(['track', name, wire.params, { eventID: wire.eventId }]);
}

export function trackMetaEvent(
  name: MetaApprovedEventName,
  dedupeKey: string,
  hiddenSources: string[],
): void {
  if (typeof window === 'undefined') return;
  if (!(META_APPROVED_EVENTS as readonly string[]).includes(name)) return;
  try {
    const eventId = opaqueMetaEventId();
    if (!eventId) return;
    sanitizeMetaParams(null);
    if (claimEventDelivery(dedupeKey)) return;
    const state = marketingConsentState(readMarketingRaw());
    if (state !== 'granted') {
      if (state === 'denied') return;
      const pending = readPending().filter((event) => event.name !== name);
      pending.push({ name, params: {}, eventId });
      writePending(pending);
      return;
    }
    deliver(name, eventId, hiddenSources);
  } catch {
    /* tracking must never break the app */
  }
}

export function flushPendingMetaEvents(): void {
  if (typeof window === 'undefined') return;
  try {
    if (marketingConsentState(readMarketingRaw()) !== 'granted') return;
    const pending = readPending();
    writePending([]);
    for (const event of pending) {
      deliver(event.name, event.eventId, []);
    }
  } catch {
    /* ignore */
  }
}

export function markMetaRegisterIntent(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(REGISTER_INTENT_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function consumeSocialRegistrationForMeta(): void {
  if (typeof window === 'undefined') return;
  try {
    const intent = window.sessionStorage.getItem(REGISTER_INTENT_KEY) === '1';
    window.sessionStorage.removeItem(REGISTER_INTENT_KEY);
    const parts = document.cookie.split(';');
    let raw = '';
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.startsWith(`${NEW_ACCOUNT_COOKIE}=`)) {
        raw = decodeURIComponent(trimmed.slice(NEW_ACCOUNT_COOKIE.length + 1));
      }
    }
    document.cookie = `${NEW_ACCOUNT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    if (!isNewAccountCookieSignal(raw)) return;
    if (
      !shouldFireCompleteRegistration({
        accountCreated: true,
        surface: 'social',
        registerIntent: intent,
      })
    ) {
      return;
    }
    const dedupeKey = metaLocalDedupeKey('registration', 'social');
    if (!dedupeKey) return;
    trackMetaEvent('CompleteRegistration', dedupeKey, [raw]);
  } catch {
    /* ignore */
  }
}

export function trackMetaCompleteRegistration(input: {
  surface: 'register' | 'login';
  accountCreated: boolean;
  userId?: string | null;
}): void {
  if (
    !shouldFireCompleteRegistration({
      accountCreated: input.accountCreated,
      surface: input.surface,
    })
  ) {
    return;
  }
  const userId = (input.userId ?? '').trim();
  const dedupeKey = metaLocalDedupeKey('registration', userId || input.surface);
  if (!dedupeKey) return;
  trackMetaEvent('CompleteRegistration', dedupeKey, userId ? [userId] : []);
}

export function trackMetaPurchase(input: {
  paymentStatus: string | null | undefined;
  amountTotalCents: number | null | undefined;
  stripeSessionId?: string | null;
}): void {
  if (!shouldFirePurchase(input)) return;
  const sessionId = (input.stripeSessionId ?? '').trim();
  if (!isStripeCheckoutSessionId(sessionId)) return;
  const dedupeKey = metaLocalDedupeKey('purchase', sessionId);
  if (!dedupeKey) return;
  trackMetaEvent('Purchase', dedupeKey, [sessionId]);
}
