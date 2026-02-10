const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkReviews() {
  try {
    console.log('🔍 Checking reviews in database...\n');

    // Get all reviews with their details
    const allReviews = await prisma.productReview.findMany({
      where: {},
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
            username: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20 // Get last 20 reviews
    });

    console.log(`📊 Total reviews found: ${allReviews.length}\n`);

    if (allReviews.length === 0) {
      console.log('❌ No reviews found in database');
      return;
    }

    console.log('📝 Review Details:\n');
    console.log('=' .repeat(100));

    allReviews.forEach((review, index) => {
      console.log(`\n${index + 1}. Review ID: ${review.id}`);
      console.log(`   Product: ${review.product.title} (${review.product.id})`);
      console.log(`   Buyer: ${review.buyer.name || review.buyer.username || review.buyer.email} (${review.buyer.id})`);
      console.log(`   Rating: ${review.rating} ⭐`);
      console.log(`   Review Submitted At: ${review.reviewSubmittedAt ? new Date(review.reviewSubmittedAt).toLocaleString('nl-NL') : 'NULL (niet ingediend)'}`);
      console.log(`   Created At: ${new Date(review.createdAt).toLocaleString('nl-NL')}`);
      console.log(`   Review Token: ${review.reviewToken ? 'Heeft token' : 'Geen token'}`);
      console.log(`   Is Verified: ${review.isVerified}`);
      console.log(`   Order ID: ${review.orderId || 'Geen order'}`);
      console.log(`   Comment: ${review.comment ? review.comment.substring(0, 50) + '...' : 'Geen comment'}`);
      console.log('-'.repeat(100));
    });

    // Statistics
    const stats = {
      total: allReviews.length,
      submitted: allReviews.filter(r => r.reviewSubmittedAt !== null).length,
      notSubmitted: allReviews.filter(r => r.reviewSubmittedAt === null).length,
      withRating0: allReviews.filter(r => r.rating === 0).length,
      withRating5: allReviews.filter(r => r.rating === 5).length,
      withToken: allReviews.filter(r => r.reviewToken !== null).length,
      withoutToken: allReviews.filter(r => r.reviewToken === null).length
    };

    console.log('\n📈 Statistics:\n');
    console.log(`   Total reviews: ${stats.total}`);
    console.log(`   Submitted (reviewSubmittedAt != null): ${stats.submitted}`);
    console.log(`   Not submitted (reviewSubmittedAt == null): ${stats.notSubmitted}`);
    console.log(`   With rating 0: ${stats.withRating0}`);
    console.log(`   With rating 5: ${stats.withRating5}`);
    console.log(`   With token: ${stats.withToken}`);
    console.log(`   Without token: ${stats.withoutToken}`);

    // Check for problematic reviews (submitted but rating 0)
    const problematicReviews = allReviews.filter(r => r.reviewSubmittedAt !== null && r.rating === 0);
    if (problematicReviews.length > 0) {
      console.log(`\n⚠️  WARNING: Found ${problematicReviews.length} reviews that are submitted but have rating 0:`);
      problematicReviews.forEach(r => {
        console.log(`   - Review ID: ${r.id}, Product: ${r.product.title}, Buyer: ${r.buyer.name || r.buyer.username}`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking reviews:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkReviews();













