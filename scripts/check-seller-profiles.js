// Script om users te checken die seller roles hebben maar geen SellerProfile
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSellerProfiles() {

  try {
    // Find users with seller roles
    const usersWithSellerRoles = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'SELLER' },
          { sellerRoles: { has: 'chef' } },
          { sellerRoles: { has: 'garden' } },
          { sellerRoles: { has: 'designer' } }
        ]
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        sellerRoles: true,
        SellerProfile: {
          select: {
            id: true,
            displayName: true
          }
        }
      }
    });

    const missingProfiles = [];
    const hasProfiles = [];

    usersWithSellerRoles.forEach(user => {
      if (user.SellerProfile) {
        hasProfiles.push(user);
      } else {
        missingProfiles.push(user);
      }
    });

    hasProfiles.forEach(user => {

    });

    missingProfiles.forEach(user => {

    });

    if (missingProfiles.length > 0) {

    }

    // Also check garden project users specifically

    const gardenProjectUsers = await prisma.dish.findMany({
      where: {
        category: 'GROWN'
      },
      include: {
        user: {
          include: {
            SellerProfile: true
          },
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            role: true,
            sellerRoles: true,
            SellerProfile: {
              select: {
                id: true,
                businessName: true
              }
            }
          }
        }
      },
      select: {
        id: true,
        title: true,
        user: true
      }
    });

    const uniqueUsers = new Map();
    gardenProjectUsers.forEach(project => {
      const user = project.user;
      if (!uniqueUsers.has(user.id)) {
        uniqueUsers.set(user.id, user);
      }
    });

    Array.from(uniqueUsers.values()).forEach(user => {
      const hasProfile = user.SellerProfile ? '✅' : '❌';

      if (!user.SellerProfile) {

      }
    });

  } catch (error) {
    console.error('❌ Error checking seller profiles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSellerProfiles();
