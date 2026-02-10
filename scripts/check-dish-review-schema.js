// Script to check DishReview table schema
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSchema() {
  try {
    console.log('🔍 Checking DishReview table schema...');
    
    // Check column definition
    const result = await prisma.$queryRawUnsafe(`
      SELECT 
        column_name, 
        data_type, 
        column_default, 
        is_nullable,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'DishReview' AND column_name = 'updatedAt';
    `);
    
    console.log('📊 Column definition:');
    console.log(JSON.stringify(result, null, 2));
    
    // Try to create a test record with explicit updatedAt
    console.log('\n🧪 Testing create with explicit updatedAt...');
    try {
      const testReview = await prisma.dishReview.create({
        data: {
          dishId: '00000000-0000-0000-0000-000000000000', // Dummy ID
          reviewerId: '00000000-0000-0000-0000-000000000000', // Dummy ID
          rating: 5,
          comment: 'Test',
          updatedAt: new Date()
        }
      });
      console.log('✅ Test create succeeded!');
      // Clean up
      await prisma.dishReview.delete({ where: { id: testReview.id } });
    } catch (error) {
      console.error('❌ Test create failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error checking schema:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

