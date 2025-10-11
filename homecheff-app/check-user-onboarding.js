const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserOnboarding() {
  try {
    // Get your user email - replace with your actual email
    const userEmail = process.argv[2];
    
    if (!userEmail) {
      console.log('❌ Please provide your email as argument');
      console.log('Usage: node check-user-onboarding.js your@email.com');
      process.exit(1);
    }
    
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        socialOnboardingCompleted: true,
        termsAccepted: true,
        privacyPolicyAccepted: true,
        role: true,
        createdAt: true
      }
    });
    
    if (!user) {
      console.log('❌ User not found with email:', userEmail);
      process.exit(1);
    }
    
    console.log('\n📋 User Onboarding Status:\n');
    console.log('Email:', user.email);
    console.log('Username:', user.username);
    console.log('Name:', user.name);
    console.log('Role:', user.role);
    console.log('\n🔍 Onboarding Checks:');
    console.log('socialOnboardingCompleted:', user.socialOnboardingCompleted ? '✅ true' : '❌ false');
    console.log('Has temp username:', user.username?.startsWith('temp_') ? '⚠️ YES' : '✅ NO');
    console.log('termsAccepted:', user.termsAccepted ? '✅ true' : '❌ false');
    console.log('privacyPolicyAccepted:', user.privacyPolicyAccepted ? '✅ true' : '❌ false');
    
    console.log('\n🎯 Final Status:');
    const hasTempUsername = user.username?.startsWith('temp_');
    const needsOnboarding = !user.socialOnboardingCompleted && hasTempUsername;
    
    if (needsOnboarding) {
      console.log('❌ User NEEDS onboarding');
      console.log('   → Should see onboarding form');
    } else if (hasTempUsername && user.socialOnboardingCompleted) {
      console.log('⚠️ INCONSISTENT STATE: User has completed onboarding but still has temp username');
      console.log('   → Need to fix database');
    } else if (!hasTempUsername && !user.socialOnboardingCompleted) {
      console.log('⚠️ INCONSISTENT STATE: User has real username but onboarding not marked complete');
      console.log('   → Need to fix database');
    } else {
      console.log('✅ User onboarding is COMPLETE');
      console.log('   → Should redirect to home');
    }
    
    console.log('\n📅 Account created:', user.createdAt);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserOnboarding();

