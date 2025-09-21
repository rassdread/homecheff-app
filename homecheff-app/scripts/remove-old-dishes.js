const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function removeOldDishes() {
  try {
    console.log('🔍 Looking for old Dish items...');
    
    // Find all Dish items
    const dishes = await prisma.dish.findMany({
      include: {
        photos: true
      }
    });
    
    console.log(`Found ${dishes.length} Dish items:`);
    dishes.forEach(dish => {
      console.log(`- ${dish.title} (ID: ${dish.id})`);
    });
    
    if (dishes.length > 0) {
      console.log('\n🗑️  Removing old Dish items...');
      
      // Delete dish photos first
      for (const dish of dishes) {
        if (dish.photos && dish.photos.length > 0) {
          await prisma.dishPhoto.deleteMany({
            where: { dishId: dish.id }
          });
          console.log(`✅ Removed ${dish.photos.length} photos for "${dish.title}"`);
        }
      }
      
      // Delete dishes
      const deletedDishes = await prisma.dish.deleteMany({});
      console.log(`✅ Removed ${deletedDishes.count} Dish items`);
      
      console.log('🎉 All old Dish items removed successfully!');
    } else {
      console.log('✅ No old Dish items found');
    }
    
  } catch (error) {
    console.error('❌ Error removing old dishes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeOldDishes();



