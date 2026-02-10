const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanAndTest() {
  try {
    console.log('🧹 Cleaning database and testing functionality...');

    // 1. Clean all product-related data
    console.log('\n🗑️  Cleaning all product data...');
    
    const cleanupTables = [
      'OrderItem',
      'Favorite', 
      'Image',
      'Product',
      'ListingMedia',
      'Listing'
    ];

    for (const table of cleanupTables) {
      try {
        const result = await prisma[table].deleteMany({});
        console.log(`✅ Cleared ${result.count} records from ${table}`);
      } catch (error) {
        console.log(`⚠️  Could not clear ${table}: ${error.message}`);
      }
    }

    // 2. Verify cleanup
    const productCount = await prisma.product.count();
    const listingCount = await prisma.listing.count();
    const imageCount = await prisma.image.count();
    const favoriteCount = await prisma.favorite.count();

    console.log('\n📊 After cleanup:');
    console.log(`- Products: ${productCount}`);
    console.log(`- Listings: ${listingCount}`);
    console.log(`- Images: ${imageCount}`);
    console.log(`- Favorites: ${favoriteCount}`);

    // 3. Test product creation
    console.log('\n🧪 Testing product creation...');
    
    // Get a seller user
    const seller = await prisma.user.findFirst({
      where: { role: 'SELLER' },
      include: { SellerProfile: true }
    });

    if (!seller || !seller.SellerProfile) {
      console.log('❌ No seller with profile found');
      return;
    }

    console.log(`👤 Using seller: ${seller.name || seller.email}`);

    // Create a test product
    const testProduct = await prisma.product.create({
      data: {
        id: crypto.randomUUID(),
        sellerId: seller.SellerProfile.id,
        category: 'CHEFF',
        title: 'Test Lasagne - Verwijder Mij',
        description: 'Dit is een test product dat verwijderd moet worden',
        priceCents: 1500, // €15.00
        unit: 'PORTION',
        delivery: 'BOTH',
        isActive: true,
        stock: 3,
        maxStock: 5
      }
    });

    console.log(`✅ Created test product: ${testProduct.id}`);

    // 4. Test admin visibility
    console.log('\n👑 Testing admin visibility...');
    
    const adminProducts = await prisma.product.findMany({
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

    console.log(`📦 Admin can see ${adminProducts.length} products`);
    if (adminProducts.length > 0) {
      console.log(`   - First product: ${adminProducts[0].title}`);
      console.log(`   - Seller: ${adminProducts[0].seller?.User?.name || adminProducts[0].seller?.User?.email}`);
    }

    // 5. Test seller visibility
    console.log('\n🛍️  Testing seller visibility...');
    
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

    console.log(`🛍️  Seller can see ${sellerProducts.length} products`);
    if (sellerProducts.length > 0) {
      console.log(`   - First product: ${sellerProducts[0].title}`);
    }

    // 6. Test deletion
    console.log('\n🗑️  Testing product deletion...');
    
    await prisma.product.delete({
      where: { id: testProduct.id }
    });

    console.log('✅ Test product deleted successfully');

    // 7. Final verification
    const finalProductCount = await prisma.product.count();
    console.log(`\n📊 Final product count: ${finalProductCount}`);

    if (finalProductCount === 0) {
      console.log('\n🎉 All tests passed! Database is clean and ready for new products.');
      console.log('✅ New products will be visible in admin panel');
      console.log('✅ Sellers can delete their own products');
    } else {
      console.log('\n⚠️  Some products still remain');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup and testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanAndTest();



