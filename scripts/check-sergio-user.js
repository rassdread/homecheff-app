const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSergioUser() {
  try {

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: 'r.sergioarrias@gmail.com' },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        sellerRoles: true,
        buyerRoles: true,
        interests: true,
        socialOnboardingCompleted: true,
        name: true,
        createdAt: true,
        SellerProfile: {
          select: {
            id: true,
            displayName: true,
            deliveryMode: true,
            deliveryRadius: true,
            companyName: true,
            kvk: true,
            btw: true
          }
        }
      }
    });

    if (!user) {

      return;
    }

    if (user.SellerProfile) {

    } else {

    }

    if (user.sellerRoles && user.sellerRoles.length > 0) {

    } else {

    }

    if (user.role === 'SELLER') {

    } else {

    }

    if (user.SellerProfile) {

    } else {

    }

    if (user.socialOnboardingCompleted) {

    } else {

    }

  } catch (error) {
    console.error('❌ Error checking user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSergioUser();
