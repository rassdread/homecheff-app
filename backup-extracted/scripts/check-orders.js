const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrders() {
  try {
    console.log('🔍 Checking orders in database...\n');

    // Check all orders
    const allOrders = await prisma.order.findMany({
      take: 10,
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

    console.log(`📦 Total orders found: ${allOrders.length}\n`);

    if (allOrders.length > 0) {
      console.log('Sample orders:');
      allOrders.forEach((order, index) => {
        console.log(`\n${index + 1}. Order ${order.id}:`);
        console.log(`   OrderNumber: ${order.orderNumber}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   UserId: ${order.userId}`);
        console.log(`   User Email: ${order.User?.email || 'N/A'}`);
        console.log(`   StripeSessionId: ${order.stripeSessionId || 'NULL'}`);
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
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    console.log(`\n✅ Orders with stripeSessionId: ${paidOrders.length}`);

    // Check orders without stripeSessionId
    const unpaidOrders = await prisma.order.findMany({
      where: {
        stripeSessionId: null
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    console.log(`⚠️ Orders without stripeSessionId: ${unpaidOrders.length}`);

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
      console.log(`\n👤 Found Eric: ${ericUser.email} (${ericUser.id})`);
      
      const ericOrders = await prisma.order.findMany({
        where: {
          userId: ericUser.id
        },
        orderBy: { createdAt: 'desc' }
      });

      console.log(`📦 Eric's orders: ${ericOrders.length}`);
      ericOrders.forEach(order => {
        console.log(`   - ${order.orderNumber || order.id}: ${order.status}, StripeSessionId: ${order.stripeSessionId || 'NULL'}`);
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
      console.log(`\n👤 Found Jason: ${jasonUser.email} (${jasonUser.id})`);
      
      const jasonSeller = await prisma.sellerProfile.findUnique({
        where: { userId: jasonUser.id },
        select: { id: true }
      });

      if (jasonSeller) {
        console.log(`🏪 Jason's SellerProfile: ${jasonSeller.id}`);
        
        // Check orders for Jason's products
        const jasonOrders = await prisma.order.findMany({
          where: {
            stripeSessionId: { not: null },
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
          orderBy: { createdAt: 'desc' },
          take: 5
        });

        console.log(`📦 Orders for Jason's products: ${jasonOrders.length}`);
        jasonOrders.forEach(order => {
          console.log(`   - ${order.orderNumber || order.id}: ${order.status}, Buyer: ${order.User?.name || order.User?.email}`);
        });
      } else {
        console.log(`❌ Jason has no SellerProfile!`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrders();




