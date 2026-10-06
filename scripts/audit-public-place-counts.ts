/**
 * Read-only public location exposure counts. Prints numbers only.
 * Run: npx tsx scripts/audit-public-place-counts.ts
 */
import { prisma } from '../lib/prisma';
import { looksLikePreciseAddress, toPublicPlaceLabel } from '../lib/geo/public-place';

function oldTileLabel(pickup: string | null, place: string | null): string | null {
  const address = pickup?.trim();
  if (address) {
    const parts = address.split(',').map((part) => part.trim()).filter(Boolean);
    return parts[parts.length - 1] ?? address;
  }
  const raw = place?.trim();
  if (!raw) return null;
  return raw.split(',')[0]?.trim() || null;
}

function oldDetailLabel(pickup: string | null, place: string | null): string | null {
  const address = pickup?.trim();
  if (address) return address;
  const raw = place?.trim();
  if (!raw) return null;
  return raw.split(',')[0]?.trim() || null;
}

function precise(value: string | null | undefined): boolean {
  return Boolean(value && looksLikePreciseAddress(value));
}

async function main() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      pickupAddress: true,
      pickupLat: true,
      pickupLng: true,
      seller: {
        select: {
          lat: true,
          lng: true,
          User: { select: { place: true, city: true } },
        },
      },
    },
  });

  let tilesBefore = 0;
  let tilesAfter = 0;
  let detailsBefore = 0;
  let detailsAfter = 0;
  let apiBefore = 0;

  for (const row of products) {
    const place = row.seller?.User?.place ?? null;
    const city = row.seller?.User?.city ?? null;
    if (precise(oldTileLabel(row.pickupAddress, place))) tilesBefore += 1;
    const nextTile =
      toPublicPlaceLabel(row.pickupAddress) ||
      toPublicPlaceLabel(city) ||
      toPublicPlaceLabel(place);
    if (precise(nextTile)) tilesAfter += 1;
    if (precise(oldDetailLabel(row.pickupAddress, place))) detailsBefore += 1;
    const nextDetail = toPublicPlaceLabel(row.pickupAddress) || toPublicPlaceLabel(place);
    if (precise(nextDetail)) detailsAfter += 1;
    const hasStoredPrecise = Boolean(
      row.pickupAddress?.trim() ||
        row.pickupLat != null ||
        row.pickupLng != null ||
        row.seller?.lat != null ||
        row.seller?.lng != null,
    );
    if (hasStoredPrecise) apiBefore += 1;
  }

  const users = await prisma.user.findMany({
    where: { place: { not: null } },
    select: { place: true },
  });
  let profilesBefore = 0;
  let profilesAfter = 0;
  for (const user of users) {
    const first = user.place?.split(',')[0]?.trim() ?? '';
    if (precise(first) || precise(user.place)) profilesBefore += 1;
    if (precise(toPublicPlaceLabel(user.place))) profilesAfter += 1;
  }

  console.log(
    JSON.stringify({
      activeProducts: products.length,
      PUBLIC_TILES_WITH_STREET_BEFORE: tilesBefore,
      PUBLIC_TILES_WITH_STREET_AFTER: tilesAfter,
      PUBLIC_DETAILS_WITH_STREET_BEFORE: detailsBefore,
      PUBLIC_DETAILS_WITH_STREET_AFTER: detailsAfter,
      PUBLIC_PROFILES_WITH_STREET_BEFORE: profilesBefore,
      PUBLIC_PROFILES_WITH_STREET_AFTER: profilesAfter,
      PUBLIC_API_STORED_PRECISE_ROWS: apiBefore,
    }),
  );
  await prisma.$disconnect();
}

main().catch(async (error: unknown) => {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'ERR';
  console.error(code);
  await prisma.$disconnect();
  process.exit(1);
});
