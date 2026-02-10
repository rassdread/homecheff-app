import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProductAPI() {
  try {
    // Find product
    const product = await prisma.product.findFirst({
      where: {
        title: {
          contains: 'pindasoep',
          mode: 'insensitive'
        }
      },
      include: {
        Image: {
          orderBy: { sortOrder: 'asc' }
        },
        seller: {
          select: {
            id: true,
            User: {
              select: {
                id: true,
                name: true,
                username: true
              }
            }
          }
        }
      }
    });

    if (!product) {
      console.log('Product not found');
      return;
    }

    console.log('=== Product Data ===');
    console.log(`ID: ${product.id}`);
    console.log(`Title: ${product.title}`);
    console.log(`isActive: ${product.isActive}`);
    console.log(`priceCents: ${product.priceCents}`);
    console.log(`Images: ${product.Image.length}`);
    product.Image.forEach((img, idx) => {
      console.log(`  Image ${idx}: ${img.fileUrl} (sortOrder: ${img.sortOrder})`);
    });
    console.log(`Seller ID: ${product.sellerId}`);
    console.log(`Seller User ID: ${product.seller?.User?.id}`);

    // Check what /api/seller/products returns
    console.log('\n=== Simulating /api/seller/products ===');
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: product.seller?.User?.id },
      select: { id: true }
    });

    if (sellerProfile) {
      const products = await prisma.product.findMany({
        where: { 
          sellerId: sellerProfile.id
        },
        include: {
          Image: {
            orderBy: { sortOrder: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      console.log(`Total products for seller: ${products.length}`);
      const pindasoep = products.find(p => p.id === product.id);
      if (pindasoep) {
        console.log('✅ Pindasoep found in API response');
        console.log(`  isActive: ${pindasoep.isActive}`);
        console.log(`  priceCents: ${pindasoep.priceCents}`);
        console.log(`  Images: ${pindasoep.Image.length}`);
      } else {
        console.log('❌ Pindasoep NOT found in API response');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductAPI();













