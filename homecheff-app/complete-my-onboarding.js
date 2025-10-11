const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function completeOnboarding() {
  try {
    const email = 'r.sergioarrias@gmail.com'; // Your email
    
    console.log('🔧 Completing onboarding for:', email);
    
    const user = await prisma.user.update({
      where: { email },
      data: {
        username: 'sergioarrias', // Change this to your preferred username
        socialOnboardingCompleted: true,
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        privacyPolicyAccepted: true,
        privacyPolicyAcceptedAt: new Date(),
        role: 'BUYER', // or 'SELLER' if you want
        buyerRoles: ['ontdekker'], // Default buyer type
      },
      select: {
        id: true,
        email: true,
        username: true,
        socialOnboardingCompleted: true,
      }
    });
    
    console.log('✅ Onboarding completed!');
    console.log('New username:', user.username);
    console.log('socialOnboardingCompleted:', user.socialOnboardingCompleted);
    console.log('\n🎉 Now log out and log in again to refresh your session!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

completeOnboarding();

