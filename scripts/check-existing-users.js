const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkExistingUsers() {
  try {
    const users = await prisma.user.findMany({
      select: { email: true, name: true, username: true }
    });
    users.forEach(user => {
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExistingUsers();

