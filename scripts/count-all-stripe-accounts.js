const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function countAllStripeAccounts() {
  console.log('📊 Totaal overzicht van alle Stripe Connect accounts...');
  console.log('');
  
  try {
    // Totaal aantal users met een Stripe Connect account ID
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
    
    console.log(`📊 TOTAAL aantal users met Stripe Connect account: ${allUsersWithAccounts.length}`);
    console.log('');
    
    // Categoriseer
    const sandboxAccounts = [];
    const liveAccounts = [];
    
    allUsersWithAccounts.forEach(user => {
      const accountId = user.stripeConnectAccountId;
      if (accountId && accountId.startsWith('acct_test_')) {
        sandboxAccounts.push(user);
      } else if (accountId && accountId.startsWith('acct_')) {
        liveAccounts.push(user);
      }
    });
    
    console.log(`🔴 SANDBOX accounts (acct_test_): ${sandboxAccounts.length}`);
    console.log(`🟢 LIVE accounts (acct_): ${liveAccounts.length}`);
    console.log('');
    
    // Totaal aantal sellers (met of zonder account)
    const allSellers = await prisma.user.findMany({
      where: {
        SellerProfile: {
          isNot: null
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        stripeConnectAccountId: true,
        stripeConnectOnboardingCompleted: true
      }
    });
    
    console.log(`👥 TOTAAL aantal sellers: ${allSellers.length}`);
    
    const sellersWithAccount = allSellers.filter(s => s.stripeConnectAccountId);
    const sellersWithoutAccount = allSellers.filter(s => !s.stripeConnectAccountId);
    
    console.log(`   - Sellers MET Stripe Connect account: ${sellersWithAccount.length}`);
    console.log(`   - Sellers ZONDER Stripe Connect account: ${sellersWithoutAccount.length}`);
    console.log('');
    
    // Details van alle accounts
    if (allUsersWithAccounts.length > 0) {
      console.log('📋 DETAILS van alle Stripe Connect accounts:');
      console.log('');
      
      allUsersWithAccounts.forEach((user, index) => {
        const accountId = user.stripeConnectAccountId;
        const isSandbox = accountId && accountId.startsWith('acct_test_');
        const accountType = isSandbox ? '🔴 SANDBOX' : '🟢 LIVE';
        
        console.log(`${index + 1}. ${accountType}`);
        console.log(`   Naam: ${user.name || 'Geen naam'}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Username: ${user.username || 'Geen username'}`);
        console.log(`   Account ID: ${accountId}`);
        console.log(`   Onboarding Completed: ${user.stripeConnectOnboardingCompleted}`);
        console.log('');
      });
    }
    
    // Sellers zonder account
    if (sellersWithoutAccount.length > 0) {
      console.log('📋 SELLERS ZONDER Stripe Connect account:');
      console.log('');
      sellersWithoutAccount.forEach((seller, index) => {
        console.log(`${index + 1}. ${seller.name || 'Geen naam'}`);
        console.log(`   Email: ${seller.email}`);
        console.log(`   Username: ${seller.username || 'Geen username'}`);
        console.log(`   Onboarding Completed: ${seller.stripeConnectOnboardingCompleted}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error tijdens count:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

countAllStripeAccounts()
  .then(() => {
    console.log('✅ Check voltooid');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Check gefaald:', error);
    process.exit(1);
  });















