const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deletePlaceholderReviews() {
  try {
    console.log('🗑️  Deleting placeholder reviews (not submitted)...\n');

    // Find all placeholder reviews (not submitted)
    const placeholderReviews = await prisma.productReview.findMany({
      where: {
        reviewSubmittedAt: null // Not submitted
      },
      include: {
        product: {
          select: {
            id: true,
            title: true
          }
        },
        buyer: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      }
    });

    console.log(`📊 Found ${placeholderReviews.length} placeholder reviews\n`);

    if (placeholderReviews.length === 0) {
      console.log('✅ No placeholder reviews to delete');
      return;
    }

    console.log('📝 Reviews to be deleted:\n');
    placeholderReviews.forEach((review, index) => {
      console.log(`${index + 1}. Review ID: ${review.id}`);
      console.log(`   Product: ${review.product.title}`);
      console.log(`   Buyer: ${review.buyer.name || review.buyer.username}`);
      console.log(`   Order ID: ${review.orderId || 'Geen order'}`);
      console.log(`   Rating: ${review.rating}`);
      console.log('-'.repeat(80));
    });

    // Delete placeholder reviews
    const deleteResult = await prisma.productReview.deleteMany({
      where: {
        reviewSubmittedAt: null
      }
    });

    console.log(`\n✅ Successfully deleted ${deleteResult.count} placeholder reviews`);
    console.log('\n💡 Tip: Now you can reset orders to a different status and then back to DELIVERED');
    console.log('   to trigger new review requests.');

  } catch (error) {
    console.error('❌ Error deleting placeholder reviews:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deletePlaceholderReviews();













