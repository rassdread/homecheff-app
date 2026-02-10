const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSellers() {
  try {
    const sellers = await prisma.sellerProfile.findMany({
      select: {
        id: true,
        lat: true,
        lng: true,
        User: {
          select: {
            name: true,
            username: true
          }
        }
      }
    });
    const products = await prisma.product.findMany({
      select: {
        id: true,
        title: true,
        seller: {
          select: {
            lat: true,
            lng: true,
            User: {
              select: {
                name: true
              }
            }
          }
        }
      },
      take: 5
    });
    products.forEach(product => {
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSellers();
