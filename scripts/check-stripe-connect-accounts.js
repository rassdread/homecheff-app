const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkStripeConnectAccounts() {
  console.log('🔍 Controleren van alle Stripe Connect accounts...');
  console.log('');
  
  try {
    // Vind alle users met een Stripe Connect account ID
    const allUsersWithAccounts = await prisma.user.findMany({
      where: {
        stripeConnectAccountId: {
          not: null
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        stripeConnectAccountId: true,
        stripeConnectOnboardingCompleted: true
      },
      orderBy: {
        email: 'asc'
      }
    });
    
    console.log(`📊 Totaal aantal users met Stripe Connect account: ${allUsersWithAccounts.length}`);
    console.log('');
    
    if (allUsersWithAccounts.length > 0) {
      // Categoriseer accounts
      const sandboxAccounts = [];
      const liveAccounts = [];
      const unknownAccounts = [];
      
      allUsersWithAccounts.forEach(user => {
        const accountId = user.stripeConnectAccountId;
        if (accountId && accountId.startsWith('acct_test_')) {
          sandboxAccounts.push(user);
        } else if (accountId && accountId.startsWith('acct_')) {
          liveAccounts.push(user);
        } else {
          unknownAccounts.push(user);
        }
      });
      
      console.log('📋 SANDBOX accounts (acct_test_):');
      console.log(`   Aantal: ${sandboxAccounts.length}`);
      if (sandboxAccounts.length > 0) {
        sandboxAccounts.forEach(user => {
          console.log(`   - ${user.email || user.name || user.username || user.id}`);
          console.log(`     Account ID: ${user.stripeConnectAccountId}`);
          console.log(`     Onboarding completed: ${user.stripeConnectOnboardingCompleted}`);
        });
      }
      console.log('');
      
      console.log('📋 LIVE accounts (acct_):');
      console.log(`   Aantal: ${liveAccounts.length}`);
      if (liveAccounts.length > 0) {
        liveAccounts.forEach(user => {
          console.log(`   - ${user.email || user.name || user.username || user.id}`);
          console.log(`     Account ID: ${user.stripeConnectAccountId}`);
          console.log(`     Onboarding completed: ${user.stripeConnectOnboardingCompleted}`);
        });
      }
      console.log('');
      
      if (unknownAccounts.length > 0) {
        console.log('📋 ONBEKENDE accounts:');
        console.log(`   Aantal: ${unknownAccounts.length}`);
        unknownAccounts.forEach(user => {
          console.log(`   - ${user.email || user.name || user.username || user.id}`);
          console.log(`     Account ID: ${user.stripeConnectAccountId}`);
          console.log(`     Onboarding completed: ${user.stripeConnectOnboardingCompleted}`);
        });
        console.log('');
      }
      
      // Check ook users met onboardingCompleted = true maar geen account ID
      const usersWithOnboardingButNoAccount = await prisma.user.findMany({
        where: {
          stripeConnectOnboardingCompleted: true,
          stripeConnectAccountId: null
        },
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          stripeConnectOnboardingCompleted: true
        }
      });
      
      if (usersWithOnboardingButNoAccount.length > 0) {
        console.log('⚠️  Users met onboardingCompleted = true maar GEEN account ID (mogelijk gereset):');
        console.log(`   Aantal: ${usersWithOnboardingButNoAccount.length}`);
        usersWithOnboardingButNoAccount.forEach(user => {
          console.log(`   - ${user.email || user.name || user.username || user.id}`);
        });
        console.log('');
      }
      
      // Check alle users die ooit een seller profile hebben gehad (hebben mogelijk Stripe Connect gebruikt)
      const usersWithSellerProfiles = await prisma.user.findMany({
        where: {
          SellerProfile: {
            isNot: null
          }
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
      
      const sellersWithoutAccount = usersWithSellerProfiles.filter(u => !u.stripeConnectAccountId);
      
      if (sellersWithoutAccount.length > 0) {
        console.log('📋 Sellers ZONDER Stripe Connect account (mogelijk sandbox accounts die al gereset zijn):');
        console.log(`   Aantal: ${sellersWithoutAccount.length}`);
        sellersWithoutAccount.forEach(user => {
          console.log(`   - ${user.email || user.name || user.username || user.id}`);
          console.log(`     Onboarding completed: ${user.stripeConnectOnboardingCompleted}`);
        });
        console.log('');
      }
    } else {
      console.log('✅ Geen users met Stripe Connect accounts gevonden');
    }
    
  } catch (error) {
    console.error('❌ Error tijdens check:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkStripeConnectAccounts()
  .then(() => {
    console.log('✅ Check voltooid');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Check gefaald:', error);
    process.exit(1);
  });

