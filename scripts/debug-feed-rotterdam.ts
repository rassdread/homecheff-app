/**
 * Debug feed counts for place=rotterdam — run: npx tsx scripts/debug-feed-rotterdam.ts
 */
import { prisma } from '../lib/prisma';
import { geocodePlaceQuery } from '../lib/global-geocoding';
import {
  productGeoBboxWhere,
  sortFeedItemsLocalFirst,
  FEED_RADIUS_MODE_LOCAL_FIRST,
  normalizeFeedRadiusKm,
} from '../lib/geo/local-discovery';
import { resolveProductCoords } from '../lib/geo/item-location';

async function main() {
  const place = 'rotterdam';
  const radius = 25;
  const geo = await geocodePlaceQuery(place, 'NL');
  console.log('geocode rotterdam:', geo);

  const viewerGeo = geo.lat && geo.lng ? { lat: geo.lat, lng: geo.lng } : null;
  const effectiveRadius = normalizeFeedRadiusKm(radius);

  const totalActive = await prisma.product.count({
    where: { isActive: true, priceCents: { gt: 0 } },
  });
  console.log('total active sale products:', totalActive);

  const withCoords = await prisma.product.count({
    where: {
      isActive: true,
      priceCents: { gt: 0 },
      OR: [
        { AND: [{ pickupLat: { not: null } }, { pickupLng: { not: null } }] },
        { seller: { AND: [{ lat: { not: null } }, { lng: { not: null } }] } },
        {
          seller: {
            User: { AND: [{ lat: { not: null } }, { lng: { not: null } }] },
          },
        },
      ],
    },
  });
  console.log('sale products with any coords:', withCoords);

  if (viewerGeo) {
    const strictBbox = productGeoBboxWhere(viewerGeo, effectiveRadius);
    const afterStrictBbox = await prisma.product.count({
      where: {
        isActive: true,
        priceCents: { gt: 0 },
        ...strictBbox,
      },
    });
    console.log('sale products after STRICT bbox (pickup/profile/user):', afterStrictBbox);
  }

  const products = await prisma.product.findMany({
    where: { isActive: true, priceCents: { gt: 0 } },
    take: 100,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      pickupLat: true,
      pickupLng: true,
      seller: {
        select: {
          lat: true,
          lng: true,
          User: { select: { lat: true, lng: true, place: true, city: true } },
        },
      },
    },
  });

  const transformed = products.map((p) => {
    const coords = resolveProductCoords(p);
    return {
      id: p.id,
      title: p.title?.slice(0, 40),
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      place: p.seller?.User?.place || p.seller?.User?.city,
    };
  });

  const borne = await prisma.product.findFirst({
    where: { title: { contains: 'Kunstschilderijen' } },
    select: {
      pickupLat: true,
      pickupLng: true,
      pickupAddress: true,
      seller: {
        select: {
          lat: true,
          lng: true,
          User: { select: { lat: true, lng: true, place: true, city: true } },
        },
      },
    },
  });
  console.log('Kunstschilderijen raw:', JSON.stringify(borne, null, 2));
  console.log('Kunstschilderijen resolved:', resolveProductCoords(borne));

  if (viewerGeo) {
    const sorted = sortFeedItemsLocalFirst(transformed, {
      viewerGeo,
      radiusKm: effectiveRadius,
      radiusMode: FEED_RADIUS_MODE_LOCAL_FIRST,
      followedSellerUserIds: new Set(),
      extractSellerUserId: () => null,
      extractCoords: (i) =>
        i.lat != null && i.lng != null ? { lat: i.lat, lng: i.lng } : null,
    });
    const withDist = sorted.filter((i) => i.distanceKm != null);
    console.log(
      'after sortFeedItemsLocalFirst (100 sample):',
      sorted.length,
      'with distance:',
      withDist.length
    );
    console.log(
      'sample:',
      sorted.slice(0, 8).map((i) => ({
        title: i.title,
        dist: i.distanceKm,
        place: i.place,
      }))
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
