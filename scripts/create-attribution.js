const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ATTRIBUTION_WINDOW_DAYS = 365; // 12 maanden zoals in affiliate-config

async function main() {
  const userId = process.argv[2];
  const affiliateId = process.argv[3];
  const isBusiness = process.argv[4] === 'true' || process.argv[4] === 'BUSINESS_SIGNUP';

  if (!userId || !affiliateId) {
    console.log('❌ Gebruik: node scripts/create-attribution.js <userId> <affiliateId> [BUSINESS_SIGNUP]');
    console.log('   Voorbeeld: node scripts/create-attribution.js <user-id> <affiliate-id>');
    console.log('   Voor business: node scripts/create-attribution.js <user-id> <affiliate-id> BUSINESS_SIGNUP');
    process.exit(1);
  }

  try {
    console.log('🔍 Controleren gebruiker en affiliate...');
    
    // Check user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      console.log(`❌ Gebruiker met ID ${userId} niet gevonden.`);
      process.exit(1);
    }

    console.log(`✅ Gebruiker gevonden: ${user.name} (${user.email})`);

    // Check affiliate exists and is active
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!affiliate) {
      console.log(`❌ Affiliate met ID ${affiliateId} niet gevonden.`);
      process.exit(1);
    }

    if (affiliate.status !== 'ACTIVE') {
      console.log(`⚠️  Affiliate is niet ACTIVE (status: ${affiliate.status})`);
    }

    console.log(`✅ Affiliate gevonden: ${affiliate.user.name} (${affiliate.user.email})`);

    // Check for self-referral
    if (affiliate.userId === userId) {
      console.log('❌ Zelf-referral niet toegestaan. Gebruiker kan zichzelf niet refereren.');
      process.exit(1);
    }

    // Check for existing active attribution
    const existingAttribution = await prisma.attribution.findFirst({
      where: {
        userId: userId,
        affiliateId: affiliateId,
        endsAt: {
          gt: new Date(), // Still active
        },
      },
    });

    if (existingAttribution) {
      console.log('⚠️  Er bestaat al een actieve attribution voor deze gebruiker en affiliate.');
      console.log(`   Attribution ID: ${existingAttribution.id}`);
      console.log(`   Van: ${existingAttribution.startsAt}`);
      console.log(`   Tot: ${existingAttribution.endsAt}`);
      return;
    }

    // Create attribution
    const now = new Date();
    const endsAt = new Date(now.getTime() + ATTRIBUTION_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const attribution = await prisma.attribution.create({
      data: {
        userId: userId,
        affiliateId: affiliateId,
        type: isBusiness ? 'BUSINESS_SIGNUP' : 'USER_SIGNUP',
        source: 'MANUAL',
        startsAt: now,
        endsAt: endsAt,
      },
    });

    console.log('\n✅ Attribution succesvol aangemaakt!');
    console.log(`   Attribution ID: ${attribution.id}`);
    console.log(`   Type: ${attribution.type}`);
    console.log(`   Source: ${attribution.source}`);
    console.log(`   Van: ${attribution.startsAt}`);
    console.log(`   Tot: ${attribution.endsAt}`);
    console.log(`   Geldig voor ${ATTRIBUTION_WINDOW_DAYS} dagen`);

  } catch (error) {
    console.error('❌ Fout:', error);
    if (error.code === 'P2002') {
      console.log('   Deze attribution bestaat al (unique constraint violation).');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();


