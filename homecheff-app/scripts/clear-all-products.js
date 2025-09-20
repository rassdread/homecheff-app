const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearAllProducts() {
  try {
    console.log('🗑️  Starting product cleanup...');

    // Delete in correct order to respect foreign key constraints
    const tables = [
      'OrderItem',        // First delete order items that reference products
      'Favorite',         // Delete favorites that reference products
      'Image',            // Delete images that reference products
      'Product',          // Delete new Product model
      'ListingMedia',     // Delete listing media
      'Listing',          // Delete old Listing model
    ];

    for (const table of tables) {
      try {
        const result = await prisma[table].deleteMany({});
        console.log(`✅ Cleared ${result.count} records from ${table}`);
      } catch (error) {
        console.log(`⚠️  Could not clear ${table}: ${error.message}`);
      }
    }

    // Verify cleanup
    const productCount = await prisma.product.count();
    const listingCount = await prisma.listing.count();
    const imageCount = await prisma.image.count();
    const favoriteCount = await prisma.favorite.count();

    console.log('\n📊 Final counts:');
    console.log(`Products: ${productCount}`);
    console.log(`Listings: ${listingCount}`);
    console.log(`Images: ${imageCount}`);
    console.log(`Favorites: ${favoriteCount}`);

    if (productCount === 0 && listingCount === 0 && imageCount === 0 && favoriteCount === 0) {
      console.log('\n🎉 All products and related data cleared successfully!');
      console.log('✅ You can now add new products under the new system');
    } else {
      console.log('\n⚠️  Some data still remains');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllProducts();
