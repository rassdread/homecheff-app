/**
 * Inventory (READ-ONLY): place present, no usable coordinates.
 * Does NOT mutate production.
 *
 * Usage: npx tsx scripts/inventory-place-only-geo.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function usable(lat: number | null | undefined, lng: number | null | undefined) {
  if (lat == null || lng == null) return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  return true;
}

async function main() {
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { placeName: { not: null } },
        { pickupAddress: { not: null } },
      ],
    },
    select: {
      id: true,
      title: true,
      placeName: true,
      pickupAddress: true,
      pickupLat: true,
      pickupLng: true,
      isActive: true,
    },
    take: 500,
  });

  const dishes = await prisma.dish.findMany({
    where: { place: { not: null } },
    select: {
      id: true,
      title: true,
      place: true,
      lat: true,
      lng: true,
      status: true,
    },
    take: 500,
  });

  const productOnly = products.filter(
    (p) =>
      (p.placeName || p.pickupAddress) &&
      !usable(p.pickupLat, p.pickupLng),
  );
  const dishOnly = dishes.filter(
    (d) => d.place && !usable(d.lat, d.lng),
  );

  console.log(
    JSON.stringify(
      {
        productPlaceOnlyCount: productOnly.length,
        dishPlaceOnlyCount: dishOnly.length,
        products: productOnly.map((p) => ({
          id: p.id,
          title: p.title,
          place: p.placeName || p.pickupAddress,
          active: p.isActive,
        })),
        dishes: dishOnly.map((d) => ({
          id: d.id,
          title: d.title,
          place: d.place,
          status: d.status,
        })),
        note: 'Known ambiguous: Sint Maarten dishes — do not auto-guess',
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
