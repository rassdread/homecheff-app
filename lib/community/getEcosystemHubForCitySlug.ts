import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { LOCAL_SEO_CITIES } from '@/lib/seo/localCities';
import { bboxFromCenter } from '@/lib/community/geoDistance';

export type EcosystemHubPayload = {
  citySlug: string;
  cityLabel: string;
  radiusKm: number;
  generatedAt: string;
  activeCreatorsWeek: number;
  newListingsWeek: number;
  newInspirationWeek: number;
  risingLocalUsername: string | null;
  risingLocalListingCount: number;
  localHcpLeaderUsername: string | null;
  localHcpLeaderTotal: number | null;
  /** True when bbox had too little seller geo signal (honest UX hint). */
  sparseGeoSignal: boolean;
};

const HUB_RADIUS_KM = 32;

function displayUsername(username: string | null | undefined, name: string | null | undefined): string | null {
  const u = username?.trim();
  if (u) return u;
  const n = name?.trim()?.split(/\s+/)?.[0];
  return n || null;
}

export async function getEcosystemHubForCitySlug(citySlug: string): Promise<EcosystemHubPayload | null> {
  const city = LOCAL_SEO_CITIES.find((c) => c.slug === citySlug);
  if (!city || city.lat == null || city.lng == null) return null;

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const bbox = bboxFromCenter(city.lat, city.lng, HUB_RADIUS_KM);

  const sellerInBbox: Prisma.SellerProfileWhereInput = {
    lat: { gte: bbox.latMin, lte: bbox.latMax },
    lng: { gte: bbox.lngMin, lte: bbox.lngMax },
  };

  const [productRows, dishRows, recipeWeek, risingGroup, sparseProbe] = await Promise.all([
    prisma.product.findMany({
      where: {
        isActive: true,
        createdAt: { gte: weekAgo },
        seller: sellerInBbox,
      },
      select: { seller: { select: { userId: true } } },
      take: 400,
    }),
    prisma.dish.findMany({
      where: {
        status: 'PUBLISHED',
        createdAt: { gte: weekAgo },
        lat: { gte: bbox.latMin, lte: bbox.latMax },
        lng: { gte: bbox.lngMin, lte: bbox.lngMax },
      },
      select: { userId: true },
      take: 400,
    }),
    prisma.recipe.count({
      where: {
        createdAt: { gte: weekAgo },
        workspaceContent: {
          isPublic: true,
          sellerProfile: sellerInBbox,
        },
      },
    }),
    prisma.product
      .groupBy({
        by: ['sellerId'],
        where: {
          isActive: true,
          createdAt: { gte: weekAgo },
          seller: sellerInBbox,
        },
        _count: { sellerId: true },
        orderBy: { _count: { sellerId: 'desc' } },
        take: 1,
      })
      .catch(() => [] as { sellerId: string; _count: { sellerId: number } }[]),
    prisma.sellerProfile.count({
      where: {
        lat: { gte: bbox.latMin, lte: bbox.latMax },
        lng: { gte: bbox.lngMin, lte: bbox.lngMax },
      },
    }),
  ]);

  const creatorIds = new Set<string>();
  for (const p of productRows) {
    const id = p.seller?.userId;
    if (id) creatorIds.add(id);
  }
  for (const d of dishRows) {
    if (d.userId) creatorIds.add(d.userId);
  }

  const newListingsWeek = productRows.length + dishRows.length;
  const activeCreatorsWeek = creatorIds.size;

  let risingLocalUsername: string | null = null;
  let risingLocalListingCount = 0;
  const topSeller = risingGroup[0];
  if (topSeller?.sellerId) {
    risingLocalListingCount = topSeller._count.sellerId;
    const sp = await prisma.sellerProfile.findUnique({
      where: { id: topSeller.sellerId },
      select: { User: { select: { username: true, name: true } } },
    });
    risingLocalUsername = displayUsername(sp?.User?.username, sp?.User?.name);
  }

  let localHcpLeaderUsername: string | null = null;
  let localHcpLeaderTotal: number | null = null;
  const hcpCandidates = await prisma.userHcpStats.findMany({
    orderBy: { totalHcp: 'desc' },
    take: 40,
    select: {
      totalHcp: true,
      user: {
        select: {
          username: true,
          name: true,
          SellerProfile: { select: { lat: true, lng: true } },
        },
      },
    },
  });
  for (const row of hcpCandidates) {
    const slat = row.user.SellerProfile?.lat;
    const slng = row.user.SellerProfile?.lng;
    if (slat == null || slng == null) continue;
    if (slat < bbox.latMin || slat > bbox.latMax || slng < bbox.lngMin || slng > bbox.lngMax) continue;
    localHcpLeaderUsername = displayUsername(row.user.username, row.user.name);
    localHcpLeaderTotal = row.totalHcp;
    break;
  }

  const sparseGeoSignal = sparseProbe < 8 && activeCreatorsWeek < 3;

  return {
    citySlug: city.slug,
    cityLabel: city.label,
    radiusKm: HUB_RADIUS_KM,
    generatedAt: new Date().toISOString(),
    activeCreatorsWeek,
    newListingsWeek,
    newInspirationWeek: recipeWeek,
    risingLocalUsername,
    risingLocalListingCount,
    localHcpLeaderUsername,
    localHcpLeaderTotal,
    sparseGeoSignal,
  };
}
