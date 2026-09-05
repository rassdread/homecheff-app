/**
 * Bridge Marketplace local attribution / sub-tree → Growth ecosystem (forward-looking).
 * Non-blocking for signup; Delivery accrual treats resolve/record failures as soft skip → legacy path.
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
    process.env.HC_MARKETPLACE_QUOTE_INTERNAL_SECRET ??
    ''
  ).trim();
  if (!secret) return null;
  return { base, secret };
}

function internalHeaders(secret: string): Record<string, string> {
  return {
    'content-type': 'application/json',
    'x-hc-ecosystem-internal-secret': secret,
    'x-studio-hc-internal-secret': secret,
    'x-hc-internal-secret': secret,
    'x-studio-internal-secret': secret,
    Authorization: `Bearer ${secret}`,
  };
}

function centralId(user: { id: string; centralUserId?: string | null } | null | undefined): string {
  if (!user) return '';
  return (user.centralUserId || user.id || '').trim();
}

export type ResolvedEcosystemAttribution = {
  id: string;
  referredCentralUserId: string;
  affiliateCentralUserId: string;
  sourcePlatform: string;
  sourceCampaign: string | null;
  status: string;
  attributionStart: string;
  attributionEnd: string;
  lockedAt: string;
};

export async function resolveActiveEcosystemAttribution(input: {
  referredUserId: string;
  at?: Date;
}): Promise<{
  ok: boolean;
  found: boolean;
  code?: string;
  attribution?: ResolvedEcosystemAttribution;
  affiliateParentCentralUserId?: string | null;
  structure?: 'DIRECT' | 'MAIN10_SUB40';
}> {
  try {
    const creds = await growthInternalBase();
    if (!creds) return { ok: false, found: false, code: 'NO_SECRET' };

    const referredCentral = input.referredUserId.trim();
    if (!referredCentral) return { ok: false, found: false, code: 'IDENTITY_MISSING' };

    const url = new URL(`${creds.base}/api/internal/ecosystem/affiliate/attribution/resolve`);
    url.searchParams.set('referredCentralUserId', referredCentral);
    if (input.at) url.searchParams.set('at', input.at.toISOString());

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: internalHeaders(creds.secret),
      cache: 'no-store',
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, found: false, code: String((body as { code?: string }).code || res.status) };
    }
    const body = (await res.json()) as {
      ok?: boolean;
      found?: boolean;
      attribution?: ResolvedEcosystemAttribution;
      affiliateParentCentralUserId?: string | null;
      structure?: 'DIRECT' | 'MAIN10_SUB40';
    };
    if (!body.found || !body.attribution) {
      return { ok: true, found: false };
    }
    return {
      ok: true,
      found: true,
      attribution: body.attribution,
      affiliateParentCentralUserId: body.affiliateParentCentralUserId ?? null,
      structure: body.structure ?? 'DIRECT',
    };
  } catch (e) {
    console.error('[ecosystem-attribution-resolve]', e);
    return { ok: false, found: false, code: 'BRIDGE_ERROR' };
  }
}

export async function recordDeliveryPlatformFeeEcosystemCommission(input: {
  referredUserId: string;
  sourceTransactionId: string;
  deliveryPlatformFeeCents: number;
  deliveryFeeGrossCents?: number;
  orderId?: string;
  deliveryOrderId?: string;
  providerUserId?: string;
}): Promise<{
  ok: boolean;
  duplicate?: boolean;
  eventId?: string;
  commissionAmountCents?: number;
  parentEventId?: string;
  code?: string;
  allocation?: {
    affiliatePoolCents: number;
    childOrDirectCents: number;
    parentCents: number;
    hasParent: boolean;
    calculationVersion: string;
  };
}> {
  try {
    const creds = await growthInternalBase();
    if (!creds) return { ok: false, code: 'NO_SECRET' };

    const res = await fetch(`${creds.base}/api/internal/ecosystem/affiliate/commission`, {
      method: 'POST',
      headers: internalHeaders(creds.secret),
      body: JSON.stringify({
        action: 'DELIVERY_PLATFORM_FEE',
        referredCentralUserId: input.referredUserId.trim(),
        sourceTransactionId: input.sourceTransactionId,
        deliveryPlatformFeeCents: input.deliveryPlatformFeeCents,
        deliveryFeeGrossCents: input.deliveryFeeGrossCents,
        orderId: input.orderId ?? null,
        deliveryOrderId: input.deliveryOrderId ?? null,
        providerCentralUserId: input.providerUserId ?? null,
      }),
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok || body.ok === false) {
      return { ok: false, code: String(body.code || res.status) };
    }
    return {
      ok: true,
      duplicate: Boolean(body.duplicate),
      eventId: typeof body.eventId === 'string' ? body.eventId : undefined,
      commissionAmountCents:
        typeof body.commissionAmountCents === 'number' ? body.commissionAmountCents : undefined,
      parentEventId: typeof body.parentEventId === 'string' ? body.parentEventId : undefined,
      allocation: body.allocation as
        | {
            affiliatePoolCents: number;
            childOrDirectCents: number;
            parentCents: number;
            hasParent: boolean;
            calculationVersion: string;
          }
        | undefined,
    };
  } catch (e) {
    console.error('[ecosystem-delivery-commission]', e);
    return { ok: false, code: 'BRIDGE_ERROR' };
  }
}

export async function reverseDeliveryPlatformFeeEcosystemCommission(input: {
  sourceTransactionId: string;
  reversalEventId: string;
  reason?: string;
}): Promise<{ ok: boolean; duplicate?: boolean; code?: string }> {
  try {
    const creds = await growthInternalBase();
    if (!creds) return { ok: false, code: 'NO_SECRET' };

    const reverseOf = `ecosystem:delivery:fee:${input.sourceTransactionId}`;
    const res = await fetch(`${creds.base}/api/internal/ecosystem/affiliate/commission`, {
      method: 'POST',
      headers: internalHeaders(creds.secret),
      body: JSON.stringify({
        action: 'REVERSE',
        referredCentralUserId: 'n/a',
        sourceTransactionId: input.sourceTransactionId,
        reverseOfIdempotencyKey: reverseOf,
        reversalIdempotencyKey: `ecosystem:delivery:fee:rev:${input.reversalEventId}`,
        reason: input.reason ?? 'REFUND',
      }),
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok || body.ok === false) {
      // No original event is fine (legacy path only / no accrual).
      if (body.code === 'ORIGINAL_NOT_FOUND') return { ok: true, duplicate: false, code: 'ORIGINAL_NOT_FOUND' };
      return { ok: false, code: String(body.code || res.status) };
    }
    return { ok: true, duplicate: Boolean(body.duplicate) };
  } catch (e) {
    console.error('[ecosystem-delivery-commission-reverse]', e);
    return { ok: false, code: 'BRIDGE_ERROR' };
  }
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
      headers: internalHeaders(creds.secret),
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
      headers: internalHeaders(creds.secret),
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
