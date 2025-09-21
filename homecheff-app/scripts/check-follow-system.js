const { PrismaClient } = require('@prisma/client');

async function checkFollowSystem() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== Checking Follow System ===');
    
    // Check if Follow table exists
    try {
      const followCount = await prisma.follow.count();
      console.log('✅ Follow table exists with', followCount, 'records');
    } catch (e) {
      console.log('❌ Follow table error:', e.message);
    }
    
    // Check if Favorite table exists
    try {
      const favoriteCount = await prisma.favorite.count();
      console.log('✅ Favorite table exists with', favoriteCount, 'records');
    } catch (e) {
      console.log('❌ Favorite table error:', e.message);
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
      console.log('📋 Sample follows:', follows);
    } catch (e) {
      console.log('❌ Follow query error:', e.message);
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
      console.log('📋 Sample favorites:', favorites);
    } catch (e) {
      console.log('❌ Favorite query error:', e.message);
    }
    
    // Check users
    const userCount = await prisma.user.count();
    console.log('👥 Total users:', userCount);
    
    // Check products
    const productCount = await prisma.product.count();
    console.log('🛍️ Total products:', productCount);
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkFollowSystem();


