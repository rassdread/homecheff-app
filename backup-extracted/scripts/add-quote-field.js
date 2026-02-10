const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addQuoteField() {
  try {
    // This will be handled by Prisma migration
    // For now, we'll just verify the database connection
    const userCount = await prisma.user.count();
  } catch (error) {
    console.error('Error adding quote field:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addQuoteField();


