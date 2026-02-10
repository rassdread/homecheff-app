const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    // Check users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    users.forEach(user => {
    });

    // Check products
    const products = await prisma.product.findMany({
      select: {
        id: true,
        title: true,
        category: true,
        priceCents: true,
        isActive: true,
        createdAt: true,
        seller: {
          select: {
            User: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });
    products.forEach(product => {
    });

    // Check seller profiles
    const sellers = await prisma.sellerProfile.findMany({
      select: {
        id: true,
        displayName: true,
        User: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    sellers.forEach(seller => {
    });

  } catch (error) {
    console.error('❌ Error checking database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database check failed:', error);
    process.exit(1);
  });
