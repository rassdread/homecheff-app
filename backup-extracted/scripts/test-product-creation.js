const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testProductCreation() {
  try {
    console.log('🧪 Testing product creation and management...');

    // First, check if we have any users
    const userCount = await prisma.user.count();
    console.log(`👥 Total users: ${userCount}`);

    if (userCount === 0) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }

    // Get the first user
    const user = await prisma.user.findFirst({
      where: { role: 'SELLER' },
      include: { SellerProfile: true }
    });

    if (!user) {
      console.log('❌ No seller users found. Please create a seller account first.');
      return;
    }

    console.log(`👤 Using seller: ${user.name || user.email}`);

    // Create a test product
    const testProduct = await prisma.product.create({
      data: {
        sellerId: user.SellerProfile?.id || 'test-seller-id',
        category: 'CHEFF',
        title: 'Test Product - Lasagne',
        description: 'Een heerlijke lasagne voor test doeleinden',
        priceCents: 1250, // €12.50
        unit: 'PORTION',
        delivery: 'BOTH',
        isActive: true,
        stock: 5,
        maxStock: 10
      }
    });

    console.log(`✅ Created test product: ${testProduct.id}`);

    // Test admin product fetch
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

    // Test seller product fetch
    const sellerProducts = await prisma.product.findMany({
      where: { sellerId: user.SellerProfile?.id || 'test-seller-id' },
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

    // Test deletion
    await prisma.product.delete({
      where: { id: testProduct.id }
    });

    console.log('🗑️  Test product deleted successfully');

    console.log('\n✅ All tests passed! Product creation and management is working correctly.');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProductCreation();



