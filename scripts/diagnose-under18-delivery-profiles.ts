/**
 * Read-only diagnostic: list commercial DeliveryProfiles that appear under 18.
 * Makes no mutations.
 *
 * Run: npx tsx scripts/diagnose-under18-delivery-profiles.ts
 */
import { prisma } from '../lib/prisma';
import {
  calculateAgeFromDob,
  COMMERCIAL_DELIVERY_MIN_AGE,
} from '../lib/delivery/delivery-age';

async function main() {
  const profiles = await prisma.deliveryProfile.findMany({
    select: {
      id: true,
      userId: true,
      age: true,
      isActive: true,
      isVerified: true,
      user: { select: { dateOfBirth: true } },
    },
  });

  const now = new Date();
  const flagged: Array<{
    profileId: string;
    userId: string;
    profileAge: number;
    dobAge: number | null;
    isActive: boolean;
    reason: string;
  }> = [];

  for (const p of profiles) {
    const dob = p.user?.dateOfBirth;
    const dobAge = calculateAgeFromDob(dob, now);
    const underByDob = dobAge.ok && dobAge.ageYears < COMMERCIAL_DELIVERY_MIN_AGE;
    const underByProfile = p.age < COMMERCIAL_DELIVERY_MIN_AGE;
    const missingDob = !dobAge.ok;

    if (underByDob || underByProfile || missingDob) {
      flagged.push({
        profileId: p.id,
        userId: p.userId,
        profileAge: p.age,
        dobAge: dobAge.ok ? dobAge.ageYears : null,
        isActive: p.isActive,
        reason: underByDob
          ? 'UNDERAGE_DOB'
          : underByProfile
            ? 'UNDERAGE_PROFILE_AGE'
            : 'MISSING_OR_INVALID_DOB',
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        scanned: profiles.length,
        flaggedCount: flagged.length,
        minAge: COMMERCIAL_DELIVERY_MIN_AGE,
        note: 'Read-only. Runtime gates already exclude these from commercial flows.',
        flagged,
      },
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
