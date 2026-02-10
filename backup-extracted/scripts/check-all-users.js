const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllUsers() {
  try {
    const allUsers = await prisma.user.findMany({
      select: { 
        id: true, 
        email: true, 
        name: true, 
        createdAt: true,
        role: true
      },
      orderBy: { createdAt: 'desc' }
    });
    allUsers.forEach((user, index) => {
    });
    
    // Check for admin users
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, name: true, createdAt: true }
    });
    adminUsers.forEach(admin => {
    });
    
    // Check for users created before today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const oldUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          lt: today
        }
      },
      select: { id: true, email: true, name: true, createdAt: true }
    });
    oldUsers.forEach(user => {
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkAllUsers();

