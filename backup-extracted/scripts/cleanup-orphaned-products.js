const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupOrphanedProducts() {
  try {
    // Find products where the seller no longer exists
    const orphanedProducts = await prisma.$queryRaw`
      SELECT p.id, p.title, p.sellerId, p.createdAt
      FROM "Product" p
      LEFT JOIN "User" u ON p."sellerId" = u.id
      WHERE u.id IS NULL
    `;
    if (orphanedProducts.length === 0) {
      return;
    }
    
    // Show details of orphaned products
    orphanedProducts.forEach((product, index) => {
    });
    
    // Delete orphaned products
    const deletedProducts = await prisma.product.deleteMany({
      where: {
        sellerId: {
          in: orphanedProducts.map(p => p.sellerId)
        }
      }
    });
    // Also clean up related data
    // Delete orphaned product images
    const deletedImages = await prisma.image.deleteMany({
      where: {
        productId: {
          in: orphanedProducts.map(p => p.id)
        }
      }
    });
    // Delete orphaned product reviews
    const deletedReviews = await prisma.productReview.deleteMany({
      where: {
        productId: {
          in: orphanedProducts.map(p => p.id)
        }
      }
    });
    // Delete orphaned favorites
    const deletedFavorites = await prisma.favorite.deleteMany({
      where: {
        productId: {
          in: orphanedProducts.map(p => p.id)
        }
      }
    });
    // Delete orphaned order items
    const deletedOrderItems = await prisma.orderItem.deleteMany({
      where: {
        productId: {
          in: orphanedProducts.map(p => p.id)
        }
      }
    });
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
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Cleanup script failed:', error);
    process.exit(1);
  });
