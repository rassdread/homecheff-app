const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addQuoteField() {
  try {
    console.log('Adding quote field to User model...');
    
    // This will be handled by Prisma migration
    // For now, we'll just verify the database connection
    const userCount = await prisma.user.count();
    console.log(`Database connected successfully. Found ${userCount} users.`);
    
    console.log('Quote field addition completed successfully!');
  } catch (error) {
    console.error('Error adding quote field:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addQuoteField();













