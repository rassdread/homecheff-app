import { prisma } from '@/lib/prisma';
import { resolveGrowthMutationTarget, resolveGrowthServiceTarget } from '@/lib/hc/preview-service-target';

const NO_STORE = { 'Cache-Control': 'private, no-store, max-age=0' } as const;

function ecosystemSecret(): string {
  return (
    process.env.HC_ECOSYSTEM_INTERNAL_SECRET ??
    process.env.HC_MARKETPLACE_QUOTE_INTERNAL_SECRET ??
    ''
  ).trim();
}

export async function resolveCentralUserId(localUserId: string): Promise<string | null> {
  const link = await prisma.authIdentityLink.findFirst({
    where: { sourceSystem: 'homecheff', sourceUserId: localUserId, status: 'linked' },
    select: { centralUserId: true },
  });
  return link?.centralUserId ?? localUserId;
}

export async function qualifyListingOnGrowth(input: {
  centralUserId: string;
  promoCode: string;
  stripeConnectVerified: boolean;
}): Promise<{ ok: boolean; pending?: boolean; code?: string; message?: string }> {
  const target = resolveGrowthMutationTarget();
  const secret = ecosystemSecret();
  if (!target.ok) return { ok: false, code: 'CONFIGURATION_ERROR' };
  if (!secret || !input.centralUserId || !input.promoCode) {
    return { ok: false, code: 'GROWTH_UNAVAILABLE' };
  }
  const res = await fetch(`${target.base}/api/internal/ecosystem/hc/qualify-listing`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'x-central-user-id': input.centralUserId,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...NO_STORE,
    },
    body: JSON.stringify({
      promoCode: input.promoCode,
      stripeConnectVerified: input.stripeConnectVerified === true,
    }),
    cache: 'no-store',
  }).catch(() => null);
  if (!res) return { ok: false, code: 'GROWTH_UNAVAILABLE' };
  const json = (await res.json().catch(() => null)) as {
    ok?: boolean;
    pending?: boolean;
    code?: string;
    message?: string;
  } | null;
  if (!json) return { ok: false, code: 'GROWTH_UNAVAILABLE' };
  return { ok: json.ok === true, pending: json.pending === true, code: json.code, message: json.message };
}

export type PublicCampaignOffer = {
  visible: boolean;
  name?: string;
  hcAmount?: number;
  requireStripeConnect?: boolean;
  marketplaceSpendable?: boolean;
  marketplaceEligible?: boolean;
  studioEligible?: boolean;
  growthEligible?: boolean;
  reason?: string;
};

export async function describeCampaignOnGrowth(code: string): Promise<PublicCampaignOffer> {
  const target = resolveGrowthServiceTarget();
  const secret = ecosystemSecret();
  if (!target.ok) return { visible: false, reason: 'CONFIGURATION_ERROR' };
  if (!secret || !code) return { visible: false, reason: 'UNAVAILABLE' };
  const res = await fetch(`${target.base}/api/internal/ecosystem/hc/campaign-public`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ code }),
    cache: 'no-store',
  });
  if (!res.ok) return { visible: false, reason: 'UNAVAILABLE' };
  const json = (await res.json()) as PublicCampaignOffer;
  return { ...json, visible: json.visible === true };
}
