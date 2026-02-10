const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Helper om te detecteren of een Stripe ID test/sandbox is
function isStripeTestId(id) {
  if (!id) return false;
  return id.startsWith('acct_test_') || 
         id.startsWith('cs_test_') || 
         id.startsWith('pi_test_') || 
         id.startsWith('tr_test_') ||
         id.startsWith('ch_test_') ||
         id.startsWith('evt_test_');
}

async function resetDorpspleinAndSandbox() {
  console.log('🧹 Starting reset of dorpsplein and Stripe sandbox data...');
  console.log('');
  
  try {
    // ============================================
    // STAP 1: Verwijder alle sandbox verkoopdata
    // ============================================
    console.log('📦 STAP 1: Verwijderen van sandbox verkoopdata...');
    
    // 1.1 Vind alle sandbox orders (orders met cs_test_ session IDs)
    const sandboxOrders = await prisma.order.findMany({
      where: {
        stripeSessionId: {
          startsWith: 'cs_test_'
        }
      },
      select: {
        id: true,
        orderNumber: true
      }
    });
    
    console.log(`   📋 Gevonden ${sandboxOrders.length} sandbox orders`);
    
    if (sandboxOrders.length > 0) {
      const orderIds = sandboxOrders.map(o => o.id);
      
      // 1.2 Verwijder order items van sandbox orders
      const deletedOrderItems = await prisma.orderItem.deleteMany({
        where: {
          orderId: { in: orderIds }
        }
      });
      console.log(`   ✅ Verwijderd ${deletedOrderItems.count} order items`);
      
      // 1.3 Verwijder delivery orders van sandbox orders
      const deletedDeliveryOrders = await prisma.deliveryOrder.deleteMany({
        where: {
          orderId: { in: orderIds }
        }
      });
      console.log(`   ✅ Verwijderd ${deletedDeliveryOrders.count} delivery orders`);
      
      // 1.4 Verwijder conversations van sandbox orders
      const deletedConversations = await prisma.conversation.deleteMany({
        where: {
          orderId: { in: orderIds }
        }
      });
      console.log(`   ✅ Verwijderd ${deletedConversations.count} conversations`);
      
      // 1.5 Verwijder product reviews van sandbox orders
      const deletedReviews = await prisma.productReview.deleteMany({
        where: {
          orderId: { in: orderIds }
        }
      });
      console.log(`   ✅ Verwijderd ${deletedReviews.count} product reviews`);
      
      // 1.6 Verwijder stock reservations met sandbox session IDs
      const deletedStockReservations = await prisma.stockReservation.deleteMany({
        where: {
          stripeSessionId: {
            startsWith: 'cs_test_'
          }
        }
      });
      console.log(`   ✅ Verwijderd ${deletedStockReservations.count} stock reservations`);
      
      // 1.7 Verwijder transactions met sandbox provider refs
      const deletedTransactions = await prisma.transaction.deleteMany({
        where: {
          OR: [
            { providerRef: { startsWith: 'cs_test_' } },
            { providerRef: { startsWith: 'pi_test_' } },
            { providerRef: { startsWith: 'ch_test_' } }
          ]
        }
      });
      console.log(`   ✅ Verwijderd ${deletedTransactions.count} transactions`);
      
      // 1.8 Verwijder payouts met sandbox provider refs
      const deletedPayouts = await prisma.payout.deleteMany({
        where: {
          providerRef: {
            startsWith: 'tr_test_'
          }
        }
      });
      console.log(`   ✅ Verwijderd ${deletedPayouts.count} payouts`);
      
      // 1.9 Verwijder refunds met sandbox provider refs
      const deletedRefunds = await prisma.refund.deleteMany({
        where: {
          providerRef: {
            startsWith: 're_test_'
          }
        }
      });
      console.log(`   ✅ Verwijderd ${deletedRefunds.count} refunds`);
      
      // 1.10 Verwijder de sandbox orders zelf
      const deletedOrders = await prisma.order.deleteMany({
        where: {
          id: { in: orderIds }
        }
      });
      console.log(`   ✅ Verwijderd ${deletedOrders.count} sandbox orders`);
    }
    
    console.log('');
    
    // ============================================
    // STAP 2: Verwijder alle dorpsplein producten
    // ============================================
    console.log('🛒 STAP 2: Verwijderen van alle dorpsplein producten...');
    
    // 2.1 Vind alle producten met prijzen (dorpsplein producten)
    const dorpspleinProducts = await prisma.product.findMany({
      where: {
        priceCents: {
          gt: 0
        }
      },
      select: {
        id: true,
        title: true,
        priceCents: true
      }
    });
    
    console.log(`   📋 Gevonden ${dorpspleinProducts.length} dorpsplein producten`);
    
    if (dorpspleinProducts.length > 0) {
      const productIds = dorpspleinProducts.map(p => p.id);
      
      // 2.2 Verwijder product images
      const deletedImages = await prisma.image.deleteMany({
        where: {
          productId: { in: productIds }
        }
      });
      console.log(`   ✅ Verwijderd ${deletedImages.count} product images`);
      
      // 2.3 Verwijder product favorites
      const deletedFavorites = await prisma.favorite.deleteMany({
        where: {
          productId: { in: productIds }
        }
      });
      console.log(`   ✅ Verwijderd ${deletedFavorites.count} product favorites`);
      
      // 2.4 Verwijder product reviews (die niet al verwijderd zijn)
      const deletedProductReviews = await prisma.productReview.deleteMany({
        where: {
          productId: { in: productIds }
        }
      });
      console.log(`   ✅ Verwijderd ${deletedProductReviews.count} product reviews`);
      
      // 2.5 Verwijder order items (die niet al verwijderd zijn)
      const deletedProductOrderItems = await prisma.orderItem.deleteMany({
        where: {
          productId: { in: productIds }
        }
      });
      console.log(`   ✅ Verwijderd ${deletedProductOrderItems.count} order items`);
      
      // 2.6 Verwijder stock reservations
      const deletedProductStockReservations = await prisma.stockReservation.deleteMany({
        where: {
          productId: { in: productIds }
        }
      });
      console.log(`   ✅ Verwijderd ${deletedProductStockReservations.count} stock reservations`);
      
      // 2.7 Verwijder conversations gekoppeld aan producten
      const deletedProductConversations = await prisma.conversation.deleteMany({
        where: {
          productId: { in: productIds }
        }
      });
      console.log(`   ✅ Verwijderd ${deletedProductConversations.count} product conversations`);
      
      // 2.8 Verwijder delivery orders gekoppeld aan producten
      const deletedProductDeliveryOrders = await prisma.deliveryOrder.deleteMany({
        where: {
          productId: { in: productIds }
        }
      });
      console.log(`   ✅ Verwijderd ${deletedProductDeliveryOrders.count} product delivery orders`);
      
      // 2.9 Verwijder de producten zelf
      const deletedProducts = await prisma.product.deleteMany({
        where: {
          id: { in: productIds }
        }
      });
      console.log(`   ✅ Verwijderd ${deletedProducts.count} dorpsplein producten`);
    }
    
    console.log('');
    
    // ============================================
    // STAP 3: Reset ALLE Stripe Connect accounts (sandbox + live)
    // ============================================
    console.log('💳 STAP 3: Resetten van ALLE Stripe Connect accounts (sandbox + live)...');
    
    // 3.1 Vind alle users met Stripe Connect accounts (zowel sandbox als live)
    const usersWithSandboxAccounts = await prisma.user.findMany({
      where: {
        stripeConnectAccountId: {
          startsWith: 'acct_test_'
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        stripeConnectAccountId: true
      }
    });
    
    const usersWithLiveAccounts = await prisma.user.findMany({
      where: {
        stripeConnectAccountId: {
          startsWith: 'acct_',
          not: {
            startsWith: 'acct_test_'
          }
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        stripeConnectAccountId: true
      }
    });
    
    console.log(`   📋 Gevonden ${usersWithSandboxAccounts.length} users met sandbox Stripe Connect accounts`);
    console.log(`   📋 Gevonden ${usersWithLiveAccounts.length} users met live Stripe Connect accounts`);
    
    // 3.2 Vind alle sellers zonder Stripe Connect account (mogelijk al gereset, maar reset voor zekerheid)
    const sellersWithoutAccount = await prisma.user.findMany({
      where: {
        SellerProfile: {
          isNot: null
        },
        stripeConnectAccountId: null
      },
      select: {
        id: true,
        email: true,
        name: true,
        stripeConnectOnboardingCompleted: true
      }
    });
    
    console.log(`   📋 Gevonden ${sellersWithoutAccount.length} sellers zonder Stripe Connect account`);
    
    // 3.3 Combineer alle users die gereset moeten worden
    // Reset ALLE accounts (sandbox + live) omdat live codes pas gisteren zijn ingesteld
    const allUsersToReset = [
      ...usersWithSandboxAccounts.map(u => ({ ...u, reason: 'sandbox_account' })),
      ...usersWithLiveAccounts.map(u => ({ ...u, reason: 'live_account' })),
      ...sellersWithoutAccount.map(u => ({ ...u, reason: 'seller_without_account' }))
    ];
    
    if (allUsersToReset.length > 0) {
      const userIds = allUsersToReset.map(u => u.id);
      
      // 3.4 Reset Stripe Connect account IDs en onboarding status
      const resetAccounts = await prisma.user.updateMany({
        where: {
          id: { in: userIds }
        },
        data: {
          stripeConnectAccountId: null,
          stripeConnectOnboardingCompleted: false
        }
      });
      
      console.log(`   ✅ Gereset ${resetAccounts.count} Stripe Connect accounts`);
      console.log('   📝 Alle users kunnen nu opnieuw Stripe Connect instellen met live accounts');
      console.log('');
      
      // Toon welke users gereset zijn
      if (usersWithSandboxAccounts.length > 0) {
        console.log('   🔄 Users met sandbox accounts:');
        usersWithSandboxAccounts.forEach(user => {
          console.log(`      - ${user.email || user.name || user.id} (was: ${user.stripeConnectAccountId})`);
        });
        console.log('');
      }
      
      if (usersWithLiveAccounts.length > 0) {
        console.log('   🔄 Users met live accounts (gereset omdat live codes pas gisteren zijn ingesteld):');
        usersWithLiveAccounts.forEach(user => {
          console.log(`      - ${user.email || user.name || user.id} (was: ${user.stripeConnectAccountId})`);
        });
        console.log('');
      }
      
      if (sellersWithoutAccount.length > 0) {
        console.log('   🔄 Sellers zonder Stripe Connect account (gereset voor zekerheid):');
        sellersWithoutAccount.forEach(user => {
          console.log(`      - ${user.email || user.name || user.id} (onboarding was: ${user.stripeConnectOnboardingCompleted})`);
        });
      }
    } else {
      console.log('   ✅ Geen accounts gevonden die gereset moeten worden');
    }
    
    console.log('');
    
    // ============================================
    // SAMENVATTING
    // ============================================
    console.log('🎉 Reset voltooid!');
    console.log('');
    console.log('📊 Samenvatting:');
    console.log(`   - ${sandboxOrders.length} sandbox orders verwijderd`);
    console.log(`   - ${dorpspleinProducts.length} dorpsplein producten verwijderd`);
    console.log(`   - ${allUsersToReset.length} Stripe Connect accounts gereset`);
    console.log('');
    console.log('✅ Het dorpsplein is nu leeg en klaar voor live gebruik');
    console.log('✅ Users met sandbox accounts kunnen nu opnieuw Stripe Connect instellen');
    
  } catch (error) {
    console.error('❌ Error tijdens reset:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Bevestiging vragen voordat we beginnen
console.log('⚠️  WAARSCHUWING: Dit script zal:');
console.log('   1. Alle dorpsplein producten (met prijzen) verwijderen');
console.log('   2. Alle sandbox verkoopdata (orders, transactions, payouts) verwijderen');
console.log('   3. Stripe Connect sandbox accounts resetten');
console.log('');
console.log('Dit kan NIET ongedaan gemaakt worden!');
console.log('');

// Voor productie: uncomment de bevestiging
// const readline = require('readline');
// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout
// });
// 
// rl.question('Type "RESET" om door te gaan: ', (answer) => {
//   if (answer === 'RESET') {
//     rl.close();
//     resetDorpspleinAndSandbox()
//       .then(() => {
//         console.log('✅ Script voltooid');
//         process.exit(0);
//       })
//       .catch((error) => {
//         console.error('❌ Script gefaald:', error);
//         process.exit(1);
//       });
//   } else {
//     console.log('❌ Geannuleerd');
//     rl.close();
//     process.exit(0);
//   }
// });

// Voor nu: direct uitvoeren (comment uit voor productie)
resetDorpspleinAndSandbox()
  .then(() => {
    console.log('✅ Script voltooid');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script gefaald:', error);
    process.exit(1);
  });

