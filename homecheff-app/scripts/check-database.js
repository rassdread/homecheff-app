const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('🔍 Checking database contents...');
  
  try {
    // Check users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    console.log(`\n👥 Users (${users.length}):`);
    users.forEach(user => {
      console.log(`  - ${user.name || 'No name'} (${user.email}) - ${user.role} - ${user.createdAt.toISOString().split('T')[0]}`);
    });

    // Check products
    const products = await prisma.product.findMany({
      select: {
        id: true,
        title: true,
        category: true,
        priceCents: true,
        isActive: true,
        createdAt: true,
        seller: {
          select: {
            User: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });
    console.log(`\n🍽️ Products (${products.length}):`);
    products.forEach(product => {
      console.log(`  - ${product.title} (${product.category}) - €${(product.priceCents/100).toFixed(2)} - ${product.isActive ? 'Active' : 'Inactive'} - Seller: ${product.seller?.User?.name || 'No seller'}`);
    });

    // Check seller profiles
    const sellers = await prisma.sellerProfile.findMany({
      select: {
        id: true,
        displayName: true,
        User: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    console.log(`\n🏪 Seller Profiles (${sellers.length}):`);
    sellers.forEach(seller => {
      console.log(`  - ${seller.displayName || 'No name'} - User: ${seller.User?.name || 'No user'} (${seller.User?.email})`);
    });

  } catch (error) {
    console.error('❌ Error checking database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase()
  .then(() => {
    console.log('\n✅ Database check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database check failed:', error);
    process.exit(1);
  });
