const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupOrphanedProducts() {
  console.log('🧹 Starting cleanup of orphaned products...');
  
  try {
    // Find products where the seller no longer exists
    const orphanedProducts = await prisma.$queryRaw`
      SELECT p.id, p.title, p.sellerId, p.createdAt
      FROM "Product" p
      LEFT JOIN "User" u ON p."sellerId" = u.id
      WHERE u.id IS NULL
    `;
    
    console.log(`📊 Found ${orphanedProducts.length} orphaned products`);
    
    if (orphanedProducts.length === 0) {
      console.log('✅ No orphaned products found. Database is clean!');
      return;
    }
    
    // Show details of orphaned products
    console.log('\n📋 Orphaned products details:');
    orphanedProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.title} (ID: ${product.id}) - Seller: ${product.sellerId} - Created: ${product.createdAt}`);
    });
    
    // Delete orphaned products
    const deletedProducts = await prisma.product.deleteMany({
      where: {
        sellerId: {
          in: orphanedProducts.map(p => p.sellerId)
        }
      }
    });
    
    console.log(`\n🗑️  Deleted ${deletedProducts.count} orphaned products`);
    
    // Also clean up related data
    console.log('\n🧹 Cleaning up related data...');
    
    // Delete orphaned product images
    const deletedImages = await prisma.image.deleteMany({
      where: {
        productId: {
          in: orphanedProducts.map(p => p.id)
        }
      }
    });
    console.log(`📸 Deleted ${deletedImages.count} orphaned product images`);
    
    // Delete orphaned product reviews
    const deletedReviews = await prisma.productReview.deleteMany({
      where: {
        productId: {
          in: orphanedProducts.map(p => p.id)
        }
      }
    });
    console.log(`⭐ Deleted ${deletedReviews.count} orphaned product reviews`);
    
    // Delete orphaned favorites
    const deletedFavorites = await prisma.favorite.deleteMany({
      where: {
        productId: {
          in: orphanedProducts.map(p => p.id)
        }
      }
    });
    console.log(`❤️  Deleted ${deletedFavorites.count} orphaned favorites`);
    
    // Delete orphaned order items
    const deletedOrderItems = await prisma.orderItem.deleteMany({
      where: {
        productId: {
          in: orphanedProducts.map(p => p.id)
        }
      }
    });
    console.log(`🛒 Deleted ${deletedOrderItems.count} orphaned order items`);
    
    console.log('\n✅ Cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupOrphanedProducts()
  .then(() => {
    console.log('🎉 Cleanup script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Cleanup script failed:', error);
    process.exit(1);
  });
