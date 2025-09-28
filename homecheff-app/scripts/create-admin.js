const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || 'Admin';

  if (!email || !password) {
    console.log('Gebruik: node scripts/create-admin.js <email> <password> [name]');
    console.log('Voorbeeld: node scripts/create-admin.js admin@homecheff.eu wachtwoord123 "Admin User"');
    process.exit(1);
  }

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email }
    });

    if (existingAdmin) {
      if (existingAdmin.role === 'ADMIN') {
        console.log('❌ Admin met dit e-mailadres bestaat al!');
        process.exit(1);
      } else {
        // Update existing user to admin
        const hashedPassword = await bcrypt.hash(password, 12);
        await prisma.user.update({
          where: { email },
          data: {
            role: 'ADMIN',
            passwordHash: hashedPassword,
            name: name
          }
        });
        console.log('✅ Bestaande gebruiker is nu admin!');
      }
    } else {
      // Create new admin
      const hashedPassword = await bcrypt.hash(password, 12);
      await prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          name,
          username: email.split('@')[0],
          role: 'ADMIN',
          bio: 'HomeCheff Administrator',
          interests: ['Beheer', 'Moderatie', 'Ondersteuning'],
          emailVerified: new Date(), // Auto-verify admin accounts
          termsAccepted: true,
          termsAcceptedAt: new Date(),
          privacyPolicyAccepted: true,
          privacyPolicyAcceptedAt: new Date(),
          taxResponsibilityAccepted: true,
          taxResponsibilityAcceptedAt: new Date(),
          marketingAccepted: false, // Admin doesn't need marketing
          displayFullName: true,
          displayNameOption: 'full'
        }
      });
      console.log('✅ Admin account aangemaakt!');
    }

    console.log('\n🔐 Admin Login Gegevens:');
    console.log(`Email: ${email}`);
    console.log(`Wachtwoord: ${password}`);
    console.log(`\n🌐 Ga naar: /admin om in te loggen`);
    
  } catch (error) {
    console.error('❌ Fout bij het aanmaken van admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();






