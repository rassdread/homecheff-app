const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function removeOldDishes() {
  try {
    // Find all Dish items
    const dishes = await prisma.dish.findMany({
      include: {
        photos: true
      }
    });
    dishes.forEach(dish => {
    });
    
    if (dishes.length > 0) {
      // Delete dish photos first
      for (const dish of dishes) {
        if (dish.photos && dish.photos.length > 0) {
          await prisma.dishPhoto.deleteMany({
            where: { dishId: dish.id }
          });
        }
      }
      
      // Delete dishes
      const deletedDishes = await prisma.dish.deleteMany({});
    } else {
    }
    
  } catch (error) {
    console.error('❌ Error removing old dishes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeOldDishes();

