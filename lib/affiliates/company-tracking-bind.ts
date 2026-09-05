/**
 * Resolve company tracking slug via Growth and lock EcosystemAffiliateAttribution
 * to the COMPANY economic owner (not the marketer).
 */
import {
  readCompanyTrackFromCookieHeader,
  type CompanyTrackPayload,
} from "@/lib/affiliates/company-tracking-cookie";

async function growthCreds(): Promise<{ base: string; secret: string } | null> {
  const base = (
    process.env.GROWTH_HC_QUOTE_BASE_URL ??
    process.env.GROWTH_API_BASE_URL ??
    "https://growth.homecheff.eu"
  ).replace(/\/$/, "");
  const secret = (
    process.env.HC_ECOSYSTEM_INTERNAL_SECRET ??
    process.env.HC_INTERNAL_PROBE_SECRET ??
    process.env.STUDIO_HC_INTERNAL_SECRET ??
    process.env.HC_MARKETPLACE_QUOTE_INTERNAL_SECRET ??
    ""
  ).trim();
  if (!secret) return null;
  return { base, secret };
}

function headers(secret: string): Record<string, string> {
  return {
    "content-type": "application/json",
    "x-hc-ecosystem-internal-secret": secret,
    "x-studio-hc-internal-secret": secret,
    "x-hc-internal-secret": secret,
    Authorization: `Bearer ${secret}`,
  };
}

export type ResolvedCompanyTrack = {
  slug: string;
  trackingAssetId: string;
  organizationId: string;
  campaignId: string | null;
  marketerUserId: string | null;
  channel: string | null;
  economicCentralUserId: string;
  campaignCode: string | null;
};

export async function resolveCompanyTrackingSlug(
  slug: string,
): Promise<ResolvedCompanyTrack | null> {
  const creds = await growthCreds();
  if (!creds) return null;
  const url = new URL(`${creds.base}/api/internal/ecosystem/affiliate/tracking/resolve`);
  url.searchParams.set("slug", slug.trim().toLowerCase());
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: headers(creds.secret),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const body = (await res.json()) as {
    ok?: boolean;
    found?: boolean;
    slug?: string;
    trackingAssetId?: string;
    organizationId?: string;
    campaignId?: string | null;
    marketerUserId?: string | null;
    channel?: string | null;
    economicCentralUserId?: string;
    campaignCode?: string | null;
  };
  if (!body.ok || !body.found || !body.economicCentralUserId || !body.organizationId) {
    return null;
  }
  return {
    slug: body.slug || slug,
    trackingAssetId: body.trackingAssetId!,
    organizationId: body.organizationId,
    campaignId: body.campaignId ?? null,
    marketerUserId: body.marketerUserId ?? null,
    channel: body.channel ?? null,
    economicCentralUserId: body.economicCentralUserId,
    campaignCode: body.campaignCode ?? null,
  };
}

/**
 * On Marketplace signup: if hc_aff_track present, lock ecosystem attribution to company.
 * Does NOT create Marketplace Attribution (company is not a fake personal affiliate).
 * Existing ACTIVE ecosystem lock wins (first-touch).
 */
export async function processCompanyTrackingOnSignup(
  referredUserId: string,
  cookieHeader: string | null,
): Promise<{ ok: boolean; locked?: boolean; code?: string }> {
  try {
    const track = readCompanyTrackFromCookieHeader(cookieHeader);
    if (!track?.slug) return { ok: true, locked: false, code: "NO_TRACK" };

    const resolved = await resolveCompanyTrackingSlug(track.slug);
    if (!resolved) return { ok: false, code: "TRACK_NOT_FOUND" };

    if (resolved.economicCentralUserId === referredUserId) {
      return { ok: false, code: "SELF_REFERRAL" };
    }

    const creds = await growthCreds();
    if (!creds) return { ok: false, code: "NO_SECRET" };

    const res = await fetch(`${creds.base}/api/internal/ecosystem/affiliate/attribution/lock`, {
      method: "POST",
      headers: headers(creds.secret),
      body: JSON.stringify({
        referredCentralUserId: referredUserId,
        affiliateCentralUserId: resolved.economicCentralUserId,
        sourcePlatform: "MARKETPLACE",
        sourceCampaign: resolved.campaignCode ?? `company_track:${resolved.slug}`,
        acquisition: {
          organizationId: resolved.organizationId,
          marketerUserId: resolved.marketerUserId,
          campaignId: resolved.campaignId,
          trackingAssetId: resolved.trackingAssetId,
          channel: resolved.channel,
          acquisitionMedium: "aff_track_cookie",
          sourceCampaign: resolved.campaignCode,
        },
      }),
    });
    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      created?: boolean;
      lockedExisting?: boolean;
      code?: string;
    };
    if (!res.ok || body.ok === false) {
      return { ok: false, code: String(body.code || res.status) };
    }
    return { ok: true, locked: Boolean(body.created || body.lockedExisting) };
  } catch (e) {
    console.error("[company-tracking-bind]", e);
    return { ok: false, code: "BRIDGE_ERROR" };
  }
}

export type { CompanyTrackPayload };
