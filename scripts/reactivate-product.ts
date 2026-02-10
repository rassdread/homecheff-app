import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function reactivateProduct() {
  try {
    // Find product by title containing "pindasoep" (case insensitive)
    const products = await prisma.product.findMany({
      where: {
        title: {
          contains: 'pindasoep',
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        title: true,
        isActive: true,
        priceCents: true,
        stock: true,
        createdAt: true,
        seller: {
          select: {
            id: true,
            User: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true
              }
            }
          }
        },
        orderItems: {
          select: {
            id: true,
            Order: {
              select: {
                id: true,
                stripeSessionId: true,
                createdAt: true
              }
            }
          }
        }
      }
    });

    console.log(`Found ${products.length} product(s) matching "pindasoep":\n`);

    for (const product of products) {
      console.log(`Product ID: ${product.id}`);
      console.log(`Title: ${product.title}`);
      console.log(`isActive: ${product.isActive}`);
      console.log(`Price: €${(product.priceCents / 100).toFixed(2)}`);
      console.log(`Stock: ${product.stock}`);
      console.log(`Seller: ${product.seller?.User?.name || product.seller?.User?.username || 'Unknown'}`);
      console.log(`Orders: ${product.orderItems.length}`);
      console.log(`Created: ${product.createdAt}`);
      console.log('---\n');

      if (!product.isActive) {
        console.log(`Reactivating product ${product.id}...`);
        await prisma.product.update({
          where: { id: product.id },
          data: { isActive: true }
        });
        console.log(`✅ Product reactivated!\n`);
      } else {
        console.log(`Product is already active.\n`);
      }
    }

    if (products.length === 0) {
      console.log('No products found matching "pindasoep".');
      console.log('Searching for all inactive products with price...');
      
      const inactiveProducts = await prisma.product.findMany({
        where: {
          isActive: false,
          priceCents: { gt: 0 }
        },
        include: {
          seller: {
            include: {
              User: {
                select: {
                  name: true,
                  username: true
                }
              }
            }
          }
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
      });

      console.log(`\nFound ${inactiveProducts.length} inactive products with price:`);
      for (const p of inactiveProducts) {
        console.log(`- ${p.title} (ID: ${p.id}, Price: €${(p.priceCents / 100).toFixed(2)})`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

reactivateProduct();

