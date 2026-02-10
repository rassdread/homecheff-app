import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {

  try {
    // Remove any existing admin users
    await prisma.user.deleteMany({
      where: { role: 'ADMIN' }
    });

    // Check if admin already exists with our email
    const existingAdmin = await prisma.user.findFirst({
      where: { email: 'admin@homecheff.eu' }
    });

    if (existingAdmin) {

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
        bio: 'HomeCheff Platform Administrator',
        interests: ['Beheer', 'Moderatie', 'Ondersteuning', 'Platform Management'],
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        privacyPolicyAccepted: true,
        privacyPolicyAcceptedAt: new Date(),
        taxResponsibilityAccepted: true,
        taxResponsibilityAcceptedAt: new Date(),
        marketingAccepted: false,
        displayFullName: true,
        displayNameOption: 'full'
      }
    });

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();

