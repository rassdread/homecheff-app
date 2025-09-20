const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testProductRedirect() {
  try {
    console.log('🧪 Testing product redirect issue...\n');

    // Get a product ID from the database
    const product = await prisma.product.findFirst({
      where: { isActive: true },
      select: { id: true, title: true }
    });

    if (!product) {
      console.log('❌ No products found in database');
      return;
    }

    console.log(`📦 Testing with product: ${product.title} (${product.id})`);

    // Test the API call
    try {
      const response = await fetch(`http://localhost:3000/api/products/${product.id}`);
      console.log(`📡 API Response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Response successful');
        console.log('📦 Product data structure:');
        console.log('  - id:', data.id);
        console.log('  - title:', data.title);
        console.log('  - User:', data.User);
        console.log('  - photos:', data.photos);
        console.log('  - displayNameType:', data.displayNameType);
        
        // Check if the data structure is correct
        if (!data.User) {
          console.log('❌ Missing User data in API response');
        }
        if (!data.title) {
          console.log('❌ Missing title in API response');
        }
        if (!data.id) {
          console.log('❌ Missing id in API response');
        }
      } else {
        const error = await response.text();
        console.log(`❌ API call failed: ${error}`);
      }
    } catch (error) {
      console.log(`❌ API call error: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProductRedirect();
