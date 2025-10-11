const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔧 Admin account aanmaken...\n');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { email: 'admin@homecheff.eu' }
    });

    if (existingAdmin) {
      console.log('❌ Admin account bestaat al!');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   ID: ${existingAdmin.id}`);
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

    console.log('✅ Admin account succesvol aangemaakt!');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: admin123`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   ID: ${admin.id}`);
    console.log(`   Aangemaakt: ${admin.createdAt.toLocaleDateString('nl-NL')}`);

    // Check total users
    const userCount = await prisma.user.count();
    console.log(`\n📊 Totaal aantal gebruikers in database: ${userCount}`);

  } catch (error) {
    console.error('❌ Fout bij aanmaken admin account:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();













