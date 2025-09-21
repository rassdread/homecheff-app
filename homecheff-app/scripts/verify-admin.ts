import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyAdmin() {
  console.log('🔍 Verifying admin user...');
  
  try {
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        role: true,
        createdAt: true
      }
    });

    if (admin) {
      console.log('✅ Admin user found:');
      console.log(`📧 Email: ${admin.email}`);
      console.log(`👤 Name: ${admin.name}`);
      console.log(`🏷️  Username: ${admin.username}`);
      console.log(`🔐 Role: ${admin.role}`);
      console.log(`📅 Created: ${admin.createdAt.toLocaleString()}`);
    } else {
      console.log('❌ No admin user found');
    }
    
  } catch (error) {
    console.error('❌ Error verifying admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdmin();






