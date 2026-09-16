/**
 * Read-only production scan: delivery age SoT vs stale feed requirement.
 * Does not write DOB, does not log civil dates.
 *
 *   npx tsx scripts/scan-delivery-age-requirement.ts
 */
import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { calculateAgeFromDob, resolveDeliveryAgeStatus } from '../lib/delivery/delivery-age';
import { getDeliveryProfileCompletionFromRow } from '../lib/delivery/delivery-profile-completion';

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
      age: true,
      isActive: true,
      isOnline: true,
      homeLat: true,
      homeLng: true,
      maxDistance: true,
      nationalCoverage: true,
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
      isVerified: true,
      user: {
        select: {
          id: true,
          lat: true,
          lng: true,
          place: true,
          dateOfBirth: true,
        },
      },
    },
  });

  const sampleA: { userId: string; deliveryProfileId: string }[] = [];
  const totals = {
    deliveryProfiles: rows.length,
    A_verified18PlusWouldSeeStaleAgeBanner: 0,
    B_verifiedUnder18TreatedAsMissingDob: 0,
    C_dobUnknown: 0,
    D_conflictingAgeSources: 0,
    D_staleSnapshotSameSideOf18: 0,
    verified18Plus: 0,
    under18: 0,
    unknown: 0,
    ageConfirmationAfterFix: 0,
    under18AfterFix: 0,
  };

  for (const row of rows) {
    const dob = row.user?.dateOfBirth ?? null;
    const canonical = resolveDeliveryAgeStatus({ dateOfBirth: dob });
    if (canonical.status === 'VERIFIED_18_PLUS') totals.verified18Plus += 1;
    if (canonical.status === 'UNDER_18') totals.under18 += 1;
    if (canonical.status === 'UNKNOWN') totals.unknown += 1;

    const stale = getDeliveryProfileCompletionFromRow(row, {
      lat: row.user?.lat,
      lng: row.user?.lng,
      place: row.user?.place,
      dateOfBirth: null,
    });
    const fixed = getDeliveryProfileCompletionFromRow(row, {
      lat: row.user?.lat,
      lng: row.user?.lng,
      place: row.user?.place,
      dateOfBirth: dob,
    });

    const staleMissingDob = !stale.ok && stale.missing.includes('dateOfBirth');
    const fixedMissingDob = !fixed.ok && fixed.missing.includes('dateOfBirth');
    const fixedUnder18 = !fixed.ok && fixed.missing.includes('under18');

    if (canonical.status === 'VERIFIED_18_PLUS' && staleMissingDob) {
      totals.A_verified18PlusWouldSeeStaleAgeBanner += 1;
      if (sampleA.length < 1 && row.user?.id) {
        sampleA.push({ userId: row.user.id, deliveryProfileId: row.id });
      }
    }
    if (canonical.status === 'UNDER_18' && staleMissingDob) {
      totals.B_verifiedUnder18TreatedAsMissingDob += 1;
    }
    if (canonical.status === 'UNKNOWN') {
      totals.C_dobUnknown += 1;
    }
    if (fixedMissingDob) totals.ageConfirmationAfterFix += 1;
    if (fixedUnder18) totals.under18AfterFix += 1;

    const fromDob = calculateAgeFromDob(dob);
    if (
      fromDob.ok &&
      typeof row.age === 'number' &&
      Number.isFinite(row.age)
    ) {
      const dobAdult = fromDob.ageYears >= 18;
      const profileAdult = row.age >= 18;
      if (dobAdult !== profileAdult) {
        totals.D_conflictingAgeSources += 1;
      } else if (Math.abs(fromDob.ageYears - row.age) >= 2) {
        totals.D_staleSnapshotSameSideOf18 += 1;
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        scanned: totals.deliveryProfiles,
        canonical: {
          VERIFIED_18_PLUS: totals.verified18Plus,
          UNDER_18: totals.under18,
          UNKNOWN: totals.unknown,
        },
        staleFeedBug: {
          A_verified18PlusWouldSeeAgeBanner: totals.A_verified18PlusWouldSeeStaleAgeBanner,
          B_under18TreatedAsMissingDob: totals.B_verifiedUnder18TreatedAsMissingDob,
          C_dobReallyUnknown: totals.C_dobUnknown,
          D_profileAgeVsDobAdultConflict: totals.D_conflictingAgeSources,
          D_staleSnapshotSameSideOf18: totals.D_staleSnapshotSameSideOf18,
        },
        afterFix: {
          ageConfirmationRequirement: totals.ageConfirmationAfterFix,
          under18Gate: totals.under18AfterFix,
        },
        dobNeverLogged: true,
        reproSample: sampleA[0]
          ? {
              USER_ID: sampleA[0].userId,
              DELIVERY_PROFILE_ID: sampleA[0].deliveryProfileId,
              CURRENT_AGE_STATUS: 'VERIFIED_18_PLUS',
              AGE_SOURCE: 'USER_DATE_OF_BIRTH',
              DOB_PRESENT: true,
              AGE_VERIFIED: true,
              AGE_REQUIREMENT_GENERATED_BEFORE: true,
              AGE_REQUIREMENT_GENERATED_AFTER: false,
            }
          : null,
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
