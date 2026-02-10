const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkJasonBlack() {
  console.log('🔍 Zoeken naar Jason Black...');
  console.log('');
  
  try {
    // Zoek op naam
    const usersByName = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: 'jason', mode: 'insensitive' } },
          { name: { contains: 'black', mode: 'insensitive' } },
          { email: { contains: 'jason', mode: 'insensitive' } },
          { username: { contains: 'jason', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        stripeConnectAccountId: true,
        stripeConnectOnboardingCompleted: true
      }
    });
    
    if (usersByName.length > 0) {
      console.log(`📋 Gevonden ${usersByName.length} user(s) met "jason" of "black":`);
      usersByName.forEach(user => {
        console.log(`   - ${user.name || 'Geen naam'}`);
        console.log(`     Email: ${user.email}`);
        console.log(`     Username: ${user.username || 'Geen username'}`);
        console.log(`     Stripe Connect Account ID: ${user.stripeConnectAccountId || 'Geen account'}`);
        console.log(`     Onboarding Completed: ${user.stripeConnectOnboardingCompleted}`);
        console.log('');
      });
    } else {
      console.log('❌ Geen users gevonden met "jason" of "black" in naam/email/username');
    }
    
    // Check ook jason@homecheff.eu specifiek
    const jasonHomecheff = await prisma.user.findUnique({
      where: {
        email: 'jason@homecheff.eu'
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        stripeConnectAccountId: true,
        stripeConnectOnboardingCompleted: true
      }
    });
    
    if (jasonHomecheff) {
      console.log('📋 jason@homecheff.eu gevonden:');
      console.log(`   - Naam: ${jasonHomecheff.name || 'Geen naam'}`);
      console.log(`   - Username: ${jasonHomecheff.username || 'Geen username'}`);
      console.log(`   - Stripe Connect Account ID: ${jasonHomecheff.stripeConnectAccountId || 'Geen account'}`);
      console.log(`   - Onboarding Completed: ${jasonHomecheff.stripeConnectOnboardingCompleted}`);
      
      if (jasonHomecheff.stripeConnectAccountId) {
        const isSandbox = jasonHomecheff.stripeConnectAccountId.startsWith('acct_test_');
        console.log(`   - Account Type: ${isSandbox ? 'SANDBOX' : 'LIVE'}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error tijdens check:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkJasonBlack()
  .then(() => {
    console.log('✅ Check voltooid');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Check gefaald:', error);
    process.exit(1);
  });















