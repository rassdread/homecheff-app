import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  console.log('🔐 Creating admin user...');
  
  try {
    // Remove any existing admin users
    await prisma.user.deleteMany({
      where: { role: 'ADMIN' }
    });
    console.log('🗑️  Removed existing admin users');

    // Check if admin already exists with our email
    const existingAdmin = await prisma.user.findFirst({
      where: { email: 'admin@homecheff.eu' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@homecheff.eu',
        name: 'Admin User',
        username: 'admin',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        emailVerified: new Date(),
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@homecheff.eu');
    console.log('🔑 Password: admin123');
    console.log('🌐 Login at: https://homecheff.eu/login');
    console.log('🎛️  Admin panel: https://homecheff.eu/admin');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();




