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
    
    console.log('Total sellers:', sellers.length);
    console.log('Sellers with location data:', sellers.filter(s => s.lat && s.lng).length);
    
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
    
    console.log('\nSample products:');
    products.forEach(product => {
      console.log(`- ${product.title}: seller lat=${product.seller?.lat}, lng=${product.seller?.lng}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSellers();
