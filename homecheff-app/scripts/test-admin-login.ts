import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testAdminLogin() {
  console.log('🧪 Testing admin login...');
  
  try {
    // Find admin user
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@homecheff.eu' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        passwordHash: true,
        emailVerified: true
      }
    });

    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('✅ Admin user found:');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Email Verified: ${admin.emailVerified ? 'Yes' : 'No'}`);

    // Test password verification
    const testPassword = 'admin123';
    const isPasswordValid = await bcrypt.compare(testPassword, admin.passwordHash!);
    
    console.log(`🔑 Password test: ${isPasswordValid ? '✅ Valid' : '❌ Invalid'}`);

    // Test role check
    const isAdmin = admin.role === 'ADMIN';
    console.log(`🔐 Admin role check: ${isAdmin ? '✅ Valid' : '❌ Invalid'}`);

    if (isPasswordValid && isAdmin) {
      console.log('🎉 Admin user is ready for login!');
      console.log('🌐 Try logging in at: https://homecheff.eu/login');
      console.log('📧 Email: admin@homecheff.eu');
      console.log('🔑 Password: admin123');
    } else {
      console.log('❌ Admin user has issues');
    }
    
  } catch (error) {
    console.error('❌ Error testing admin login:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminLogin();




