const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { email: 'admin@homecheff.eu' }
    });

    if (existingAdmin) {
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@homecheff.eu',
        name: 'HomeCheff Admin',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        username: 'admin',
        bio: 'HomeCheff platform administrator',
        place: 'Nederland',
        interests: ['admin', 'platform', 'management'],
        sellerRoles: [],
        buyerRoles: [],
        emailVerified: new Date(),
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        privacyPolicyAccepted: true,
        privacyPolicyAcceptedAt: new Date(),
        marketingAccepted: false,
        taxResponsibilityAccepted: true,
        taxResponsibilityAcceptedAt: new Date(),
        displayFullName: true,
        fanRequestEnabled: true,
        showFansList: true,
        showProfileToEveryone: true,
        showOnlineStatus: true,
        allowProfileViews: true,
        showActivityStatus: true,
        messagePrivacy: 'EVERYONE'
      }
    });
    // Check total users
    const userCount = await prisma.user.count();
  } catch (error) {
    console.error('❌ Fout bij aanmaken admin account:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();


