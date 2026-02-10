const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addSocialOnboardingField() {
  try {
    // Add the field
    await prisma.$executeRaw`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS "socialOnboardingCompleted" BOOLEAN NOT NULL DEFAULT true;
    `;
    // Set existing users to completed
    await prisma.$executeRaw`
      UPDATE "User" 
      SET "socialOnboardingCompleted" = true 
      WHERE "socialOnboardingCompleted" IS NULL;
    `;
    // Users with temp_ usernames need onboarding
    await prisma.$executeRaw`
      UPDATE "User" 
      SET "socialOnboardingCompleted" = false 
      WHERE "username" LIKE 'temp_%';
    `;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addSocialOnboardingField();

