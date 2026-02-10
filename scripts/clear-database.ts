import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    // Delete in correct order to avoid foreign key constraints
    await prisma.dishPhoto.deleteMany();
    await prisma.dish.deleteMany();
    await prisma.image.deleteMany();
    await prisma.product.deleteMany();
    await prisma.listing.deleteMany();
    await prisma.listingMedia.deleteMany();
    await prisma.sellerProfile.deleteMany();
    await prisma.business.deleteMany();
    await prisma.account.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
