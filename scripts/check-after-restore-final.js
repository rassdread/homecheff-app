const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔍 Final check after restore to 17:00 PM...\n');
    
    const users = await prisma.user.findMany({
      select: { email: true, role: true, createdAt: true, name: true },
      orderBy: { createdAt: 'desc' }
    });
    
    const products = await prisma.product.count();
    const sellers = await prisma.sellerProfile.count();
    
    console.log(`👥 Users: ${users.length}`);
    console.log(`📦 Products: ${products}`);
    console.log(`🏪 Sellers: ${sellers}\n`);
    
    if (users.length > 2) {
      console.log('✅✅✅ DATA IS TERUG! 🎉\n');
      console.log('Sample users:');
      users.slice(0, 5).forEach((u, i) => {
        console.log(`${i+1}. ${u.email} - ${u.role} - ${u.createdAt.toISOString().split('T')[0]}`);
      });
    } else {
      console.log('❌ Nog steeds geen data');
      console.log('   Misschien is verkeerde timestamp');
      console.log('   Of data verloren voor 17:00');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();

