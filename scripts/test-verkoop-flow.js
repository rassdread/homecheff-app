/**
 * Test script voor volledige verkoop flow
 * 
 * Usage:
 *   node scripts/test-verkoop-flow.js
 * 
 * Test scenarios:
 * 1. Maak test verkoper
 * 2. Maak test product
 * 3. Simuleer order
 * 4. Check platform fee
 * 5. Verify payout berekening
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Kleuren voor console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'blue');
  console.log('='.repeat(80) + '\n');
}

async function testVerkopersFlow() {
  try {
    section('🧪 TEST VERKOOP FLOW - FINANCIEEL');

    // ============================================
    // 1. CHECK VERKOPER ACCOUNTS
    // ============================================
    section('1️⃣  Check Verkoper Accounts');
    
    const sellers = await prisma.user.findMany({
      where: {
        SellerProfile: {
          isNot: null
        }
      },
      include: {
        SellerProfile: {
          include: {
            products: {
              take: 3
            }
          }
        }
      },
      take: 5
    });

    if (sellers.length === 0) {
      log('❌ Geen verkopers gevonden!', 'red');
      log('Maak eerst een verkoper account aan via /sell', 'yellow');
      return;
    }

    log(`✅ ${sellers.length} verkoper(s) gevonden`, 'green');
    
    sellers.forEach((seller, i) => {
      const hasStripe = seller.stripeConnectAccountId ? '✅' : '❌';
      const onboardingComplete = seller.stripeConnectOnboardingCompleted ? '✅' : '❌';
      
      log(`\n  Verkoper ${i + 1}:`, 'blue');
      log(`  - Email: ${seller.email}`);
      log(`  - Name: ${seller.name || 'N/A'}`);
      log(`  - Stripe Account: ${hasStripe} ${seller.stripeConnectAccountId || 'Niet gekoppeld'}`);
      log(`  - Onboarding: ${onboardingComplete}`);
      log(`  - Producten: ${seller.SellerProfile?.products.length || 0}`);
      
      if (seller.SellerProfile?.products.length > 0) {
        log(`  - Laatste product: "${seller.SellerProfile.products[0].title}"`);
        log(`  - Prijs: €${(seller.SellerProfile.products[0].priceCents / 100).toFixed(2)}`);
      }
    });

    // ============================================
    // 2. CHECK ACTIVE PRODUCTS
    // ============================================
    section('2️⃣  Check Active Producten');
    
    const products = await prisma.product.findMany({
      where: {
        isActive: true
      },
      include: {
        seller: {
          include: {
            User: true
          }
        },
        Image: true
      },
      take: 10,
      orderBy: {
        createdAt: 'desc'
      }
    });

    log(`✅ ${products.length} actieve product(en) gevonden`, 'green');
    
    products.forEach((product, i) => {
      log(`\n  Product ${i + 1}:`, 'blue');
      log(`  - ID: ${product.id}`);
      log(`  - Titel: ${product.title}`);
      log(`  - Categorie: ${product.category}`);
      log(`  - Prijs: €${(product.priceCents / 100).toFixed(2)}`);
      log(`  - Verkoper: ${product.seller.User.email}`);
      log(`  - Foto's: ${product.Image.length}`);
      log(`  - Created: ${product.createdAt.toLocaleDateString('nl-NL')}`);
    });

    // ============================================
    // 3. CHECK ORDERS
    // ============================================
    section('3️⃣  Check Recent Orders');
    
    const orders = await prisma.order.findMany({
      include: {
        User: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    log(`✅ ${orders.length} order(s) gevonden`, 'green');
    
    if (orders.length === 0) {
      log('ℹ️  Nog geen orders geplaatst', 'yellow');
    } else {
      for (let i = 0; i < orders.length; i++) {
        const order = orders[i];
        log(`\n  Order ${i + 1}:`, 'blue');
        log(`  - ID: ${order.id}`);
        log(`  - Number: ${order.orderNumber || 'N/A'}`);
        log(`  - Status: ${order.status}`);
        log(`  - Totaal: €${(order.totalAmount / 100).toFixed(2)}`);
        log(`  - Klant: ${order.User.email}`);
        log(`  - Platform Fee Collected: ${order.platformFeeCollected ? '✅' : '❌'}`);
        log(`  - Created: ${order.createdAt.toLocaleDateString('nl-NL')}`);
        
        // Get order items separately
        const orderItems = await prisma.orderItem.findMany({
          where: { orderId: order.id },
          include: {
            Product: {
              include: {
                seller: {
                  include: {
                    User: true
                  }
                }
              }
            }
          }
        });
        
        log(`  - Items: ${orderItems.length}`);
        
        // Detail per item
        orderItems.forEach((item, j) => {
          log(`\n    Item ${j + 1}:`);
          log(`    - Product: ${item.Product.title}`);
          log(`    - Verkoper: ${item.Product.seller.User.email}`);
          log(`    - Aantal: ${item.quantity}`);
          log(`    - Prijs per stuk: €${(item.priceCents / 100).toFixed(2)}`);
          log(`    - Subtotaal: €${(item.priceCents * item.quantity / 100).toFixed(2)}`);
        });
      }
    }

    // ============================================
    // 4. CHECK PAYOUTS
    // ============================================
    section('4️⃣  Check Payouts');
    
    const payouts = await prisma.payout.findMany({
      include: {
        User: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        Transaction: {
          select: {
            id: true,
            sellerId: true,
            platformFeeBps: true,
            amountCents: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    log(`✅ ${payouts.length} payout(s) gevonden`, 'green');
    
    if (payouts.length === 0) {
      log('ℹ️  Nog geen payouts aangemaakt', 'yellow');
    } else {
      payouts.forEach((payout, i) => {
        log(`\n  Payout ${i + 1}:`, 'blue');
        log(`  - ID: ${payout.id}`);
        log(`  - Verkoper: ${payout.User?.email || 'Onbekend'}`);
        log(`  - Bedrag: €${(payout.amountCents / 100).toFixed(2)}`);
        if (payout.Transaction) {
          log(`  - Via transactie: ${payout.Transaction.id}`);
          log(`  - Platform fee (bps): ${payout.Transaction.platformFeeBps ?? 0}`);
        }
        log(`  - Stripe Transfer ID: ${payout.providerRef || 'Nog niet getransferred'}`);
        log(`  - Created: ${payout.createdAt.toLocaleDateString('nl-NL')}`);
      });
    }

    // ============================================
    // 5. FINANCIAL SUMMARY
    // ============================================
    section('5️⃣  Financieel Overzicht');
    
    const paidOrders = orders.filter(o => o.status === 'PAID');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const transactions = await prisma.transaction.findMany({
      where: { status: 'CAPTURED' },
      select: { amountCents: true, platformFeeBps: true },
    });

    const calculatedPlatformFees = transactions.reduce((sum, tx) => {
      const fee = Math.round((tx.amountCents * (tx.platformFeeBps || 0)) / 10000);
      return sum + fee;
    }, 0);

    const totalPayoutAmount = payouts.reduce((sum, payout) => sum + payout.amountCents, 0);

    log('\n📊 Totalen:', 'blue');
    log(`  - Totale omzet (PAID): €${(totalRevenue / 100).toFixed(2)}`, 'green');
    log(`  - Platform fees (berekend): €${(calculatedPlatformFees / 100).toFixed(2)}`, 'yellow');
    log(`  - Uitbetaald aan verkopers: €${(totalPayoutAmount / 100).toFixed(2)}`, 'green');
    
    const avgOrder = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;
    log(`  - Gemiddelde order (PAID): €${(avgOrder / 100).toFixed(2)}`);

    // ============================================
    // 6. STRIPE STATUS
    // ============================================
    section('6️⃣  Stripe Connect Status');
    
    const sellersWithStripe = sellers.filter(s => s.stripeConnectAccountId);
    const sellersOnboarded = sellers.filter(s => s.stripeConnectOnboardingCompleted);
    
    log(`\n✅ Verkopers met Stripe Account: ${sellersWithStripe.length}/${sellers.length}`, 'green');
    log(`✅ Verkopers met Complete Onboarding: ${sellersOnboarded.length}/${sellers.length}`, 'green');
    
    if (sellersWithStripe.length < sellers.length) {
      log('\n⚠️  Waarschuwing:', 'yellow');
      log(`   ${sellers.length - sellersWithStripe.length} verkoper(s) moeten nog Stripe Connect setup voltooien`);
      log('   Ze kunnen geen betalingen ontvangen zonder Stripe onboarding!');
    }

    // ============================================
    // 7. RECOMMENDATIONS
    // ============================================
    section('7️⃣  Aanbevelingen');
    
    const recommendations = [];
    
    if (sellers.length === 0) {
      recommendations.push('❌ Maak minimaal 1 verkoper account aan');
    }
    
    if (products.length === 0) {
      recommendations.push('❌ Voeg minimaal 1 product toe');
    }
    
    if (orders.length === 0) {
      recommendations.push('⚠️  Plaats een test order om de flow te testen');
    }
    
    if (sellersWithStripe.length < sellers.length) {
      recommendations.push('⚠️  Voltooi Stripe onboarding voor alle verkopers');
    }
    
    if (payouts.length === 0 && orders.filter(o => o.status === 'PAID').length > 0) {
      recommendations.push('❌ Er zijn PAID orders maar geen payouts! Check webhook!');
    }

    if (recommendations.length === 0) {
      log('\n✅ Alles ziet er goed uit!', 'green');
      log('   De verkoop flow is correct geconfigureerd.', 'green');
    } else {
      log('\n📋 Te doen:', 'yellow');
      recommendations.forEach(rec => log(`   ${rec}`, 'yellow'));
    }

    section('✅ TEST VOLTOOID');
    
  } catch (error) {
    log('\n❌ ERROR:', 'red');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run test
testVerkopersFlow();

