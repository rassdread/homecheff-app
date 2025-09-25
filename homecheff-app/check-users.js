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
    
    console.log('Gebruikers in database:', users.length);
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - ${user.role}`);
      if (user.SellerProfile) {
        console.log('  Seller profiel:', user.SellerProfile.id);
      }
      if (user.DeliveryProfile) {
        console.log('  Delivery profiel:', user.DeliveryProfile.id);
      }
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Fout:', error);
    await prisma.$disconnect();
  }
}

checkUsers();
