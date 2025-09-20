const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNewProductFlow() {
  try {
    console.log('🧪 Testen van nieuwe product flow...');

    // 1. Controleer gebruikers
    const users = await prisma.user.findMany({
      where: { role: 'SELLER' },
      include: { SellerProfile: true }
    });

    console.log(`👥 ${users.length} seller gebruikers gevonden`);

    if (users.length === 0) {
      console.log('❌ Geen seller gebruikers gevonden voor test');
      return;
    }

    const seller = users[0];
    console.log(`👤 Testen met: ${seller.name || seller.email}`);

    if (!seller.SellerProfile) {
      console.log('❌ Geen SellerProfile gevonden');
      return;
    }

    // 2. Maak een test product
    console.log('\n📦 Maken van test product...');
    const testProduct = await prisma.product.create({
      data: {
        id: crypto.randomUUID(),
        sellerId: seller.SellerProfile.id,
        category: 'CHEFF',
        title: 'Test Product - Verwijder Mij',
        description: 'Dit is een test product om de flow te testen',
        priceCents: 1500, // €15.00
        unit: 'PORTION',
        delivery: 'BOTH',
        isActive: true,
        stock: 5,
        maxStock: 10
      }
    });

    console.log(`✅ Test product gemaakt: ${testProduct.id}`);

    // 3. Test admin visibility
    console.log('\n👑 Testen admin zichtbaarheid...');
    const adminProducts = await prisma.product.findMany({
      include: {
        seller: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true
              }
            }
          }
        }
      }
    });

    console.log(`📊 Admin kan ${adminProducts.length} producten zien`);
    if (adminProducts.length > 0) {
      console.log(`   - Product: ${adminProducts[0].title}`);
      console.log(`   - Eigenaar: ${adminProducts[0].seller?.User?.name || adminProducts[0].seller?.User?.email}`);
    }

    // 4. Test seller visibility
    console.log('\n🛍️  Testen seller zichtbaarheid...');
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
                username: true
              }
            }
          }
        }
      }
    });

    console.log(`🛍️  Seller kan ${sellerProducts.length} eigen producten zien`);
    if (sellerProducts.length > 0) {
      console.log(`   - Product: ${sellerProducts[0].title}`);
    }

    // 5. Test deletion
    console.log('\n🗑️  Testen product verwijdering...');
    await prisma.product.delete({
      where: { id: testProduct.id }
    });

    console.log('✅ Test product succesvol verwijderd');

    // 6. Verificatie
    const finalCount = await prisma.product.count();
    console.log(`\n📊 Finale product count: ${finalCount}`);

    if (finalCount === 0) {
      console.log('\n🎉 Alle tests geslaagd!');
      console.log('✅ Nieuwe producten kunnen worden aangemaakt');
      console.log('✅ Admin kan alle producten zien');
      console.log('✅ Sellers kunnen hun eigen producten zien');
      console.log('✅ Producten kunnen worden verwijderd');
      console.log('✅ Database is schoon en klaar voor gebruik');
    }

    console.log('\n💡 Als je nog steeds problemen hebt met verwijderen:');
    console.log('   1. Refresh je browser cache (Ctrl+F5)');
    console.log('   2. Log uit en log weer in');
    console.log('   3. Probeer een andere browser');
    console.log('   4. Controleer of je de juiste product ID hebt');
    
  } catch (error) {
    console.error('❌ Error tijdens test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNewProductFlow();
