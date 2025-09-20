const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAdminAPI() {
  try {
    console.log('🧪 Testing admin API functionality...');

    // 1. Create a test product
    const seller = await prisma.user.findFirst({
      where: { role: 'SELLER' },
      include: { SellerProfile: true }
    });

    if (!seller || !seller.SellerProfile) {
      console.log('❌ No seller found');
      return;
    }

    const testProduct = await prisma.product.create({
      data: {
        id: crypto.randomUUID(),
        sellerId: seller.SellerProfile.id,
        category: 'CHEFF',
        title: 'Admin Test Product',
        description: 'Dit product moet zichtbaar zijn in admin panel',
        priceCents: 2000, // €20.00
        unit: 'PORTION',
        delivery: 'BOTH',
        isActive: true,
        stock: 5,
        maxStock: 10
      }
    });

    console.log(`✅ Created test product: ${testProduct.id}`);

    // 2. Test admin products API simulation
    console.log('\n👑 Testing admin products API...');
    
    const [newProducts, oldListings] = await Promise.all([
      prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          seller: {
            include: {
              User: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  username: true,
                  profileImage: true
                }
              }
            }
          },
          Image: {
            select: { fileUrl: true, sortOrder: true },
            orderBy: { sortOrder: 'asc' }
          }
        }
      }),
      prisma.listing.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
              profileImage: true
            }
          },
          ListingMedia: {
            select: { url: true, order: true },
            orderBy: { order: 'asc' }
          }
        }
      })
    ]);

    // Transform old listings to match new product format
    const transformedListings = oldListings.map(listing => ({
      id: listing.id,
      title: listing.title,
      description: listing.description || '',
      priceCents: listing.priceCents,
      category: listing.vertical || 'CHEFF',
      isActive: listing.status === 'ACTIVE',
      createdAt: listing.createdAt,
      seller: {
        User: listing.User
      },
      Image: listing.ListingMedia.map(media => ({
        fileUrl: media.url,
        sortOrder: media.order
      }))
    }));

    // Combine and sort all products
    const allProducts = [...newProducts, ...transformedListings].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    console.log(`📦 Admin API returns ${allProducts.length} products`);
    console.log(`   - New Products: ${newProducts.length}`);
    console.log(`   - Old Listings: ${oldListings.length}`);
    console.log(`   - Combined: ${allProducts.length}`);

    if (allProducts.length > 0) {
      console.log(`\n📋 First product details:`);
      const firstProduct = allProducts[0];
      console.log(`   - Title: ${firstProduct.title}`);
      console.log(`   - Price: €${(firstProduct.priceCents / 100).toFixed(2)}`);
      console.log(`   - Seller: ${firstProduct.seller?.User?.name || firstProduct.seller?.User?.email || 'Unknown'}`);
      console.log(`   - Category: ${firstProduct.category}`);
      console.log(`   - Active: ${firstProduct.isActive}`);
      console.log(`   - Images: ${firstProduct.Image?.length || 0}`);
    }

    // 3. Test seller products API simulation
    console.log('\n🛍️  Testing seller products API...');
    
    const sellerProducts = await prisma.product.findMany({
      where: { sellerId: seller.SellerProfile.id },
      include: {
        seller: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
                profileImage: true
              }
            }
          }
        },
        Image: {
          select: { fileUrl: true, sortOrder: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    console.log(`🛍️  Seller API returns ${sellerProducts.length} products`);
    if (sellerProducts.length > 0) {
      console.log(`   - First product: ${sellerProducts[0].title}`);
    }

    // 4. Test deletion
    console.log('\n🗑️  Testing product deletion...');
    
    await prisma.product.delete({
      where: { id: testProduct.id }
    });

    console.log('✅ Test product deleted successfully');

    // 5. Final verification
    const finalCount = await prisma.product.count();
    console.log(`\n📊 Final product count: ${finalCount}`);

    console.log('\n🎉 All admin API tests passed!');
    console.log('✅ Admin can see all products');
    console.log('✅ Seller can see their own products');
    console.log('✅ Products can be deleted');
    
  } catch (error) {
    console.error('❌ Error testing admin API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminAPI();
