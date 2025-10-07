const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDordrechtCoordinates() {
  console.log('Fixing Dordrecht coordinates...');

  // Correct coordinates for Dordrecht
  const dordrechtLat = 51.8133;
  const dordrechtLng = 4.6901;

  // Find users with place "Dordrecht" and wrong coordinates
  const dordrechtUsers = await prisma.user.findMany({
    where: {
      place: {
        contains: 'Dordrecht',
        mode: 'insensitive'
      }
    },
    select: {
      id: true,
      name: true,
      place: true,
      lat: true,
      lng: true
    }
  });

  console.log(`Found ${dordrechtUsers.length} users in Dordrecht:`);
  dordrechtUsers.forEach(user => {
    console.log(`- ${user.name}: ${user.place} (${user.lat}, ${user.lng})`);
  });

  // Update coordinates for Dordrecht users
  for (const user of dordrechtUsers) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lat: dordrechtLat,
        lng: dordrechtLng
      }
    });
    console.log(`Updated ${user.name} to correct Dordrecht coordinates`);
  }

  // Also update seller profiles
  const dordrechtSellers = await prisma.sellerProfile.findMany({
    where: {
      User: {
        place: {
          contains: 'Dordrecht',
          mode: 'insensitive'
        }
      }
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

  console.log(`\nFound ${dordrechtSellers.length} seller profiles in Dordrecht:`);
  dordrechtSellers.forEach(seller => {
    console.log(`- ${seller.User?.name}: ${seller.User?.place} (${seller.lat}, ${seller.lng})`);
  });

  // Update coordinates for Dordrecht sellers
  for (const seller of dordrechtSellers) {
    await prisma.sellerProfile.update({
      where: { id: seller.id },
      data: {
        lat: dordrechtLat,
        lng: dordrechtLng
      }
    });
    console.log(`Updated seller ${seller.User?.name} to correct Dordrecht coordinates`);
  }

  // Test distance calculation after fix
  const rotterdamLat = 51.9244;
  const rotterdamLng = 4.4777;

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
  console.log(`\nDistance after fix: Rotterdam to Dordrecht = ${distance.toFixed(2)} km`);

  await prisma.$disconnect();
}

fixDordrechtCoordinates().catch(console.error);
