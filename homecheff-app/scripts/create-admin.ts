import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  console.log('🔐 Creating admin user...');
  
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@homecheff.nl',
        name: 'Admin User',
        username: 'admin',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        emailVerified: new Date(),
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@homecheff.nl');
    console.log('🔑 Password: admin123');
    console.log('🌐 Login at: http://localhost:3000/login');
    console.log('🎛️  Admin panel: http://localhost:3000/admin');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();

