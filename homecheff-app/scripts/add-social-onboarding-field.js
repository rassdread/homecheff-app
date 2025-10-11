const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addSocialOnboardingField() {
  try {
    console.log('🔄 Adding socialOnboardingCompleted field...');
    
    // Add the field
    await prisma.$executeRaw`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS "socialOnboardingCompleted" BOOLEAN NOT NULL DEFAULT true;
    `;
    
    console.log('✅ Field added successfully');
    
    // Set existing users to completed
    await prisma.$executeRaw`
      UPDATE "User" 
      SET "socialOnboardingCompleted" = true 
      WHERE "socialOnboardingCompleted" IS NULL;
    `;
    
    console.log('✅ Existing users marked as completed');
    
    // Users with temp_ usernames need onboarding
    await prisma.$executeRaw`
      UPDATE "User" 
      SET "socialOnboardingCompleted" = false 
      WHERE "username" LIKE 'temp_%';
    `;
    
    console.log('✅ Temp users marked as needing onboarding');
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addSocialOnboardingField();

