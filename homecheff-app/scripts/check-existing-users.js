const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkExistingUsers() {
  try {
    const users = await prisma.user.findMany({
      select: { email: true, name: true, username: true }
    });
    
    console.log('Existing users:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - @${user.username}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExistingUsers();



