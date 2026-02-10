const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    // Find admin user
    const admin = await prisma.user.findFirst({
      where: { email: 'admin@homecheff.eu' }
    });

    if (!admin) {
      return;
    }
    // Hash new password
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: admin.id },
      data: { passwordHash: hashedPassword }
    });
    // Verify the update
    const updatedAdmin = await prisma.user.findUnique({
      where: { id: admin.id },
      select: { email: true, name: true, role: true, updatedAt: true }
    });
  } catch (error) {
    console.error('❌ Fout bij resetten admin wachtwoord:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();


