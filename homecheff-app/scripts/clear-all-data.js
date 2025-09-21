const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearAllData() {
  try {
    console.log('🗑️  Starting data cleanup...');

    // Delete in correct order to respect foreign key constraints
    const tables = [
      'DishPhoto',
      'Dish',
      'Image',
      'OrderItem',
      'Order',
      'Favorite',
      'Follow',
      'Payout',
      'Refund',
      'Transaction',
      'Reservation',
      'Review',
      'Report',
      'AdminAction',
      'Message',
      'ConversationParticipant',
      'Conversation',
      'Notification',
      'AuditLog',
      'ListingTag',
      'ListingMedia',
      'Listing',
      'Coupon',
      'DeviceToken',
      'VerificationToken',
      'Session',
      'Account',
      'SellerProfile',
      'Subscription',
      'Tag',
      'Product',
      'Business',
      'User'
    ];

    for (const table of tables) {
      try {
        const result = await prisma[table].deleteMany({});
        console.log(`✅ Cleared ${result.count} records from ${table}`);
      } catch (error) {
        console.log(`⚠️  Could not clear ${table}: ${error.message}`);
      }
    }

    console.log('🎉 Data cleanup completed successfully!');
    console.log('You can now start fresh with testing the new features.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllData();






