const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Database controle...\n');

    // Check users
    const userCount = await prisma.user.count();
    console.log(`👥 Totaal aantal gebruikers: ${userCount}`);

    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          sellerRoles: true,
          buyerRoles: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      console.log('\n📋 Laatste 10 gebruikers:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name || 'Geen naam'} (${user.email})`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Seller Roles: ${user.sellerRoles.join(', ') || 'Geen'}`);
        console.log(`   Buyer Roles: ${user.buyerRoles.join(', ') || 'Geen'}`);
        console.log(`   Aangemaakt: ${user.createdAt.toLocaleDateString('nl-NL')}`);
        console.log('');
      });
    }

    // Check seller profiles
    const sellerProfileCount = await prisma.sellerProfile.count();
    console.log(`🏪 Aantal seller profielen: ${sellerProfileCount}`);

    // Check delivery profiles
    const deliveryProfileCount = await prisma.deliveryProfile.count();
    console.log(`🚚 Aantal delivery profielen: ${deliveryProfileCount}`);

    // Check products
    const productCount = await prisma.product.count();
    console.log(`📦 Aantal producten: ${productCount}`);

    // Check workspace content
    const workspaceContentCount = await prisma.workspaceContent.count();
    console.log(`💼 Aantal workspace content items: ${workspaceContentCount}`);

    // Check orders
    const orderCount = await prisma.order.count();
    console.log(`🛒 Aantal orders: ${orderCount}`);

    console.log('\n✅ Database controle voltooid!');

  } catch (error) {
    console.error('❌ Fout bij database controle:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();













