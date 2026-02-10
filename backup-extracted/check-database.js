const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    // Check users
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          sellerRoles: true,
          buyerRoles: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });
      users.forEach((user, index) => {
      });
    }

    // Check seller profiles
    const sellerProfileCount = await prisma.sellerProfile.count();
    // Check delivery profiles
    const deliveryProfileCount = await prisma.deliveryProfile.count();
    // Check products
    const productCount = await prisma.product.count();
    // Check workspace content
    const workspaceContentCount = await prisma.workspaceContent.count();
    // Check orders
    const orderCount = await prisma.order.count();
  } catch (error) {
    console.error('❌ Fout bij database controle:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();


