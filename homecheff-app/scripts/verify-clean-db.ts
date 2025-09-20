import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyCleanDatabase() {
  console.log('🔍 Verifying database is clean...');
  
  try {
    const userCount = await prisma.user.count();
    const dishCount = await prisma.dish.count();
    const productCount = await prisma.product.count();
    const listingCount = await prisma.listing.count();
    
    console.log(`👥 Users: ${userCount}`);
    console.log(`🍽️  Dishes: ${dishCount}`);
    console.log(`📦 Products: ${productCount}`);
    console.log(`📋 Listings: ${listingCount}`);
    
    if (userCount === 0 && dishCount === 0 && productCount === 0 && listingCount === 0) {
      console.log('✅ Database is completely clean!');
      console.log('🎉 Ready to test new functionality!');
    } else {
      console.log('⚠️  Database still contains some data');
    }
    
  } catch (error) {
    console.error('❌ Error verifying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyCleanDatabase();

