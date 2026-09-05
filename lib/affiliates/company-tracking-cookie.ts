/**
 * Marketplace company-tracking cookie bridge.
 * Growth /a/[slug] sets cookies on growth.homecheff.eu — Marketplace must re-persist
 * via ?aff_track= query (first-touch, does not override existing company track cookie).
 */
export const COMPANY_TRACK_COOKIE = "hc_aff_track";
export const COMPANY_TRACK_SLUG_COOKIE = "hc_aff_track_slug";
export const COMPANY_TRACK_COOKIE_DAYS = 30;

export type CompanyTrackPayload = {
  slug: string;
  organizationId?: string;
  economicCentralUserId?: string;
  marketerUserId?: string | null;
  campaignId?: string | null;
  trackingAssetId?: string | null;
  channel?: string | null;
};

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export function parseCookieHeader(cookieHeader: string | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key) out[key] = safeDecode(value);
  }
  return out;
}

export function readCompanyTrackSlugFromSearch(search: string): string | null {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const slug = (params.get("aff_track") || params.get("hc_aff_track") || "").trim().toLowerCase();
  return slug || null;
}

export function readCompanyTrackFromCookieHeader(
  cookieHeader: string | null | undefined,
): CompanyTrackPayload | null {
  const cookies = parseCookieHeader(cookieHeader);
  const raw = cookies[COMPANY_TRACK_COOKIE];
  if (raw) {
    try {
      const json = JSON.parse(
        typeof atob === "function"
          ? decodeBase64Url(raw)
          : Buffer.from(raw.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"),
      ) as CompanyTrackPayload;
      if (json?.slug) return json;
    } catch {
      /* fall through to slug-only cookie */
    }
  }
  const slug = cookies[COMPANY_TRACK_SLUG_COOKIE]?.trim().toLowerCase();
  if (slug) return { slug };
  return null;
}

function decodeBase64Url(s: string): string {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  if (typeof atob === "function") {
    return decodeURIComponent(
      Array.from(atob(b64))
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
    );
  }
  return Buffer.from(b64, "base64").toString("utf8");
}

export function encodeCompanyTrackPayload(payload: CompanyTrackPayload): string {
  const json = JSON.stringify(payload);
  if (typeof btoa === "function") {
    return btoa(unescape(encodeURIComponent(json)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }
  return Buffer.from(json, "utf8").toString("base64url");
}

/** Client: first-touch persist of aff_track query → Marketplace-domain cookies. */
export function captureCompanyTrackFromSearchClient(search: string): boolean {
  if (typeof document === "undefined") return false;
  const existing = document.cookie
    .split("; ")
    .some((r) => r.startsWith(`${COMPANY_TRACK_COOKIE}=`) || r.startsWith(`${COMPANY_TRACK_SLUG_COOKIE}=`));
  if (existing) return false;
  const slug = readCompanyTrackSlugFromSearch(search);
  if (!slug) return false;
  const expires = new Date();
  expires.setDate(expires.getDate() + COMPANY_TRACK_COOKIE_DAYS);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const payload = encodeCompanyTrackPayload({ slug });
  document.cookie = `${COMPANY_TRACK_COOKIE}=${payload}; expires=${expires.toUTCString()}; path=/; SameSite=Lax${secure}`;
  document.cookie = `${COMPANY_TRACK_SLUG_COOKIE}=${slug}; expires=${expires.toUTCString()}; path=/; SameSite=Lax${secure}`;
  return true;
}
