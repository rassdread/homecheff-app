const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAdminLanguage() {
  console.log('🔍 Controleren van admin taal instellingen...');
  console.log('');
  
  try {
    // Vind alle admin users
    const adminUsers = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'ADMIN' },
          { role: 'SUPERADMIN' }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        preferredLanguage: true
      },
      orderBy: {
        email: 'asc'
      }
    });
    
    console.log(`📊 Totaal aantal admin users: ${adminUsers.length}`);
    console.log('');
    
    if (adminUsers.length > 0) {
      adminUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name || 'Geen naam'}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Preferred Language: ${user.preferredLanguage || 'NIET INGESTELD (default: nl)'}`);
        console.log('');
      });
      
      // Check of er users zijn zonder preferredLanguage
      const usersWithoutLanguage = adminUsers.filter(u => !u.preferredLanguage);
      if (usersWithoutLanguage.length > 0) {
        console.log(`⚠️  ${usersWithoutLanguage.length} admin user(s) zonder preferredLanguage:`);
        usersWithoutLanguage.forEach(user => {
          console.log(`   - ${user.email}`);
        });
        console.log('');
        console.log('💡 Deze users hebben waarschijnlijk nog de default taal (Nederlands)');
      }
    } else {
      console.log('❌ Geen admin users gevonden');
    }
    
  } catch (error) {
    console.error('❌ Error tijdens check:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminLanguage()
  .then(() => {
    console.log('✅ Check voltooid');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Check gefaald:', error);
    process.exit(1);
  });















