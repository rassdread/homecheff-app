/**
 * First-party Marketplace acquisition UTMs — essential attribution (same class as affiliate cookies).
 * Survives landing → login/register → checkout via sessionStorage + host cookie.
 * Keep SEPARATE from hc_ref (affiliate). Never overwrite affiliate with UTM or vice versa.
 * Analytics emission may still be gated; cookie persistence is always allowed.
 */

export const MARKETPLACE_UTM_COOKIE = "hc_marketplace_utm_v1";
export const MARKETPLACE_UTM_STORAGE_KEY = "hc_marketplace_utm_v1";
export const MARKETPLACE_UTM_TTL_DAYS = 30;

/** Stripe metadata value max is 500; keep attribution fields shorter. */
const STRIPE_META_MAX = 120;

export type MarketplaceUtmCapture = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  landing_path?: string;
  captured_at: string;
};

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

function cookieSecure(): boolean {
  return typeof window !== "undefined" && window.location.protocol === "https:";
}

export function scrubUtmValue(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const t = value.trim().slice(0, 120);
  if (!t) return undefined;
  if (/[<>\"'`\\]/.test(t)) return undefined;
  return t;
}

export function readUtmFromSearchParams(
  params: URLSearchParams,
  landingPath?: string,
): MarketplaceUtmCapture | null {
  const out: MarketplaceUtmCapture = { captured_at: new Date().toISOString() };
  let hit = false;
  for (const key of UTM_KEYS) {
    const v = scrubUtmValue(params.get(key));
    if (v) {
      out[key] = v;
      hit = true;
    }
  }
  if (!hit) return null;
  const path = scrubUtmValue(landingPath);
  if (path) out.landing_path = path;
  return out;
}

export function persistMarketplaceUtm(capture: MarketplaceUtmCapture): void {
  if (typeof window === "undefined") return;
  try {
    const json = JSON.stringify(capture);
    window.sessionStorage.setItem(MARKETPLACE_UTM_STORAGE_KEY, json);
    const maxAge = MARKETPLACE_UTM_TTL_DAYS * 24 * 60 * 60;
    document.cookie = `${MARKETPLACE_UTM_COOKIE}=${encodeURIComponent(json)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${
      cookieSecure() ? "; Secure" : ""
    }`;
  } catch {
    /* ignore */
  }
}

export function parseMarketplaceUtmCookieValue(
  raw: string | null | undefined,
): MarketplaceUtmCapture | null {
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded) as MarketplaceUtmCapture;
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.captured_at !== "string") return null;
    return parsed;
  } catch {
    try {
      const parsed = JSON.parse(raw) as MarketplaceUtmCapture;
      if (!parsed || typeof parsed !== "object") return null;
      if (typeof parsed.captured_at !== "string") return null;
      return parsed;
    } catch {
      return null;
    }
  }
}

/** Parse Cookie request header for marketplace UTM (server). Does not touch hc_ref. */
export function parseMarketplaceUtmFromCookieHeader(
  cookieHeader: string | null | undefined,
): MarketplaceUtmCapture | null {
  if (!cookieHeader) return null;
  try {
    const raw = cookieHeader
      .split(";")
      .map((p) => p.trim())
      .find((p) => p.startsWith(`${MARKETPLACE_UTM_COOKIE}=`))
      ?.slice(MARKETPLACE_UTM_COOKIE.length + 1);
    if (!raw) return null;
    return parseMarketplaceUtmCookieValue(raw);
  } catch {
    return null;
  }
}

export function readPersistedMarketplaceUtm(): MarketplaceUtmCapture | null {
  if (typeof window === "undefined") return null;
  try {
    const fromSession = window.sessionStorage.getItem(MARKETPLACE_UTM_STORAGE_KEY);
    if (fromSession) {
      return JSON.parse(fromSession) as MarketplaceUtmCapture;
    }
  } catch {
    /* fall through */
  }
  try {
    const raw = document.cookie
      .split(";")
      .map((p) => p.trim())
      .find((p) => p.startsWith(`${MARKETPLACE_UTM_COOKIE}=`))
      ?.slice(MARKETPLACE_UTM_COOKIE.length + 1);
    if (!raw) return null;
    return parseMarketplaceUtmCookieValue(raw);
  } catch {
    return null;
  }
}

/** First-touch: only overwrite when no prior capture exists. */
export function captureMarketplaceUtmFirstTouch(
  params: URLSearchParams,
  landingPath: string,
): MarketplaceUtmCapture | null {
  const existing = readPersistedMarketplaceUtm();
  if (existing?.utm_source || existing?.utm_campaign) return existing;
  const next = readUtmFromSearchParams(params, landingPath);
  if (!next) return existing;
  persistMarketplaceUtm(next);
  return next;
}

export function utmQueryString(capture: MarketplaceUtmCapture | null): string {
  if (!capture) return "";
  const sp = new URLSearchParams();
  for (const key of UTM_KEYS) {
    const v = capture[key];
    if (v) sp.set(key, v);
  }
  return sp.toString();
}

/** Append first-touch UTMs to same-origin auth/product hrefs. */
export function withMarketplaceUtm(href: string): string {
  if (typeof window === "undefined") return href;
  if (!href.startsWith("/")) return href;
  const capture = readPersistedMarketplaceUtm();
  const qs = utmQueryString(capture);
  if (!qs) return href;
  const u = new URL(href, window.location.origin);
  for (const key of UTM_KEYS) {
    if (!u.searchParams.has(key) && capture?.[key]) {
      u.searchParams.set(key, capture[key]!);
    }
  }
  return `${u.pathname}${u.search}${u.hash}`;
}

function truncateMeta(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const t = value.trim().slice(0, STRIPE_META_MAX);
  return t || undefined;
}

/** Flatten capture into Stripe Checkout session metadata keys (omit empties). */
export function marketplaceUtmToStripeMetadata(
  capture: MarketplaceUtmCapture | null | undefined,
): Record<string, string> {
  if (!capture) return {};
  const out: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const v = truncateMeta(capture[key]);
    if (v) out[key] = v;
  }
  const landing = truncateMeta(capture.landing_path);
  if (landing) out.landing_path = landing;
  const at = truncateMeta(capture.captured_at);
  if (at) out.first_touch_at = at;
  return out;
}

export function hasMarketplaceUtmSignal(
  capture: MarketplaceUtmCapture | null | undefined,
): boolean {
  return Boolean(capture?.utm_source || capture?.utm_campaign);
}
