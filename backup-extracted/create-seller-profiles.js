const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

async function createSellerProfiles() {
  const prisma = new PrismaClient();
  
  try {
    // Find SELLER users without SellerProfile
    const sellerUsers = await prisma.user.findMany({
      where: { 
        role: 'SELLER',
        SellerProfile: null
      }
    });
    for (const user of sellerUsers) {
      await prisma.sellerProfile.create({
        data: {
          id: uuidv4(),
          userId: user.id,
          displayName: user.name || user.email,
          bio: user.bio || null,
          lat: user.lat || null,
          lng: user.lng || null,
          btw: null,
          companyName: null,
          kvk: null,
          subscriptionId: null,
          subscriptionValidUntil: null
        }
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSellerProfiles();
