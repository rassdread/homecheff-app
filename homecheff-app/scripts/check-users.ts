import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  console.log('📊 Alle gebruikers in database:');
  
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (users.length === 0) {
      console.log('❌ Geen gebruikers gevonden');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.name || 'Geen naam'})`);
        console.log(`   Gebruikersnaam: ${user.username || 'Geen gebruikersnaam'}`);
        console.log(`   Rol: ${user.role}`);
        console.log(`   Aangemaakt: ${user.createdAt.toLocaleDateString()}`);
        console.log('');
      });
      console.log(`Totaal: ${users.length} gebruikers`);
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();


