const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    console.log('🔧 Admin wachtwoord resetten...\n');

    // Find admin user
    const admin = await prisma.user.findFirst({
      where: { email: 'admin@homecheff.eu' }
    });

    if (!admin) {
      console.log('❌ Admin account niet gevonden!');
      return;
    }

    console.log(`✅ Admin account gevonden: ${admin.name} (${admin.email})`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   ID: ${admin.id}`);

    // Hash new password
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: admin.id },
      data: { passwordHash: hashedPassword }
    });

    console.log('\n✅ Admin wachtwoord succesvol gereset!');
    console.log(`   Email: admin@homecheff.eu`);
    console.log(`   Nieuwe wachtwoord: ${newPassword}`);
    console.log(`   Role: ${admin.role}`);

    // Verify the update
    const updatedAdmin = await prisma.user.findUnique({
      where: { id: admin.id },
      select: { email: true, name: true, role: true, updatedAt: true }
    });

    console.log(`\n📊 Admin account details:`);
    console.log(`   Email: ${updatedAdmin.email}`);
    console.log(`   Name: ${updatedAdmin.name}`);
    console.log(`   Role: ${updatedAdmin.role}`);
    console.log(`   Laatst bijgewerkt: ${updatedAdmin.updatedAt.toLocaleString('nl-NL')}`);

  } catch (error) {
    console.error('❌ Fout bij resetten admin wachtwoord:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();













