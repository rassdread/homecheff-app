const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCoordinates() {
  // Check users with coordinates
  const usersWithCoords = await prisma.user.findMany({
    where: {
      lat: { not: null },
      lng: { not: null }
    },
    select: {
      id: true,
      name: true,
      place: true,
      lat: true,
      lng: true,
      address: true,
      city: true,
      postalCode: true
    }
  });
  usersWithCoords.forEach(user => {
  });

  // Check seller profiles with coordinates
  const sellersWithCoords = await prisma.sellerProfile.findMany({
    where: {
      lat: { not: null },
      lng: { not: null }
    },
    select: {
      id: true,
      lat: true,
      lng: true,
      User: {
        select: {
          name: true,
          place: true
        }
      }
    }
  });
  sellersWithCoords.forEach(seller => {
  });

  // Check products and their seller coordinates
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      title: true,
      seller: {
        select: {
          lat: true,
          lng: true,
          User: {
            select: {
              name: true,
              place: true
            }
          }
        }
      }
    },
    take: 10
  });
  products.forEach(product => {
  });

  // Test distance calculation between Rotterdam and Dordrecht
  const rotterdamLat = 51.9244;
  const rotterdamLng = 4.4777;
  const dordrechtLat = 51.8133;
  const dordrechtLng = 4.6901;

  function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  }

  const distance = calculateDistance(rotterdamLat, rotterdamLng, dordrechtLat, dordrechtLng);
  await prisma.$disconnect();
}

checkCoordinates().catch(console.error);
