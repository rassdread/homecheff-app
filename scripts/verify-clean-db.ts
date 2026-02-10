import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyCleanDatabase() {
  try {
    const userCount = await prisma.user.count();
    const dishCount = await prisma.dish.count();
    const productCount = await prisma.product.count();
    const listingCount = await prisma.listing.count();
    if (userCount === 0 && dishCount === 0 && productCount === 0 && listingCount === 0) {
    } else {
    }
    
  } catch (error) {
    console.error('❌ Error verifying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyCleanDatabase();

