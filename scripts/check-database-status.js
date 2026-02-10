const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabaseStatus() {
  try {
    const dishCount = await prisma.dish.count();
    const listingCount = await prisma.listing.count();
    const productCount = await prisma.product.count();
    const userCount = await prisma.user.count();
    if (dishCount === 0) {
    } else {
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseStatus();

