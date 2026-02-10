const { PrismaClient } = require('@prisma/client');

async function checkFollowSystem() {
  const prisma = new PrismaClient();
  
  try {
    // Check if Follow table exists
    try {
      const followCount = await prisma.follow.count();
    } catch (e) {
    }
    
    // Check if Favorite table exists
    try {
      const favoriteCount = await prisma.favorite.count();
    } catch (e) {
    }
    
    // Check existing follows
    try {
      const follows = await prisma.follow.findMany({
        take: 3,
        include: {
          User: { select: { id: true, name: true } },
          Seller: { select: { id: true, name: true } }
        }
      });
    } catch (e) {
    }
    
    // Check existing favorites
    try {
      const favorites = await prisma.favorite.findMany({
        take: 3,
        include: {
          User: { select: { id: true, name: true } },
          Product: { select: { id: true, title: true } }
        }
      });
    } catch (e) {
    }
    
    // Check users
    const userCount = await prisma.user.count();
    // Check products
    const productCount = await prisma.product.count();
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkFollowSystem();

