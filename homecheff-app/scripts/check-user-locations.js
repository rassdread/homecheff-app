const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserLocations() {
  try {
    console.log('Checking user location data...');
    
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

    console.log(`\n📊 Total users: ${users.length}`);
    
    const withPlace = users.filter(u => u.place);
    const withCoordinates = users.filter(u => u.lat && u.lng);
    const withAddress = users.filter(u => u.address && u.city && u.postalCode);
    const withPlaceNoCoords = users.filter(u => u.place && (!u.lat || !u.lng));
    const withAddressNoCoords = users.filter(u => u.address && u.city && u.postalCode && (!u.lat || !u.lng));

    console.log(`📍 Users with place: ${withPlace.length}`);
    console.log(`🗺️  Users with coordinates: ${withCoordinates.length}`);
    console.log(`🏠 Users with address: ${withAddress.length}`);
    console.log(`⚠️  Users with place but no coordinates: ${withPlaceNoCoords.length}`);
    console.log(`⚠️  Users with address but no coordinates: ${withAddressNoCoords.length}`);

    if (withPlaceNoCoords.length > 0) {
      console.log('\n🔍 Users with place but no coordinates:');
      withPlaceNoCoords.forEach(user => {
        console.log(`- ${user.name} (${user.email}): ${user.place}`);
      });
    }

    if (withAddressNoCoords.length > 0) {
      console.log('\n🔍 Users with address but no coordinates:');
      withAddressNoCoords.forEach(user => {
        console.log(`- ${user.name} (${user.email}): ${user.address}, ${user.postalCode} ${user.city}`);
      });
    }

    // Show some sample users
    console.log('\n📋 Sample users:');
    users.slice(0, 5).forEach(user => {
      console.log(`- ${user.name}: place="${user.place}", lat=${user.lat}, lng=${user.lng}, address="${user.address}"`);
    });

  } catch (error) {
    console.error('Error checking user locations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserLocations();
