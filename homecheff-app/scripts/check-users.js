const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const userCount = await prisma.user.count();
    console.log('Total users:', userCount);
    
    const testUsers = await prisma.user.findMany({
      where: {
        email: {
          contains: 'test.com'
        }
      },
      select: { id: true, email: true, name: true, createdAt: true }
    });
    console.log('Test users:', testUsers);
    
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true, name: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    console.log('Recent users:', allUsers);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkUsers();


