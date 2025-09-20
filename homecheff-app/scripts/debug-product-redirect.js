const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugProductRedirect() {
  try {
    console.log('🔍 Debugging product redirect issue...\n');

    // Get all products
    const products = await prisma.product.findMany({
      take: 5,
      include: {
        seller: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true
              }
            }
          }
        }
      }
    });

    console.log(`📦 Found ${products.length} products:`);
    products.forEach((product, index) => {
      console.log(`${index + 1}. ID: ${product.id}`);
      console.log(`   Title: ${product.title}`);
      console.log(`   Seller: ${product.seller.User.name || product.seller.User.username}`);
      console.log(`   Seller Email: ${product.seller.User.email}`);
      console.log(`   Active: ${product.isActive}`);
      console.log('');
    });

    // Test API call for first product
    if (products.length > 0) {
      const testProduct = products[0];
      console.log(`🧪 Testing API call for product: ${testProduct.id}`);
      
      try {
        const response = await fetch(`http://localhost:3000/api/products/${testProduct.id}`);
        console.log(`   Status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ API call successful`);
          console.log(`   Title: ${data.title}`);
          console.log(`   User ID: ${data.User?.id}`);
        } else {
          const error = await response.text();
          console.log(`   ❌ API call failed: ${error}`);
        }
      } catch (error) {
        console.log(`   ❌ API call error: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugProductRedirect();
