const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
        SellerProfile: true,
        DeliveryProfile: true
      }
    });

    users.forEach(user => {

      if (user.SellerProfile) {

      }
      if (user.DeliveryProfile) {

      }
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Fout:', error);
    await prisma.$disconnect();
  }
}

checkUsers();
