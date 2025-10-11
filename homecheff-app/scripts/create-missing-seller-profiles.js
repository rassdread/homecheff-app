// Script om ontbrekende SellerProfiles aan te maken voor users met seller roles
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createMissingSellerProfiles() {
  console.log('🔧 Creating missing SellerProfiles for users with seller roles...\n');

  try {
    // Find users with seller roles but no SellerProfile
    const usersNeedingProfiles = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'SELLER' },
          { sellerRoles: { has: 'chef' } },
          { sellerRoles: { has: 'garden' } },
          { sellerRoles: { has: 'designer' } }
        ],
        SellerProfile: null
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        sellerRoles: true
      }
    });

    console.log(`Found ${usersNeedingProfiles.length} users needing SellerProfiles:\n`);

    if (usersNeedingProfiles.length === 0) {
      console.log('✅ All users with seller roles already have SellerProfiles!');
      return;
    }

    usersNeedingProfiles.forEach(user => {
      console.log(`   - ${user.name || user.username} (${user.email})`);
      console.log(`     Role: ${user.role}, SellerRoles: ${user.sellerRoles?.join(', ') || 'none'}`);
    });

    console.log('\n⚠️  This will create SellerProfiles for all these users.');
    console.log('Continue? (This is safe - it only adds missing profiles)\n');

    // Create SellerProfiles
    let createdCount = 0;
    for (const user of usersNeedingProfiles) {
      try {
        const sellerProfile = await prisma.sellerProfile.create({
          data: {
            id: crypto.randomUUID(),
            userId: user.id,
            displayName: user.name || user.username || 'Mijn Bedrijf',
            bio: `Verkoop via HomeCheff - ${user.sellerRoles?.join(', ') || user.role}`,
            deliveryMode: 'FIXED',
            deliveryRadius: 5.0
          }
        });

        console.log(`✅ Created SellerProfile for ${user.name || user.username}: ${sellerProfile.id}`);
        createdCount++;
      } catch (error) {
        console.error(`❌ Failed to create SellerProfile for ${user.name || user.username}:`, error.message);
      }
    }

    console.log(`\n✅ Created ${createdCount} SellerProfiles successfully!`);
    console.log('Users should now be able to create products.');

  } catch (error) {
    console.error('❌ Error creating seller profiles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMissingSellerProfiles();

