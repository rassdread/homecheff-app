const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Zoeken naar Andre Arrias...');
    
    // Zoek gebruiker Andre Arrias
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { name: { contains: 'Andre', mode: 'insensitive' } },
          { name: { contains: 'Arrias', mode: 'insensitive' } },
          { email: { contains: 'andre', mode: 'insensitive' } },
          { email: { contains: 'arrias', mode: 'insensitive' } },
        ],
      },
      include: {
        affiliate: true,
      },
    });

    if (!user) {
      console.log('❌ Andre Arrias niet gevonden in database.');
      console.log('Beschikbare gebruikers met "arrias" in naam of email:');
      const similarUsers = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: 'arrias', mode: 'insensitive' } },
            { email: { contains: 'arrias', mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          createdAt: true,
        },
      });
      
      if (similarUsers.length > 0) {
        similarUsers.forEach(u => {
          console.log(`  - ${u.name} (${u.email}) - ID: ${u.id} - Aangemaakt: ${u.createdAt}`);
        });
      } else {
        console.log('  Geen gebruikers gevonden met "arrias" in naam of email.');
      }
      return;
    }

    console.log(`✅ Gebruiker gevonden: ${user.name} (${user.email})`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Aangemaakt: ${user.createdAt}`);
    
    // Check of er al een attribution bestaat
    const existingAttribution = await prisma.attribution.findFirst({
      where: {
        userId: user.id,
      },
      include: {
        affiliate: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (existingAttribution) {
      console.log('\n📋 Bestaande attribution gevonden:');
      console.log(`   Affiliate: ${existingAttribution.affiliate.user.name} (${existingAttribution.affiliate.user.email})`);
      console.log(`   Type: ${existingAttribution.type}`);
      console.log(`   Source: ${existingAttribution.source}`);
      console.log(`   Van: ${existingAttribution.startsAt}`);
      console.log(`   Tot: ${existingAttribution.endsAt}`);
      console.log(`   Status: ${new Date() > existingAttribution.endsAt ? 'EXPIRED' : 'ACTIVE'}`);
      return;
    }

    console.log('\n❌ Geen attribution gevonden voor deze gebruiker.');
    
    // Vraag welke affiliate ID gebruikt moet worden
    console.log('\n📊 Actieve affiliates:');
    const affiliates = await prisma.affiliate.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      take: 20,
    });

    affiliates.forEach((aff, index) => {
      console.log(`   ${index + 1}. ${aff.user.name} (${aff.user.email}) - Affiliate ID: ${aff.id}`);
    });

    console.log('\n💡 Om een attribution aan te maken, voer uit:');
    console.log('   node scripts/create-attribution.js <userId> <affiliateId>');
    console.log(`\n   Voorbeeld: node scripts/create-attribution.js ${user.id} <affiliate-id>`);

  } catch (error) {
    console.error('❌ Fout:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();


