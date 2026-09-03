/**
 * Bridge Marketplace local attribution → Growth ecosystem attribution (forward-looking).
 * Non-blocking: failures must never break signup.
 */
export async function bridgeMarketplaceAttributionToEcosystem(input: {
  referredUserId: string;
  affiliateUserId: string;
  sourceCampaign?: string | null;
}): Promise<{ ok: boolean; code?: string }> {
  try {
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
    if (!secret) return { ok: false, code: 'NO_SECRET' };

    const { prisma } = await import('@/lib/prisma');
    const [referred, affiliate] = await Promise.all([
      prisma.user.findUnique({
        where: { id: input.referredUserId },
        select: { id: true, centralUserId: true },
      }),
      prisma.user.findUnique({
        where: { id: input.affiliateUserId },
        select: { id: true, centralUserId: true },
      }),
    ]);
    const referredCentral = (referred?.centralUserId || referred?.id || '').trim();
    const affiliateCentral = (affiliate?.centralUserId || affiliate?.id || '').trim();
    if (!referredCentral || !affiliateCentral) return { ok: false, code: 'IDENTITY_MISSING' };
    if (referredCentral === affiliateCentral) return { ok: false, code: 'SELF_REFERRAL' };

    const res = await fetch(`${base}/api/internal/ecosystem/affiliate/attribution/lock`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-hc-internal-secret': secret,
        'x-studio-internal-secret': secret,
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
