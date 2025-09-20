const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function simpleCleanup() {
  try {
    console.log('🧹 Simple cleanup of test users...');
    
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
        console.log(`🗑️  Deleting user: ${user.name} (${user.email})`);
        
        // Delete user (cascade will handle related records)
        await prisma.user.delete({
          where: { id: user.id }
        });
        
        console.log(`✅ Deleted user: ${user.name}`);
      }
    }
    
    console.log('🎉 Cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simpleCleanup();
