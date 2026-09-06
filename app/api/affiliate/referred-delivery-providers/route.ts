import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
const NO_STORE = { 'Cache-Control': 'private, no-store, max-age=0' } as const;

async function resolveCentralUserId(localUserId: string): Promise<string> {
  const link = await prisma.authIdentityLink.findFirst({
    where: { sourceSystem: 'homecheff', sourceUserId: localUserId, status: 'linked' },
    select: { centralUserId: true },
  });
  return link?.centralUserId ?? localUserId;
}

function growthBase() {
  return (
    process.env.GROWTH_HC_QUOTE_BASE_URL ??
    process.env.GROWTH_API_BASE_URL ??
    'https://growth.homecheff.eu'
  ).replace(/\/$/, '');
}

function growthSecret() {
  return (
    process.env.HC_ECOSYSTEM_INTERNAL_SECRET?.trim() ||
    process.env.HC_MARKETPLACE_QUOTE_INTERNAL_SECRET?.trim() ||
    process.env.STUDIO_HC_INTERNAL_SECRET?.trim() ||
    process.env.HC_INTERNAL_PROBE_SECRET?.trim() ||
    ''
  );
}

export type ReferredDeliveryStatus =
  | 'AANGEMELD'
  | 'ONBOARDING'
  | 'ACTIEF'
  | 'EERSTE_BEZORGING'
  | 'INKOMSTEN_GEGENEREERD';

/**
 * Affiliate "Aangebrachte bezorgers" — Growth attribution intent + local DeliveryProfile enrich.
 * Privacy: display name only (no address/phone/KYC).
 */
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401, headers: NO_STORE });
    }
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ ok: false, code: 'USER_NOT_FOUND' }, { status: 404, headers: NO_STORE });
    }

    // Must be an affiliate (or company member via Growth) — block unrelated users.
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: user.id },
      select: { id: true, status: true },
    });

    const centralUserId = await resolveCentralUserId(user.id);
    const url = new URL(req.url);
    const organizationId = url.searchParams.get('organizationId')?.trim() || '';
    const filter = url.searchParams.get('filter')?.trim() || 'ALL';
    const secret = growthSecret();
    if (!secret) {
      return NextResponse.json(
        { ok: false, degraded: true, code: 'GROWTH_SECRET_MISSING' },
        { status: 200, headers: NO_STORE },
      );
    }

    const qs = new URLSearchParams();
    if (organizationId) qs.set('organizationId', organizationId);
    if (filter) qs.set('filter', filter);
    const growthUrl = `${growthBase()}/api/ecosystem/affiliate/referred-delivery?${qs.toString()}`;
    const res = await fetch(growthUrl, {
      headers: {
        Authorization: `Bearer ${secret}`,
        'x-studio-hc-internal-secret': secret,
        'x-hc-ecosystem-internal-secret': secret,
        'x-ecosystem-affiliate-central-user-id': centralUserId,
        'x-central-user-id': centralUserId,
      },
      cache: 'no-store',
    });
    const json = (await res.json().catch(() => null)) as {
      ok?: boolean;
      code?: string;
      classificationRule?: string;
      scope?: string;
      providers?: Array<{
        attributionId: string;
        referredCentralUserId: string;
        deliveryIntent: string;
        deliveryRelated: boolean;
        referredAt: string;
        sourceCampaign: string | null;
        campaignId: string | null;
        marketerUserId: string | null;
        organizationId: string | null;
        eligibleAffiliateEarningsCents: number;
        firstEligibleDeliveryCommissionAt: string | null;
        firstLandingUrl: string | null;
        attributionStatus: string;
      }>;
    } | null;

    if (!res.ok || !json?.ok) {
      if (!affiliate && res.status === 403) {
        return NextResponse.json({ ok: false, code: 'FORBIDDEN' }, { status: 403, headers: NO_STORE });
      }
      return NextResponse.json(
        {
          ok: false,
          degraded: true,
          code: json?.code ?? 'GROWTH_REFERRED_DELIVERY_FAILED',
          upstreamStatus: res.status,
        },
        { status: 200, headers: NO_STORE },
      );
    }

    const providers = json.providers ?? [];
    const referredIds = [...new Set(providers.map((p) => p.referredCentralUserId))];

    // Resolve MP users by id == central OR authIdentityLink
    const usersById = await prisma.user.findMany({
      where: { id: { in: referredIds } },
      select: { id: true, name: true, username: true },
    });
    const links = await prisma.authIdentityLink.findMany({
      where: {
        centralUserId: { in: referredIds },
        sourceSystem: 'homecheff',
        status: 'linked',
      },
      select: { centralUserId: true, sourceUserId: true },
    });
    const linkUserIds = links.map((l) => l.sourceUserId);
    const linkedUsers =
      linkUserIds.length === 0
        ? []
        : await prisma.user.findMany({
            where: { id: { in: linkUserIds } },
            select: { id: true, name: true, username: true },
          });

    const centralToMpUser = new Map<string, { id: string; name: string | null; username: string | null }>();
    for (const u of usersById) centralToMpUser.set(u.id, u);
    for (const l of links) {
      const u = linkedUsers.find((x) => x.id === l.sourceUserId);
      if (u) centralToMpUser.set(l.centralUserId, u);
    }

    const mpUserIds = [...new Set([...centralToMpUser.values()].map((u) => u.id))];
    const profiles =
      mpUserIds.length === 0
        ? []
        : await prisma.deliveryProfile.findMany({
            where: { userId: { in: mpUserIds } },
            select: {
              id: true,
              userId: true,
              providerType: true,
              isActive: true,
              isVerified: true,
              companyDisplayName: true,
              createdAt: true,
            },
          });
    const profileByUserId = new Map(profiles.map((p) => [p.userId, p]));

    // First completed delivery proxy via DeliveryOrder
    const profileIds = profiles.map((p) => p.id);
    const firstCompleted =
      profileIds.length === 0
        ? []
        : await prisma.deliveryOrder
            .findMany({
              where: {
                deliveryProfileId: { in: profileIds },
                OR: [
                  { deliveredAt: { not: null } },
                  { status: { in: ['COMPLETED', 'DELIVERED', 'delivered', 'completed'] } },
                ],
              },
              select: { deliveryProfileId: true, updatedAt: true, createdAt: true },
              orderBy: { updatedAt: 'asc' },
              take: 500,
            })
            .catch(() => [] as Array<{ deliveryProfileId: string; updatedAt: Date; createdAt: Date }>);

    const firstJobByProfile = new Map<string, string>();
    for (const j of firstCompleted) {
      if (!firstJobByProfile.has(j.deliveryProfileId)) {
        firstJobByProfile.set(j.deliveryProfileId, j.updatedAt.toISOString());
      }
    }

    const enriched = providers
      .map((p) => {
        const mpUser = centralToMpUser.get(p.referredCentralUserId);
        const profile = mpUser ? profileByUserId.get(mpUser.id) : undefined;
        // Classification: Growth already filtered intent OR commission; also keep if profile exists
        if (!p.deliveryRelated && !profile) return null;

        let status: ReferredDeliveryStatus = 'AANGEMELD';
        if (profile) {
          status = profile.isActive ? 'ACTIEF' : 'ONBOARDING';
        }
        const firstDeliveryAt = profile ? firstJobByProfile.get(profile.id) ?? null : null;
        if (firstDeliveryAt) status = 'EERSTE_BEZORGING';
        if (p.eligibleAffiliateEarningsCents > 0) status = 'INKOMSTEN_GEGENEREERD';

        if (filter === 'ONBOARDING' && status !== 'ONBOARDING' && status !== 'AANGEMELD') {
          return null;
        }
        if (filter === 'ACTIEF' && status !== 'ACTIEF' && status !== 'EERSTE_BEZORGING' && status !== 'INKOMSTEN_GEGENEREERD') {
          return null;
        }
        if (filter === 'EERSTE_ACTIVITEIT' && !firstDeliveryAt && !p.firstEligibleDeliveryCommissionAt) {
          return null;
        }
        if (filter === 'BEZORGBEDRIJF' && profile?.providerType !== 'DELIVERY_BUSINESS' && p.deliveryIntent !== 'COMPANY') {
          return null;
        }
        if (filter === 'INDIVIDUEEL' && (profile?.providerType === 'DELIVERY_BUSINESS' || p.deliveryIntent === 'COMPANY')) {
          return null;
        }

        const displayName =
          profile?.providerType === 'DELIVERY_BUSINESS' && profile.companyDisplayName
            ? profile.companyDisplayName
            : mpUser?.name || mpUser?.username || `Bezorger ${p.referredCentralUserId.slice(0, 8)}`;

        return {
          attributionId: p.attributionId,
          referredCentralUserId: p.referredCentralUserId,
          displayName,
          providerType:
            profile?.providerType === 'DELIVERY_BUSINESS'
              ? 'DELIVERY_BUSINESS'
              : p.deliveryIntent === 'COMPANY'
                ? 'DELIVERY_BUSINESS'
                : 'INDEPENDENT',
          providerTypeLabel:
            profile?.providerType === 'DELIVERY_BUSINESS' || p.deliveryIntent === 'COMPANY'
              ? 'Bezorgbedrijf'
              : 'Individuele bezorger',
          status,
          referredAt: p.referredAt,
          sourceCampaign: p.sourceCampaign,
          campaignId: p.campaignId,
          marketerUserId: p.marketerUserId,
          organizationId: p.organizationId,
          deliveryProfileId: profile?.id ?? null,
          isActive: profile?.isActive ?? false,
          firstDeliveryAt,
          eligibleAffiliateEarningsCents: p.eligibleAffiliateEarningsCents,
          firstEligibleDeliveryCommissionAt: p.firstEligibleDeliveryCommissionAt,
        };
      })
      .filter(Boolean);

    // Also include local DeliveryProfiles for MP attributions where Growth missed intent
    // (personal ?ref= signup without delivery path in sourceCampaign) — only if affiliate owns Attribution
    if (affiliate && !organizationId) {
      const localAttrs = await prisma.attribution.findMany({
        where: { affiliateId: affiliate.id },
        select: { userId: true, createdAt: true, id: true },
        take: 200,
        orderBy: { createdAt: 'desc' },
      });
      const already = new Set(enriched.map((e) => e!.referredCentralUserId));
      const localUserIds = localAttrs.map((a) => a.userId).filter((id) => !already.has(id));
      if (localUserIds.length) {
        const localProfiles = await prisma.deliveryProfile.findMany({
          where: { userId: { in: localUserIds } },
          select: {
            id: true,
            userId: true,
            providerType: true,
            isActive: true,
            companyDisplayName: true,
            createdAt: true,
          },
        });
        const localUsers = await prisma.user.findMany({
          where: { id: { in: localProfiles.map((p) => p.userId) } },
          select: { id: true, name: true, username: true },
        });
        for (const profile of localProfiles) {
          const u = localUsers.find((x) => x.id === profile.userId);
          const attr = localAttrs.find((a) => a.userId === profile.userId);
          let status: ReferredDeliveryStatus = profile.isActive ? 'ACTIEF' : 'ONBOARDING';
          enriched.push({
            attributionId: attr?.id ?? `local_${profile.id}`,
            referredCentralUserId: profile.userId,
            displayName:
              profile.providerType === 'DELIVERY_BUSINESS' && profile.companyDisplayName
                ? profile.companyDisplayName
                : u?.name || u?.username || `Bezorger ${profile.userId.slice(0, 8)}`,
            providerType:
              profile.providerType === 'DELIVERY_BUSINESS' ? 'DELIVERY_BUSINESS' : 'INDEPENDENT',
            providerTypeLabel:
              profile.providerType === 'DELIVERY_BUSINESS' ? 'Bezorgbedrijf' : 'Individuele bezorger',
            status,
            referredAt: (attr?.createdAt ?? profile.createdAt).toISOString(),
            sourceCampaign: 'MARKETPLACE_ATTRIBUTION',
            campaignId: null,
            marketerUserId: null,
            organizationId: null,
            deliveryProfileId: profile.id,
            isActive: profile.isActive,
            firstDeliveryAt: null,
            eligibleAffiliateEarningsCents: 0,
            firstEligibleDeliveryCommissionAt: null,
          });
        }
      }
    }

    return NextResponse.json(
      {
        ok: true,
        classificationRule: json.classificationRule,
        scope: json.scope,
        providers: enriched,
      },
      { status: 200, headers: NO_STORE },
    );
  } catch (err) {
    console.warn('[referred-delivery-providers]', err);
    return NextResponse.json(
      { ok: false, degraded: true, code: 'REFERRED_DELIVERY_ERROR' },
      { status: 200, headers: NO_STORE },
    );
  }
}
