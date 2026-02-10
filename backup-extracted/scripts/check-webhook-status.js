const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkWebhookStatus() {
  try {
    console.log('🔍 Checking webhook and order status...\n');

    // Check all orders
    const allOrders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        User: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        items: {
          take: 1,
          include: {
            Product: {
              select: {
                id: true,
                title: true,
                sellerId: true
              }
            }
          }
        }
      }
    });

    console.log(`📦 Total orders in database: ${allOrders.length}\n`);

    if (allOrders.length > 0) {
      console.log('All orders:');
      allOrders.forEach((order, index) => {
        console.log(`\n${index + 1}. Order ${order.id}:`);
        console.log(`   OrderNumber: ${order.orderNumber}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   UserId: ${order.userId}`);
        console.log(`   User Email: ${order.User?.email || 'N/A'}`);
        console.log(`   StripeSessionId: ${order.stripeSessionId || 'NULL ❌'}`);
        console.log(`   TotalAmount: €${(order.totalAmount / 100).toFixed(2)}`);
        console.log(`   CreatedAt: ${order.createdAt}`);
        console.log(`   Items: ${order.items.length}`);
        if (order.items.length > 0) {
          console.log(`   First Product: ${order.items[0].Product?.title || 'N/A'}`);
          console.log(`   Product SellerId: ${order.items[0].Product?.sellerId || 'N/A'}`);
        }
      });
    }

    // Check orders with stripeSessionId
    const paidOrders = await prisma.order.findMany({
      where: {
        stripeSessionId: { not: null }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`\n✅ Orders with stripeSessionId (paid): ${paidOrders.length}`);

    // Check orders without stripeSessionId
    const unpaidOrders = await prisma.order.findMany({
      where: {
        stripeSessionId: null
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`⚠️ Orders without stripeSessionId (unpaid/webhook failed): ${unpaidOrders.length}`);

    // Check recent Stripe sessions (if we have access to Stripe)
    console.log(`\n💡 Recommendations:`);
    if (unpaidOrders.length > 0) {
      console.log(`   - ${unpaidOrders.length} orders are missing stripeSessionId`);
      console.log(`   - This means the webhook was NOT called or FAILED`);
      console.log(`   - Check Vercel logs for webhook errors`);
      console.log(`   - Verify Stripe webhook is configured: https://dashboard.stripe.com/webhooks`);
      console.log(`   - Webhook endpoint should be: https://homecheff.nl/api/stripe/webhook`);
    }

    // Check for Eric's orders
    const ericUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { contains: 'eric', mode: 'insensitive' } },
          { name: { contains: 'eric', mode: 'insensitive' } }
        ]
      },
      select: { id: true, email: true, name: true }
    });

    if (ericUser) {
      console.log(`\n👤 Eric: ${ericUser.email} (${ericUser.id})`);
      
      const ericOrders = await prisma.order.findMany({
        where: {
          userId: ericUser.id
        },
        orderBy: { createdAt: 'desc' }
      });

      console.log(`📦 Eric's orders: ${ericOrders.length}`);
      ericOrders.forEach(order => {
        console.log(`   - ${order.orderNumber || order.id}: ${order.status}, StripeSessionId: ${order.stripeSessionId || 'NULL ❌'}`);
      });
    }

    // Check for Jason's seller profile
    const jasonUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { contains: 'jason', mode: 'insensitive' } },
          { name: { contains: 'jason', mode: 'insensitive' } }
        ]
      },
      select: { id: true, email: true, name: true }
    });

    if (jasonUser) {
      console.log(`\n👤 Jason: ${jasonUser.email} (${jasonUser.id})`);
      
      const jasonSeller = await prisma.sellerProfile.findUnique({
        where: { userId: jasonUser.id },
        select: { id: true }
      });

      if (jasonSeller) {
        console.log(`🏪 Jason's SellerProfile: ${jasonSeller.id}`);
        
        // Check orders for Jason's products
        const jasonOrders = await prisma.order.findMany({
          where: {
            items: {
              some: {
                Product: {
                  sellerId: jasonSeller.id
                }
              }
            }
          },
          include: {
            User: {
              select: {
                email: true,
                name: true
              }
            },
            items: {
              include: {
                Product: {
                  select: {
                    title: true,
                    sellerId: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        });

        console.log(`📦 Orders for Jason's products: ${jasonOrders.length}`);
        jasonOrders.forEach(order => {
          console.log(`   - ${order.orderNumber || order.id}: ${order.status}, Buyer: ${order.User?.name || order.User?.email}, StripeSessionId: ${order.stripeSessionId || 'NULL ❌'}`);
        });
      } else {
        console.log(`❌ Jason has no SellerProfile!`);
      }
    }

    // Check recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        Order: {
          select: {
            id: true,
            orderNumber: true,
            stripeSessionId: true
          }
        }
      }
    });

    console.log(`\n💳 Recent transactions: ${recentTransactions.length}`);
    recentTransactions.forEach(tx => {
      console.log(`   - ${tx.id}: ${tx.status}, Amount: €${(tx.amountCents / 100).toFixed(2)}, Order: ${tx.Order?.orderNumber || 'N/A'}, SessionId: ${tx.providerRef || 'N/A'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWebhookStatus();




