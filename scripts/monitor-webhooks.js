const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function monitorWebhooks() {
  try {
    console.log('🔍 Webhook Monitor - Checking for webhook processing issues...\n');

    // Check for new stock reservations without corresponding orders
    const recentReservations = await prisma.stockReservation.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      include: {
        product: {
          select: { title: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 Stock reservations in last 24h: ${recentReservations.length}`);

    let pendingCount = 0;
    let confirmedCount = 0;

    for (const reservation of recentReservations) {
      if (reservation.status === 'PENDING') {
        pendingCount++;
        
        // Check if there's an order for this session
        const order = await prisma.order.findFirst({
          where: { stripeSessionId: reservation.stripeSessionId }
        });

        if (!order) {
          console.log(`⚠️ ALERT: Pending reservation without order`);
          console.log(`   Product: ${reservation.product.title}`);
          console.log(`   Session: ${reservation.stripeSessionId}`);
          console.log(`   Created: ${reservation.createdAt.toLocaleString('nl-NL')}`);
          console.log(`   Age: ${Math.round((Date.now() - reservation.createdAt.getTime()) / (1000 * 60))} minutes`);
          
          // If reservation is older than 30 minutes, it's likely a webhook failure
          if (Date.now() - reservation.createdAt.getTime() > 30 * 60 * 1000) {
            console.log(`   🚨 WEBHOOK FAILURE DETECTED - Reservation older than 30 minutes`);
          }
        }
      } else {
        confirmedCount++;
      }
    }

    console.log(`\n📈 Reservation Status Summary:`);
    console.log(`   ✅ Confirmed: ${confirmedCount}`);
    console.log(`   ⏳ Pending: ${pendingCount}`);

    if (pendingCount > 0) {
      console.log(`\n🔧 Recommendations:`);
      console.log(`   1. Check Stripe webhook configuration`);
      console.log(`   2. Verify webhook endpoint is accessible`);
      console.log(`   3. Check webhook logs in Stripe dashboard`);
      console.log(`   4. Run recovery script if needed: node scripts/recover-orders.js`);
    }

    // Check recent orders
    const recentOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      include: {
        User: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`\n📋 Recent Orders (last 24h): ${recentOrders.length}`);
    recentOrders.forEach((order, index) => {
      console.log(`${index + 1}. ${order.orderNumber} - ${order.User.name}`);
      console.log(`   Amount: €${(order.totalAmount / 100).toFixed(2)}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Stripe: ${order.stripeSessionId ? '✅' : '❌'}`);
      console.log(`   Created: ${order.createdAt.toLocaleString('nl-NL')}`);
    });

    // Overall health check
    const totalOrders = await prisma.order.count();
    const paidOrders = await prisma.order.count({
      where: { stripeSessionId: { not: null } }
    });
    const healthPercentage = totalOrders > 0 ? Math.round((paidOrders / totalOrders) * 100) : 0;

    console.log(`\n🏥 System Health:`);
    console.log(`   Total Orders: ${totalOrders}`);
    console.log(`   Paid Orders: ${paidOrders}`);
    console.log(`   Health Score: ${healthPercentage}% (${paidOrders}/${totalOrders})`);

    if (healthPercentage < 80) {
      console.log(`   🚨 WARNING: Low health score indicates webhook issues`);
    } else if (healthPercentage >= 95) {
      console.log(`   ✅ EXCELLENT: System is healthy`);
    } else {
      console.log(`   ⚠️ GOOD: System is mostly healthy`);
    }

    console.log('\n✅ Monitoring complete.');
    
  } catch (error) {
    console.error('❌ Error in webhook monitoring:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run monitoring
monitorWebhooks();
































