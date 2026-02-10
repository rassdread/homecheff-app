const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugProductRedirect() {
  try {
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
    products.forEach((product, index) => {
    });

    // Test API call for first product
    if (products.length > 0) {
      const testProduct = products[0];
      try {
        const response = await fetch(`http://localhost:3000/api/products/${testProduct.id}`);
        if (response.ok) {
          const data = await response.json();
        } else {
          const error = await response.text();
        }
      } catch (error) {
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugProductRedirect();

