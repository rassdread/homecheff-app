/**
 * Non-destructive backfill: copy User.lat/lng → DeliveryProfile.home* when home is null,
 * and preferredRadius ← maxDistance when preferredRadius is null.
 * Never overwrites existing home coordinates or any fee/time fields.
 *
 *   npx tsx scripts/backfill-delivery-profile-canonical.ts --dry-run
 *   npx tsx scripts/backfill-delivery-profile-canonical.ts --apply
 */
import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';

function loadEnv(file: string) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    let v = m[2]!;
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!process.env[m[1]!]) process.env[m[1]!] = v;
  }
}
loadEnv('.env');
loadEnv('.env.local');

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');

async function main() {
  const rows = await prisma.deliveryProfile.findMany({
    select: {
      id: true,
      userId: true,
      homeLat: true,
      homeLng: true,
      homeAddress: true,
      preferredRadius: true,
      maxDistance: true,
      user: { select: { lat: true, lng: true, place: true, address: true } },
    },
  });

  let homeBackfill = 0;
  let radiusBackfill = 0;

  for (const row of rows) {
    const data: {
      homeLat?: number;
      homeLng?: number;
      homeAddress?: string | null;
      preferredRadius?: number;
    } = {};

    if (
      (row.homeLat == null || row.homeLng == null) &&
      row.user.lat != null &&
      row.user.lng != null
    ) {
      data.homeLat = row.user.lat;
      data.homeLng = row.user.lng;
      data.homeAddress =
        row.homeAddress || row.user.place || row.user.address || null;
      homeBackfill += 1;
    }

    if (row.preferredRadius == null && typeof row.maxDistance === 'number') {
      data.preferredRadius = row.maxDistance;
      radiusBackfill += 1;
    }

    if (Object.keys(data).length === 0) continue;
    if (!apply) continue;

    await prisma.deliveryProfile.update({
      where: { id: row.id },
      data,
    });
  }

  console.log(
    JSON.stringify(
      {
        apply,
        candidatesHomeBackfill: homeBackfill,
        candidatesRadiusBackfill: radiusBackfill,
        pricesTouched: 0,
        timesTouched: 0,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
