const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearAllProducts() {
  try {
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
      } catch (error) {
      }
    }

    // Verify cleanup
    const productCount = await prisma.product.count();
    const listingCount = await prisma.listing.count();
    const imageCount = await prisma.image.count();
    const favoriteCount = await prisma.favorite.count();
    if (productCount === 0 && listingCount === 0 && imageCount === 0 && favoriteCount === 0) {
    } else {
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllProducts();

