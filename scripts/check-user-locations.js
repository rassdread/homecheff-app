const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserLocations() {
  try {
    // Get all users with their location data
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        place: true,
        lat: true,
        lng: true,
        address: true,
        city: true,
        postalCode: true
      }
    });
    const withPlace = users.filter(u => u.place);
    const withCoordinates = users.filter(u => u.lat && u.lng);
    const withAddress = users.filter(u => u.address && u.city && u.postalCode);
    const withPlaceNoCoords = users.filter(u => u.place && (!u.lat || !u.lng));
    const withAddressNoCoords = users.filter(u => u.address && u.city && u.postalCode && (!u.lat || !u.lng));
    if (withPlaceNoCoords.length > 0) {
      withPlaceNoCoords.forEach(user => {
      });
    }

    if (withAddressNoCoords.length > 0) {
      withAddressNoCoords.forEach(user => {
      });
    }

    // Show some sample users
    users.slice(0, 5).forEach(user => {
    });

  } catch (error) {
    console.error('Error checking user locations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserLocations();
