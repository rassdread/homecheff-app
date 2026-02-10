import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function fixAdmin() {
  try {
    // Delete existing admin if exists
    await prisma.user.deleteMany({
      where: { email: 'admin@homecheff.eu' }
    });
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
    }
    
  } catch (error) {
    console.error('❌ Error fixing admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdmin();

