const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSellerProfiles() {
  try {

    // Get all seller users without profiles
    const sellerUsers = await prisma.user.findMany({
      where: { 
        role: 'SELLER',
        SellerProfile: null
      }
    });

    for (const user of sellerUsers) {
      try {
        const sellerProfile = await prisma.sellerProfile.create({
          data: {
            id: `seller-${user.id}`,
            userId: user.id,
            displayName: user.name || user.username || 'Verkoper',
            bio: 'Nieuwe verkoper op HomeCheff',
            lat: 52.3676, // Amsterdam coordinates
            lng: 4.9041,
            btw: '',
            companyName: '',
            kvk: '',
            subscriptionId: null,
            subscriptionValidUntil: null
          }
        });

      } catch (error) {
        console.error(`❌ Failed to create profile for ${user.name || user.email}:`, error.message);
      }
    }

    // Verify creation
    const totalProfiles = await prisma.sellerProfile.count();

  } catch (error) {
    console.error('❌ Error creating seller profiles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSellerProfiles();
