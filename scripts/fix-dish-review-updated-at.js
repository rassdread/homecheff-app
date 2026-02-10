// Script to fix updatedAt column in DishReview table
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixUpdatedAt() {
  try {
    console.log('🔧 Fixing updatedAt column in DishReview table...');
    
    // Execute SQL to set default value
    await prisma.$executeRawUnsafe(`
      ALTER TABLE IF EXISTS "DishReview" 
      ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
    `);
    
    console.log('✅ Set default value for updatedAt');
    
    // Ensure NOT NULL
    await prisma.$executeRawUnsafe(`
      ALTER TABLE IF EXISTS "DishReview" 
      ALTER COLUMN "updatedAt" SET NOT NULL;
    `);
    
    console.log('✅ Set NOT NULL constraint');
    
    // Update any existing NULL values
    const result = await prisma.$executeRawUnsafe(`
      UPDATE "DishReview" 
      SET "updatedAt" = COALESCE("createdAt", CURRENT_TIMESTAMP) 
      WHERE "updatedAt" IS NULL;
    `);
    
    console.log(`✅ Updated ${result} rows with NULL updatedAt`);
    
    console.log('✅ All fixes applied successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing updatedAt:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixUpdatedAt()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });




























