import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function fixAdmin() {
  console.log('🔧 Fixing admin user...');
  
  try {
    // Delete existing admin if exists
    await prisma.user.deleteMany({
      where: { email: 'admin@homecheff.eu' }
    });
    console.log('🗑️  Removed existing admin user');

    // Create new admin user with proper configuration
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@homecheff.eu',
        name: 'Admin User',
        username: 'admin',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        emailVerified: new Date(),
        bio: 'Platform Administrator',
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@homecheff.eu');
    console.log('🔑 Password: admin123');
    console.log('🔐 Role: ADMIN');
    console.log('✅ Email verified: true');
    
    // Verify the user was created correctly
    const verifyAdmin = await prisma.user.findUnique({
      where: { email: 'admin@homecheff.eu' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        passwordHash: true
      }
    });

    if (verifyAdmin) {
      console.log('✅ Verification successful:');
      console.log(`   ID: ${verifyAdmin.id}`);
      console.log(`   Email: ${verifyAdmin.email}`);
      console.log(`   Name: ${verifyAdmin.name}`);
      console.log(`   Role: ${verifyAdmin.role}`);
      console.log(`   Email Verified: ${verifyAdmin.emailVerified ? 'Yes' : 'No'}`);
      console.log(`   Has Password: ${verifyAdmin.passwordHash ? 'Yes' : 'No'}`);
    }
    
  } catch (error) {
    console.error('❌ Error fixing admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdmin();




