/**
 * Client-only Meta Pixel delivery.
 * Failures are swallowed. HomeCheff flows must not depend on fbq.
 * Automatic Advanced Matching is not enabled: init receives the pixel id only,
 * and autoConfig is off so the pixel does not scrape form fields.
 */
import {
  decidePageView,
  initiateCheckoutEventId,
  MARKETING_CONSENT_KEY,
  marketingConsentState,
  META_STANDARD_EVENTS,
  NEW_ACCOUNT_COOKIE,
  purchaseEventId,
  REGISTER_INTENT_KEY,
  registrationEventId,
  resolveMetaPixelId,
  sanitizeMetaParams,
  shouldFireCompleteRegistration,
  shouldFireInitiateCheckout,
  shouldFirePurchase,
  stripeSessionIdFromCheckoutUrl,
  type MetaParams,
  type MetaStandardEventName,
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
  name: MetaStandardEventName;
  params: MetaParams;
  eventId?: string;
};

let lastPageViewPath: string | null = null;
let initializedPixelId: string | null = null;
let scriptFailed = false;
const recentEventIds = new Map<string, number>();

function claimEventDelivery(eventId: string | undefined, persist: boolean): boolean {
  if (!eventId) return false;
  const now = Date.now();
  const previous = recentEventIds.get(eventId);
  if (previous && now - previous < 2500) return true;
  if (persist) {
    try {
      const key = `hc_meta_once:${eventId}`;
      if (window.sessionStorage.getItem(key) === '1') return true;
      window.sessionStorage.setItem(key, '1');
    } catch {
      /* still allow a single in-memory send */
    }
  }
  recentEventIds.set(eventId, now);
  return false;
}

function readMarketingRaw(): string | null {
  try {
    return window.localStorage.getItem(MARKETING_CONSENT_KEY);
  } catch {
    return null;
  }
}

export function getLastMetaPageViewPath(): string | null {
  return lastPageViewPath;
}

export function resetMetaBrowserStateForTests(): void {
  lastPageViewPath = null;
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

export function revokeMetaPixelConsent(): void {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  try {
    window.fbq('consent', 'revoke');
  } catch {
    /* ignore */
  }
}

function deliver(name: MetaStandardEventName, params: MetaParams, eventId?: string): void {
  const pixelId = resolveMetaPixelId(process.env.NEXT_PUBLIC_META_PIXEL_ID);
  if (!pixelId) return;
  initMetaPixel(pixelId);
  if (scriptFailed && typeof window.fbq !== 'function') return;
  const options = eventId ? { eventID: eventId } : undefined;
  callFbq(['track', name, params, options]);
}

export function trackMetaEvent(
  name: MetaStandardEventName,
  params?: Record<string, unknown> | null,
  eventId?: string | null,
): void {
  if (typeof window === 'undefined') return;
  if (!META_STANDARD_EVENTS.includes(name)) return;
  try {
    const safe = sanitizeMetaParams(params);
    const id = eventId?.trim() || undefined;
    const persistOnce = name === 'Purchase' || name === 'CompleteRegistration';
    if (claimEventDelivery(id, persistOnce)) return;
    const state = marketingConsentState(readMarketingRaw());
    if (state !== 'granted') {
      if (state === 'denied') return;
      if (name === 'PageView') return;
      const pending = readPending().filter(
        (event) => name !== 'ViewContent' || event.name !== 'ViewContent',
      );
      pending.push({ name, params: safe, eventId: id });
      writePending(pending);
      return;
    }
    deliver(name, safe, id);
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
      deliver(event.name, event.params, event.eventId);
    }
  } catch {
    /* ignore */
  }
}

export function trackMetaPageView(pathname: string | null | undefined): void {
  const decision = decidePageView({ pathname, lastPathname: lastPageViewPath });
  if (decision !== 'fire') return;
  if (!resolveMetaPixelId(process.env.NEXT_PUBLIC_META_PIXEL_ID)) return;
  if (marketingConsentState(readMarketingRaw()) !== 'granted') return;
  const path = (pathname ?? '').trim();
  lastPageViewPath = path;
  trackMetaEvent('PageView', undefined, `pv:${path}:${Date.now()}`);
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
    const userId = raw.startsWith('reg:') ? raw.slice(4) : '';
    if (
      !shouldFireCompleteRegistration({
        accountCreated: Boolean(userId),
        surface: 'social',
        registerIntent: intent,
      })
    ) {
      return;
    }
    trackMetaEvent('CompleteRegistration', undefined, registrationEventId(userId));
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
  trackMetaEvent('CompleteRegistration', undefined, registrationEventId(input.userId));
}

export function trackMetaViewContent(input: {
  contentId: string;
  contentName?: string | null;
  contentCategory?: string | null;
  valueCents?: number | null;
}): void {
  const contentId = input.contentId.trim();
  if (!contentId) return;
  const value =
    typeof input.valueCents === 'number' && input.valueCents > 0
      ? Math.round(input.valueCents) / 100
      : undefined;
  trackMetaEvent(
    'ViewContent',
    {
      content_ids: [contentId],
      content_type: 'product',
      content_name: input.contentName ?? undefined,
      content_category: input.contentCategory ?? undefined,
      value,
      currency: value ? 'EUR' : undefined,
    },
    `vc:${contentId}`,
  );
}

export function trackMetaInitiateCheckout(input: {
  ok: boolean;
  checkoutUrl?: string | null;
  sessionId?: string | null;
  hcOnly?: boolean;
  valueCents?: number | null;
  contentIds?: string[];
  numItems?: number;
}): void {
  if (!shouldFireInitiateCheckout(input)) return;
  const sessionId =
    (input.sessionId && input.sessionId.trim()) ||
    stripeSessionIdFromCheckoutUrl(input.checkoutUrl) ||
    '';
  const value =
    typeof input.valueCents === 'number' && input.valueCents > 0
      ? Math.round(input.valueCents) / 100
      : undefined;
  trackMetaEvent(
    'InitiateCheckout',
    {
      value,
      currency: 'EUR',
      content_ids: input.contentIds,
      content_type: 'product',
      num_items: input.numItems,
    },
    initiateCheckoutEventId(sessionId) ?? undefined,
  );
}

export function trackMetaPurchase(input: {
  paymentStatus: string | null | undefined;
  amountTotalCents: number | null | undefined;
  currency?: string | null;
  stripeSessionId?: string | null;
  contentIds?: string[];
}): void {
  if (!shouldFirePurchase(input)) return;
  const eventId = purchaseEventId(input.stripeSessionId);
  if (!eventId) return;
  const currency = (input.currency || 'eur').toUpperCase();
  trackMetaEvent(
    'Purchase',
    {
      value: Math.round(input.amountTotalCents as number) / 100,
      currency: /^[A-Z]{3}$/.test(currency) ? currency : 'EUR',
      content_ids: input.contentIds,
      content_type: 'product',
    },
    eventId,
  );
}
