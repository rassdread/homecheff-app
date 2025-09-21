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
    
    console.log('=== ALL USERS IN DATABASE ===');
    console.log('Total count:', allUsers.length);
    console.log('\nAll users:');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Created: ${user.createdAt.toISOString()} - Role: ${user.role}`);
    });
    
    // Check for admin users
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, name: true, createdAt: true }
    });
    console.log('\n=== ADMIN USERS ===');
    console.log('Admin count:', adminUsers.length);
    adminUsers.forEach(admin => {
      console.log(`- ${admin.name} (${admin.email})`);
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
    
    console.log('\n=== USERS CREATED BEFORE TODAY ===');
    console.log('Old users count:', oldUsers.length);
    oldUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Created: ${user.createdAt.toISOString()}`);
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkAllUsers();


