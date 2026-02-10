const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearAllData() {
  try {
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
      } catch (error) {
      }
    }
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllData();

