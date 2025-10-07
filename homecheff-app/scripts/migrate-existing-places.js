const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Geocoding function (JavaScript version)
async function geocodeAddress(address, city, postalCode) {
  try {
    // Construct the full address
    const fullAddress = `${address}, ${postalCode} ${city}, Nederland`;
    
    console.log('Geocoding address:', fullAddress);
    
    // Use OpenStreetMap Nominatim API
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&countrycodes=nl&limit=1&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'HomeCheff-App/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      return {
        error: 'NO_RESULTS',
        message: 'Geen resultaten gevonden voor dit adres'
      };
    }

    const result = data[0];
    
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      display_name: result.display_name,
      address: result.address
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return {
      error: 'GEOCODING_ERROR',
      message: error instanceof Error ? error.message : 'Onbekende fout bij geocoding'
    };
  }
}

async function migrateExistingPlaces() {
  try {
    console.log('Starting migration of existing places to coordinates...');
    
    // Find all users with a place but no coordinates
    const usersWithPlaces = await prisma.user.findMany({
      where: {
        place: {
          not: null
        },
        OR: [
          { lat: null },
          { lng: null }
        ]
      },
      select: {
        id: true,
        place: true,
        lat: true,
        lng: true,
        name: true,
        email: true
      }
    });

    console.log(`Found ${usersWithPlaces.length} users with places but no coordinates`);

    let successCount = 0;
    let errorCount = 0;

    for (const user of usersWithPlaces) {
      try {
        console.log(`\nProcessing user: ${user.name} (${user.email})`);
        console.log(`Place: ${user.place}`);
        
        // Try to geocode the place
        const geocodeResult = await geocodeAddress('', user.place, '');
        
        if ('error' in geocodeResult) {
          console.log(`❌ Geocoding failed for ${user.place}: ${geocodeResult.message}`);
          errorCount++;
          continue;
        }

        // Update user with coordinates
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lat: geocodeResult.lat,
            lng: geocodeResult.lng
          }
        });

        console.log(`✅ Updated ${user.name}: ${user.place} -> ${geocodeResult.lat}, ${geocodeResult.lng}`);
        successCount++;

        // Add a small delay to be respectful to the geocoding API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error processing user ${user.id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Migration completed:`);
    console.log(`✅ Successfully geocoded: ${successCount} users`);
    console.log(`❌ Failed to geocode: ${errorCount} users`);
    console.log(`📝 Total processed: ${usersWithPlaces.length} users`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateExistingPlaces();