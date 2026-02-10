const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const userCount = await prisma.user.count();
    const testUsers = await prisma.user.findMany({
      where: {
        email: {
          contains: 'test.com'
        }
      },
      select: { id: true, email: true, name: true, createdAt: true }
    });
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true, name: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkUsers();

