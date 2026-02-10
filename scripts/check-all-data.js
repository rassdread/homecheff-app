const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔍 Checking ALL data in production...\n');
    
    // Check users
    const users = await prisma.user.count();
    const usersWithPassword = await prisma.user.findMany({
      where: { passwordHash: { not: null } },
      select: { email: true, role: true, passwordHash: true, createdAt: true }
    });
    
    // Check products
    const products = await prisma.product.count();
    const recentProducts = await prisma.product.findMany({
      take: 5,
      select: { title: true, createdAt: true, isActive: true },
      include: {
        seller: {
          select: {
            User: { select: { email: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Check sellers
    const sellers = await prisma.sellerProfile.count();
    
    console.log(`👥 Total users: ${users}`);
    console.log(`🔐 Users with password: ${usersWithPassword.length}`);
    console.log(`📦 Total products: ${products}`);
    console.log(`🏪 Total sellers: ${sellers}\n`);
    
    if (usersWithPassword.length > 0) {
      console.log('Users with passwords:');
      usersWithPassword.forEach(u => console.log(`  - ${u.email} (${u.role})`));
    }
    
    if (recentProducts.length > 0) {
      console.log('\n📦 Recent products:');
      recentProducts.forEach((p, i) => {
        console.log(`${i+1}. ${p.title}`);
        console.log(`   Seller: ${p.seller?.User?.email || 'unknown'}`);
        console.log(`   Created: ${p.createdAt.toISOString().split('T')[0]}`);
        console.log(`   Active: ${p.isActive}`);
      });
    }
    
    console.log('\n\n🎯 DIAGNOSE:');
    if (products > 0 && users <= 2) {
      console.log('✅ PRODUCTS ARE THERE!');
      console.log('❌ BUT: Users table is broken/lost');
      console.log('   Migrations likely cleared the users');
      console.log('   Products survived (linked to sellers)');
      console.log('\n💡 OPLOSSING:');
      console.log('   Need to restore user data without touching products');
      console.log('   Or create new user accounts');
    } else if (products === 0) {
      console.log('❌ NO products found');
      console.log('   Data is completely lost');
    } else {
      console.log('⚠️  Mixed situation');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
