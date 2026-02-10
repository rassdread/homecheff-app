const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function simpleCleanup() {
  try {
    // Delete all users with test emails
    const testEmails = [
      'anna@test.com',
      'anna2@test.com',
      'tom2@test.com',
      'lisa2@test.com',
      'marco2@test.com',
      'sophie2@test.com'
    ];
    
    for (const email of testEmails) {
      const user = await prisma.user.findUnique({
        where: { email }
      });
      
      if (user) {
        // Delete user (cascade will handle related records)
        await prisma.user.delete({
          where: { id: user.id }
        });
      }
    }
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simpleCleanup();

