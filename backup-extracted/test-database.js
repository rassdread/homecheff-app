// Test database connectie en producten
const { PrismaClient } = require('@prisma/client');

async function testDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    const userCount = await prisma.user.count();
    console.log('✅ Database connected! Users:', userCount);
    
    // Test products
    const productCount = await prisma.product.count();
    console.log('📦 Total products:', productCount);
    
    const activeProducts = await prisma.product.count({
      where: { isActive: true }
    });
    console.log('✅ Active products:', activeProducts);
    
    // Test some products
    const products = await prisma.product.findMany({
      where: { isActive: true },
      take: 5,
      select: {
        id: true,
        title: true,
        priceCents: true,
        createdAt: true,
        seller: {
          select: {
            User: {
              select: {
                username: true,
                name: true
              }
            }
          }
        }
      }
    });
    
    console.log('📋 Sample products:');
    products.forEach((p, i) => {
      console.log(`${i + 1}. ${p.title} - €${(p.priceCents / 100).toFixed(2)} by ${p.seller?.User?.username || 'Unknown'}`);
    });
    
    // Test images
    const imageCount = await prisma.image.count();
    console.log('🖼️ Total images:', imageCount);
    
    const productImages = await prisma.image.count({
      where: { productId: { not: null } }
    });
    console.log('📸 Product images:', productImages);
    
    return true;
  } catch (error) {
    console.error('❌ Database error:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();








