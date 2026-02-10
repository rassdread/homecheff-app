const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupTestData() {
  console.log('🧹 Starting cleanup of test data...');
  
  try {
    // Delete all data in the correct order to avoid foreign key constraints
    
    // 1. Delete follow relationships
    const deletedFollows = await prisma.follow.deleteMany({});
    console.log(`✅ Deleted ${deletedFollows.count} follow relationships`);
    
    // 2. Delete product reviews
    const deletedReviews = await prisma.productReview.deleteMany({});
    console.log(`✅ Deleted ${deletedReviews.count} product reviews`);
    
    // 3. Delete order items
    const deletedOrderItems = await prisma.orderItem.deleteMany({});
    console.log(`✅ Deleted ${deletedOrderItems.count} order items`);
    
    // 4. Delete orders
    const deletedOrders = await prisma.order.deleteMany({});
    console.log(`✅ Deleted ${deletedOrders.count} orders`);
    
    // 5. Delete delivery orders
    const deletedDeliveryOrders = await prisma.deliveryOrder.deleteMany({});
    console.log(`✅ Deleted ${deletedDeliveryOrders.count} delivery orders`);
    
    // 6. Delete transactions
    const deletedTransactions = await prisma.transaction.deleteMany({});
    console.log(`✅ Deleted ${deletedTransactions.count} transactions`);
    
    // 7. Delete product images
    const deletedImages = await prisma.image.deleteMany({});
    console.log(`✅ Deleted ${deletedImages.count} product images`);
    
    // 8. Delete products
    const deletedProducts = await prisma.product.deleteMany({});
    console.log(`✅ Deleted ${deletedProducts.count} products`);
    
    // 9. Delete delivery profiles
    const deletedDeliveryProfiles = await prisma.deliveryProfile.deleteMany({});
    console.log(`✅ Deleted ${deletedDeliveryProfiles.count} delivery profiles`);
    
    // 10. Delete seller profiles
    const deletedSellerProfiles = await prisma.sellerProfile.deleteMany({});
    console.log(`✅ Deleted ${deletedSellerProfiles.count} seller profiles`);
    
    // 11. Delete analytics events
    const deletedAnalytics = await prisma.analyticsEvent.deleteMany({});
    console.log(`✅ Deleted ${deletedAnalytics.count} analytics events`);
    
    // 12. Delete notifications
    const deletedNotifications = await prisma.notification.deleteMany({});
    console.log(`✅ Deleted ${deletedNotifications.count} notifications`);
    
    // 13. Delete messages
    const deletedMessages = await prisma.message.deleteMany({});
    console.log(`✅ Deleted ${deletedMessages.count} messages`);
    
    // 14. Delete conversations
    const deletedConversations = await prisma.conversation.deleteMany({});
    console.log(`✅ Deleted ${deletedConversations.count} conversations`);
    
    // 15. Delete reports
    const deletedReports = await prisma.report.deleteMany({});
    console.log(`✅ Deleted ${deletedReports.count} reports`);
    
    // 16. Delete test users (keep admin and manually created users)
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        OR: [
          // Delete seed script users with test emails
          { email: 'test@example.com' },
          { email: 'admin@homecheff.com' },
          { email: 'seller@example.com' },
          { email: 'buyer@example.com' },
          { email: 'delivery@example.com' },
          // Delete users with test names from seed
          { name: { contains: 'Chef' } },
          { name: { contains: 'Artisan' } },
          { name: { contains: 'Creative' } },
          { name: { contains: 'Green' } },
          { name: { contains: 'Vries' } },
          { name: { contains: 'Berg' } },
          { name: { contains: 'Olla' } },
          // Delete users with test usernames
          { username: { contains: 'chef' } },
          { username: { contains: 'craft' } },
          { username: { contains: 'design' } },
          { username: { contains: 'plants' } },
          { username: { contains: 'grower' } },
          { username: { contains: 'garden' } },
          { username: { contains: 'Olla' } }
        ],
        // But keep admin role
        role: {
          not: 'ADMIN'
        }
      }
    });
    console.log(`✅ Deleted ${deletedUsers.count} test users (kept admin and manually created users)`);
    
    console.log('🎉 Cleanup completed successfully!');
    console.log('📝 Database is now clean and ready for production use.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTestData()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
