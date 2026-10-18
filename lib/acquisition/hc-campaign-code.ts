/**
 * HC campaign code from ?campaign=.
 * Kept apart from affiliate hc_ref and from utm_campaign.
 */

export const HC_CAMPAIGN_COOKIE = "hc_campaign_code_v1";
export const HC_CAMPAIGN_TTL_DAYS = 30;

export function normalizeHcCampaignCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const code = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (!/^[A-Z0-9]{4,32}$/.test(code)) return null;
  return code;
}

export function readHcCampaignCodeFromSearch(params: URLSearchParams): string | null {
  return normalizeHcCampaignCode(params.get("campaign"));
}

export function parseHcCampaignCodeFromCookieHeader(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  const row = parts.find((p) => p.startsWith(`${HC_CAMPAIGN_COOKIE}=`));
  if (!row) return null;
  const raw = row.slice(HC_CAMPAIGN_COOKIE.length + 1);
  try {
    return normalizeHcCampaignCode(decodeURIComponent(raw));
  } catch {
    return null;
  }
}

export function hcCampaignCookieHeader(code: string): string {
  const maxAge = HC_CAMPAIGN_TTL_DAYS * 24 * 60 * 60;
  return `${HC_CAMPAIGN_COOKIE}=${encodeURIComponent(code)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}
