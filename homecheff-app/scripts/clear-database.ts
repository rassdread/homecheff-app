import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('🗑️  Starting database cleanup...');
  
  try {
    // Delete in correct order to avoid foreign key constraints
    console.log('📸 Deleting dish photos...');
    await prisma.dishPhoto.deleteMany();
    
    console.log('🍽️  Deleting dishes...');
    await prisma.dish.deleteMany();
    
    console.log('🖼️  Deleting images...');
    await prisma.image.deleteMany();
    
    console.log('📦 Deleting products...');
    await prisma.product.deleteMany();
    
    console.log('📋 Deleting listings...');
    await prisma.listing.deleteMany();
    
    console.log('📸 Deleting listing media...');
    await prisma.listingMedia.deleteMany();
    
    console.log('💼 Deleting seller profiles...');
    await prisma.sellerProfile.deleteMany();
    
    console.log('🏢 Deleting businesses...');
    await prisma.business.deleteMany();
    
    console.log('💳 Deleting accounts...');
    await prisma.account.deleteMany();
    
    console.log('🔐 Deleting sessions...');
    await prisma.session.deleteMany();
    
    console.log('👥 Deleting users...');
    await prisma.user.deleteMany();
    
    console.log('✅ Database cleared successfully!');
    console.log('🎉 You can now start fresh with the new functionality!');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
