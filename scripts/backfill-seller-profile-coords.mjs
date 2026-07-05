#!/usr/bin/env node
/**
 * Backfill SellerProfile.lat/lng from User.lat/lng where the seller profile is empty
 * but the user has valid coordinates.
 *
 * NOT run automatically — requires explicit confirmation:
 *   CONFIRM_BACKFILL=1 npx tsx scripts/backfill-seller-profile-coords.mjs
 *
 * Dry-run (default): reports counts only.
 * Apply: CONFIRM_BACKFILL=1 npx tsx scripts/backfill-seller-profile-coords.mjs --apply
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');
const confirmed = process.env.CONFIRM_BACKFILL === '1';

async function main() {
  const candidates = await prisma.sellerProfile.findMany({
    where: {
      OR: [{ lat: null }, { lng: null }],
      User: {
        lat: { not: null },
        lng: { not: null },
      },
    },
    select: {
      id: true,
      lat: true,
      lng: true,
      User: { select: { lat: true, lng: true, email: true } },
    },
  });

  const updatable = candidates.filter(
    (s) =>
      s.User?.lat != null &&
      s.User?.lng != null &&
      Number.isFinite(s.User.lat) &&
      Number.isFinite(s.User.lng)
  );

  const pickupCandidates = await prisma.sellerProfile.findMany({
    where: {
      OR: [{ lat: null }, { lng: null }],
      products: {
        some: {
          isActive: true,
          pickupLat: { not: null },
          pickupLng: { not: null },
        },
      },
    },
    select: {
      id: true,
      lat: true,
      lng: true,
      products: {
        where: {
          isActive: true,
          pickupLat: { not: null },
          pickupLng: { not: null },
        },
        select: { pickupLat: true, pickupLng: true },
        take: 1,
        orderBy: { updatedAt: 'desc' },
      },
    },
  });

  const pickupUpdatable = pickupCandidates.filter(
    (s) =>
      (s.lat == null || s.lng == null) &&
      s.products[0]?.pickupLat != null &&
      s.products[0]?.pickupLng != null &&
      Number.isFinite(s.products[0].pickupLat) &&
      Number.isFinite(s.products[0].pickupLng)
  );

  console.log(
    `[backfill-seller-profile-coords] ${updatable.length} seller profile(s) can copy User coords`
  );
  console.log(
    `[backfill-seller-profile-coords] ${pickupUpdatable.length} seller profile(s) can copy Product pickup coords`
  );

  if (!apply) {
    console.log('Dry run — pass --apply with CONFIRM_BACKFILL=1 to write.');
    return;
  }

  if (!confirmed) {
    console.error(
      'Refused: set CONFIRM_BACKFILL=1 to apply updates (safety guard).'
    );
    process.exit(1);
  }

  let updated = 0;
  for (const row of updatable) {
    await prisma.sellerProfile.update({
      where: { id: row.id },
      data: {
        lat: row.User.lat,
        lng: row.User.lng,
      },
    });
    updated += 1;
  }

  for (const row of pickupUpdatable) {
    const fresh = await prisma.sellerProfile.findUnique({
      where: { id: row.id },
      select: { lat: true, lng: true },
    });
    if (fresh?.lat != null && fresh?.lng != null) continue;
    const p = row.products[0];
    await prisma.sellerProfile.update({
      where: { id: row.id },
      data: {
        lat: p.pickupLat,
        lng: p.pickupLng,
      },
    });
    updated += 1;
  }

  console.log(`Updated ${updated} seller profile(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
