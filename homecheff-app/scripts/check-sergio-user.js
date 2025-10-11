const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSergioUser() {
  try {
    console.log('🔍 Checking Sergio Arrias user data...\n');

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: 'r.sergioarrias@gmail.com' },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        sellerRoles: true,
        buyerRoles: true,
        interests: true,
        socialOnboardingCompleted: true,
        name: true,
        createdAt: true,
        SellerProfile: {
          select: {
            id: true,
            displayName: true,
            deliveryMode: true,
            deliveryRadius: true,
            companyName: true,
            kvk: true,
            btw: true
          }
        }
      }
    });

    if (!user) {
      console.log('❌ User not found with email: r.sergioarrias@gmail.com');
      return;
    }

    console.log('👤 User Found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Seller Roles: ${JSON.stringify(user.sellerRoles)}`);
    console.log(`   Buyer Roles: ${JSON.stringify(user.buyerRoles)}`);
    console.log(`   Interests: ${JSON.stringify(user.interests)}`);
    console.log(`   Social Onboarding Completed: ${user.socialOnboardingCompleted}`);
    console.log(`   Created At: ${user.createdAt}`);
    console.log('');

    if (user.SellerProfile) {
      console.log('🏪 Seller Profile Found:');
      console.log(`   ID: ${user.SellerProfile.id}`);
      console.log(`   Display Name: ${user.SellerProfile.displayName}`);
      console.log(`   Company Name: ${user.SellerProfile.companyName}`);
      console.log(`   KVK: ${user.SellerProfile.kvk}`);
      console.log(`   BTW: ${user.SellerProfile.btw}`);
      console.log(`   Delivery Mode: ${user.SellerProfile.deliveryMode}`);
      console.log(`   Delivery Radius: ${user.SellerProfile.deliveryRadius}`);
    } else {
      console.log('❌ No Seller Profile found');
    }

    console.log('');
    console.log('📊 Analysis:');
    
    if (user.sellerRoles && user.sellerRoles.length > 0) {
      console.log(`✅ Has seller roles: ${user.sellerRoles.join(', ')}`);
    } else {
      console.log('❌ No seller roles assigned');
    }

    if (user.role === 'SELLER') {
      console.log('✅ Main role is SELLER');
    } else {
      console.log(`❌ Main role is ${user.role} (should be SELLER)`);
    }

    if (user.SellerProfile) {
      console.log('✅ Has SellerProfile');
    } else {
      console.log('❌ Missing SellerProfile');
    }

    if (user.socialOnboardingCompleted) {
      console.log('✅ Social onboarding completed');
    } else {
      console.log('❌ Social onboarding not completed');
    }

  } catch (error) {
    console.error('❌ Error checking user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSergioUser();
