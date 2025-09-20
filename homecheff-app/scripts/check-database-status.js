const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabaseStatus() {
  try {
    console.log('🔍 Checking database status...');
    
    const dishCount = await prisma.dish.count();
    const listingCount = await prisma.listing.count();
    const productCount = await prisma.product.count();
    const userCount = await prisma.user.count();
    
    console.log(`👥 Users: ${userCount}`);
    console.log(`🍽️  Dishes: ${dishCount}`);
    console.log(`📋 Listings: ${listingCount}`);
    console.log(`📦 Products: ${productCount}`);
    
    if (dishCount === 0) {
      console.log('✅ All old Dish items have been removed!');
    } else {
      console.log('⚠️  There are still old Dish items in the database');
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseStatus();
