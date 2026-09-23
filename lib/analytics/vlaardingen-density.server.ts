import { prisma } from '@/lib/prisma';
import { bboxFromCenter } from '@/lib/community/geoDistance';
import { LOCAL_SEO_CITIES } from '@/lib/seo/localCities';
import { getEcosystemHubForCitySlug } from '@/lib/community/getEcosystemHubForCitySlug';
import { shouldIndexCityHub } from '@/lib/seo/city-indexability';

const CONFIRMED = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const;
const COMPLETED = ['DELIVERED'] as const;

export type DensityMetric = {
  id: string;
  label: string;
  available: boolean;
  reason?: string;
  last7: number | null;
  previous7: number | null;
  last30: number | null;
  previous30: number | null;
};

export type VlaardingenDensityReport = {
  generatedAt: string;
  radiusKm: number;
  indexable: boolean;
  indexReason: string;
  activeMakers: number | null;
  activeListings: number | null;
  categoriesWithSupply: Array<{ category: string; listings: number }>;
  metrics: DensityMetric[];
};

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function windowCount(dates: Date[], start: Date, end: Date): number {
  return dates.filter((d) => d >= start && d < end).length;
}

export async function getVlaardingenDensityReport(): Promise<VlaardingenDensityReport> {
  const city = LOCAL_SEO_CITIES.find((c) => c.slug === 'vlaardingen');
  if (!city) {
    throw new Error('Vlaardingen is missing from LOCAL_SEO_CITIES');
  }
  const radiusKm = 32;
  const bbox = bboxFromCenter(city.lat, city.lng, radiusKm);
  const sellerInBbox = {
    lat: { gte: bbox.latMin, lte: bbox.latMax },
    lng: { gte: bbox.lngMin, lte: bbox.lngMax },
  };
  const now = new Date();
  const d7 = daysAgo(7);
  const d14 = daysAgo(14);
  const d30 = daysAgo(30);
  const d60 = daysAgo(60);

  const hub = await getEcosystemHubForCitySlug('vlaardingen');
  const indexable = shouldIndexCityHub(hub);
  const indexReason = !hub
    ? 'Geen hubdata.'
    : hub.sparseGeoSignal
      ? 'Te weinig geo-signaal in de straal. Hub blijft noindex.'
      : hub.activeCreatorsWeek < 3
        ? `Actieve makers in 7 dagen: ${hub.activeCreatorsWeek}. Drempel is 3.`
        : hub.newListingsWeek + hub.newInspirationWeek < 8
          ? `Nieuwe activiteit in 7 dagen: ${hub.newListingsWeek + hub.newInspirationWeek}. Drempel is 8.`
          : 'Drempel gehaald.';

  const [activeListings, makerGroups, categoryGroups, orders, proposals, affiliates, attributions] =
    await Promise.all([
      prisma.product.count({
        where: { isActive: true, seller: sellerInBbox },
      }),
      prisma.product.groupBy({
        by: ['sellerId'],
        where: { isActive: true, seller: sellerInBbox },
      }),
      prisma.product.groupBy({
        by: ['category'],
        where: { isActive: true, seller: sellerInBbox },
        _count: { _all: true },
      }),
      prisma.order.findMany({
        where: {
          status: { in: [...CONFIRMED] },
          OR: [{ totalAmount: { gt: 0 } }, { hcCapturedHc: { gt: 0 } }],
          items: { some: { Product: { seller: sellerInBbox } } },
          createdAt: { gte: d60 },
        },
        select: { id: true, userId: true, status: true, createdAt: true },
      }),
      prisma.proposal.findMany({
        where: {
          createdAt: { gte: d60 },
          Product: { seller: sellerInBbox },
        },
        select: { id: true, createdAt: true, requestedDate: true, category: true },
      }),
      prisma.affiliate.findMany({
        where: {
          status: 'ACTIVE',
          user: {
            OR: [
              { place: { contains: 'Vlaardingen', mode: 'insensitive' } },
              {
                lat: { gte: bbox.latMin, lte: bbox.latMax },
                lng: { gte: bbox.lngMin, lte: bbox.lngMax },
              },
            ],
          },
        },
        select: { id: true, createdAt: true },
      }),
      prisma.attribution.findMany({
        where: {
          createdAt: { gte: d60 },
          affiliate: {
            user: {
              OR: [
                { place: { contains: 'Vlaardingen', mode: 'insensitive' } },
                {
                  lat: { gte: bbox.latMin, lte: bbox.latMax },
                  lng: { gte: bbox.lngMin, lte: bbox.lngMax },
                },
              ],
            },
          },
        },
        select: { id: true, createdAt: true },
      }),
    ]);

  const orderDates = orders.map((o) => o.createdAt);
  const completedDates = orders
    .filter((o) => COMPLETED.includes(o.status as (typeof COMPLETED)[number]))
    .map((o) => o.createdAt);
  const proposalDates = proposals.map((p) => p.createdAt);
  const appointmentDates = proposals
    .filter((p) => p.requestedDate != null)
    .map((p) => p.createdAt);
  const affiliateDates = affiliates.map((a) => a.createdAt);
  const attributionDates = attributions.map((a) => a.createdAt);

  const repeatByWindow = (start: Date, end: Date) => {
    const counts = new Map<string, number>();
    for (const order of orders) {
      if (order.createdAt < start || order.createdAt >= end) continue;
      counts.set(order.userId, (counts.get(order.userId) ?? 0) + 1);
    }
    let repeatBuyers = 0;
    for (const n of counts.values()) if (n > 1) repeatBuyers += 1;
    return repeatBuyers;
  };

  const metric = (
    id: string,
    label: string,
    dates: Date[],
    mode: 'events' | 'repeat' = 'events',
  ): DensityMetric => ({
    id,
    label,
    available: true,
    last7: mode === 'repeat' ? repeatByWindow(d7, now) : windowCount(dates, d7, now),
    previous7: mode === 'repeat' ? repeatByWindow(d14, d7) : windowCount(dates, d14, d7),
    last30: mode === 'repeat' ? repeatByWindow(d30, now) : windowCount(dates, d30, now),
    previous30: mode === 'repeat' ? repeatByWindow(d60, d30) : windowCount(dates, d60, d30),
  });

  const unavailable = (id: string, label: string, reason: string): DensityMetric => ({
    id,
    label,
    available: false,
    reason,
    last7: null,
    previous7: null,
    last30: null,
    previous30: null,
  });

  return {
    generatedAt: now.toISOString(),
    radiusKm,
    indexable,
    indexReason,
    activeMakers: makerGroups.length,
    activeListings,
    categoriesWithSupply: categoryGroups
      .map((row) => ({ category: String(row.category), listings: row._count._all }))
      .sort((a, b) => b.listings - a.listings),
    metrics: [
      metric('orders', 'Bestellingen met betaling of vastgelegde HC', orderDates),
      metric('completed', 'Afgeleverde bestellingen', completedDates),
      metric('repeat', 'Kopers met meer dan één bestelling in het venster', orderDates, 'repeat'),
      metric('enquiries', 'Voorstellen op aanbod in de straal', proposalDates),
      metric('appointments', 'Voorstellen met een gevraagde datum', appointmentDates),
      metric('affiliates', 'Nieuwe actieve affiliates in Vlaardingen', affiliateDates),
      metric('referrals', 'Attributies van die affiliates', attributionDates),
      unavailable(
        'listing_views',
        'Listingweergaven',
        'Niet beschikbaar. Oudere VIEW-rijen bevatten synthetische starts bij het aanmaken van een listing.',
      ),
      unavailable(
        'buyers_living_here',
        'Kopers die in Vlaardingen wonen',
        'Niet beschikbaar. Alleen kopers van aanbod in de straal zijn betrouwbaar, en die staan bij bestellingen.',
      ),
    ],
  };
}
