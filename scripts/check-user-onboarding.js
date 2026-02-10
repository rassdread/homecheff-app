const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserOnboarding() {
  try {
    // Get your user email - replace with your actual email
    const userEmail = process.argv[2];
    
    if (!userEmail) {
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
      process.exit(1);
    }
    const hasTempUsername = user.username?.startsWith('temp_');
    const needsOnboarding = !user.socialOnboardingCompleted && hasTempUsername;
    
    if (needsOnboarding) {
    } else if (hasTempUsername && user.socialOnboardingCompleted) {
    } else if (!hasTempUsername && !user.socialOnboardingCompleted) {
    } else {
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserOnboarding();

