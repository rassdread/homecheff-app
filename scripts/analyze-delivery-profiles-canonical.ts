/**
 * Read-only analysis of DeliveryProfile completeness vs canonical rules.
 * Does not mutate prices, times, or reset profiles.
 *
 *   npx tsx scripts/analyze-delivery-profiles-canonical.ts
 */
import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { getDeliveryProfileCompletionFromRow } from '../lib/delivery/delivery-profile-completion';
import { resolveCanonicalServiceCoords } from '../lib/delivery/delivery-profile-canonical';

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

async function main() {
  const rows = await prisma.deliveryProfile.findMany({
    select: {
      id: true,
      userId: true,
      isActive: true,
      isOnline: true,
      isVerified: true,
      homeLat: true,
      homeLng: true,
      homeAddress: true,
      maxDistance: true,
      preferredRadius: true,
      nationalCoverage: true,
      deliveryMode: true,
      availableDays: true,
      availableTimeSlots: true,
      workStartTime: true,
      workEndTime: true,
      pricingEnabled: true,
      baseFeeCents: true,
      pricePerKmCents: true,
      minimumFeeCents: true,
      freeDeliveryRadiusKm: true,
      providerType: true,
      companyDisplayName: true,
      user: { select: { lat: true, lng: true, place: true } },
    },
  });

  let complete = 0;
  let incomplete = 0;
  let legacyMismatched = 0;
  const missingCounts: Record<string, number> = {};
  const mismatchReasons: Record<string, number> = {};

  for (const row of rows) {
    const completion = getDeliveryProfileCompletionFromRow(row, row.user);
    if (completion.isComplete) complete += 1;
    else {
      incomplete += 1;
      if (!completion.ok) {
        for (const m of completion.missing) {
          missingCounts[m] = (missingCounts[m] || 0) + 1;
        }
      }
    }

    const reasons: string[] = [];
    if (
      (row.homeLat == null || row.homeLng == null) &&
      row.user.lat != null &&
      row.user.lng != null
    ) {
      reasons.push('home_missing_user_has_coords');
    }
    if (row.preferredRadius == null && row.maxDistance != null) {
      reasons.push('preferredRadius_null_maxDistance_set');
    }
    if (row.pricingEnabled && (row.baseFeeCents == null || row.pricePerKmCents == null)) {
      reasons.push('pricing_enabled_cents_null');
    }
    if (
      !row.pricingEnabled &&
      row.baseFeeCents != null &&
      row.pricePerKmCents != null &&
      row.minimumFeeCents != null
    ) {
      reasons.push('cents_set_pricing_disabled');
    }
    if (row.deliveryMode === 'STATIC') {
      reasons.push('deliveryMode_STATIC_legacy');
    }
    if (reasons.length > 0) {
      legacyMismatched += 1;
      for (const r of reasons) mismatchReasons[r] = (mismatchReasons[r] || 0) + 1;
    }
  }

  const withUserFallback = rows.filter(
    (r) => resolveCanonicalServiceCoords(r, r.user)?.source === 'user',
  ).length;

  const report = {
    totalDeliveryProfiles: rows.length,
    completeByCanonicalRule: complete,
    incompleteByCanonicalRule: incomplete,
    legacyMismatched,
    withUserCoordFallbackOnly: withUserFallback,
    missingCounts,
    mismatchReasons,
    destructiveReset: false,
  };

  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
