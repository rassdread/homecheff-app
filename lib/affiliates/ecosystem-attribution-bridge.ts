/**
 * Bridge Marketplace local attribution / sub-tree → Growth ecosystem (forward-looking).
 * Non-blocking: failures must never break signup or create-sub.
 */
async function growthInternalBase(): Promise<{ base: string; secret: string } | null> {
  const base = (
    process.env.GROWTH_HC_QUOTE_BASE_URL ??
    process.env.GROWTH_API_BASE_URL ??
    'https://growth.homecheff.eu'
  ).replace(/\/$/, '');
  const secret = (
    process.env.HC_ECOSYSTEM_INTERNAL_SECRET ??
    process.env.HC_INTERNAL_PROBE_SECRET ??
    process.env.STUDIO_HC_INTERNAL_SECRET ??
    ''
  ).trim();
  if (!secret) return null;
  return { base, secret };
}

function centralId(user: { id: string; centralUserId?: string | null } | null | undefined): string {
  if (!user) return '';
  return (user.centralUserId || user.id || '').trim();
}

export async function bridgeMarketplaceAttributionToEcosystem(input: {
  referredUserId: string;
  affiliateUserId: string;
  sourceCampaign?: string | null;
}): Promise<{ ok: boolean; code?: string }> {
  try {
    const creds = await growthInternalBase();
    if (!creds) return { ok: false, code: 'NO_SECRET' };

    const { prisma } = await import('@/lib/prisma');
    const [referred, affiliate] = await Promise.all([
      prisma.user.findUnique({ where: { id: input.referredUserId }, select: { id: true } }),
      prisma.user.findUnique({ where: { id: input.affiliateUserId }, select: { id: true } }),
    ]);
    const referredCentral = centralId(referred);
    const affiliateCentral = centralId(affiliate);
    if (!referredCentral || !affiliateCentral) return { ok: false, code: 'IDENTITY_MISSING' };
    if (referredCentral === affiliateCentral) return { ok: false, code: 'SELF_REFERRAL' };

    const res = await fetch(`${creds.base}/api/internal/ecosystem/affiliate/attribution/lock`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-hc-internal-secret': creds.secret,
        'x-studio-internal-secret': creds.secret,
      },
      body: JSON.stringify({
        referredCentralUserId: referredCentral,
        affiliateCentralUserId: affiliateCentral,
        sourcePlatform: 'MARKETPLACE',
        sourceCampaign: input.sourceCampaign ?? 'marketplace_signup',
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, code: String((body as { code?: string }).code || res.status) };
    }
    return { ok: true };
  } catch (e) {
    console.error('[ecosystem-attribution-bridge]', e);
    return { ok: false, code: 'BRIDGE_ERROR' };
  }
}

/** Sync Marketplace parentAffiliateId → canonical EcosystemAffiliateEdge. */
export async function bridgeMarketplaceParentEdgeToEcosystem(input: {
  childUserId: string;
  parentUserId: string;
  context?: string;
}): Promise<{ ok: boolean; code?: string }> {
  try {
    const creds = await growthInternalBase();
    if (!creds) return { ok: false, code: 'NO_SECRET' };

    const childCentral = input.childUserId.trim();
    const parentCentral = input.parentUserId.trim();
    if (!childCentral || !parentCentral) return { ok: false, code: 'IDENTITY_MISSING' };
    if (childCentral === parentCentral) return { ok: false, code: 'SELF_REFERRAL' };

    const res = await fetch(`${creds.base}/api/internal/ecosystem/affiliate/edge/upsert`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-hc-internal-secret': creds.secret,
        'x-studio-internal-secret': creds.secret,
      },
      body: JSON.stringify({
        childCentralUserId: childCentral,
        parentCentralUserId: parentCentral,
        sourcePlatform: 'MARKETPLACE',
        sourceReferralContext: input.context ?? 'marketplace_create_sub',
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, code: String((body as { code?: string }).code || res.status) };
    }
    return { ok: true };
  } catch (e) {
    console.error('[ecosystem-edge-bridge]', e);
    return { ok: false, code: 'BRIDGE_ERROR' };
  }
}
