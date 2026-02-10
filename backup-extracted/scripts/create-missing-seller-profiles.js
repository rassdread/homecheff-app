// Script om ontbrekende SellerProfiles aan te maken voor users met seller roles
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createMissingSellerProfiles() {

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

    if (usersNeedingProfiles.length === 0) {

      return;
    }

    usersNeedingProfiles.forEach(user => {

    });

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

        createdCount++;
      } catch (error) {
        console.error(`❌ Failed to create SellerProfile for ${user.name || user.username}:`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ Error creating seller profiles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMissingSellerProfiles();

