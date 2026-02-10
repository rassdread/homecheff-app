const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEricOrders() {
  try {
    // Find Eric by email or username
    const eric = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { contains: 'eric', mode: 'insensitive' } },
          { username: { contains: 'eric', mode: 'insensitive' } },
          { name: { contains: 'eric', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true
      }
    });

    if (!eric) {
      console.log('❌ Eric niet gevonden');
      return;
    }

    console.log('✅ Eric gevonden:', {
      id: eric.id,
      email: eric.email,
      username: eric.username,
      name: eric.name
    });

    // Find all orders for Eric
    const orders = await prisma.order.findMany({
      where: {
        userId: eric.id
      },
      include: {
        items: {
          include: {
            Product: {
              include: {
                seller: {
                  include: {
                    User: {
                      select: {
                        id: true,
                        name: true,
                        username: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    console.log(`\n📦 Aantal orders voor Eric: ${orders.length}`);

    if (orders.length === 0) {
      console.log('❌ Geen orders gevonden voor Eric');
      
      // Check recent orders in general
      const recentOrders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          User: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      });

      console.log('\n📋 Recente orders (laatste 5):');
      recentOrders.forEach(order => {
        console.log(`  - Order ${order.orderNumber}: userId=${order.userId}, buyer=${order.User?.name || order.User?.email || 'unknown'}, createdAt=${order.createdAt}`);
      });
    } else {
      orders.forEach((order, index) => {
        console.log(`\n📦 Order ${index + 1}:`);
        console.log(`  - Order Number: ${order.orderNumber}`);
        console.log(`  - Status: ${order.status}`);
        console.log(`  - Total: €${(order.totalAmount / 100).toFixed(2)}`);
        console.log(`  - Created: ${order.createdAt}`);
        console.log(`  - Stripe Session ID: ${order.stripeSessionId || 'N/A'}`);
        console.log(`  - Items:`);
        order.items.forEach(item => {
          console.log(`    * ${item.quantity}x ${item.Product.title} van ${item.Product.seller.User.name || item.Product.seller.User.username}`);
        });
      });
    }

    // Check if there are any orders with Eric's email in metadata (if stored)
    const ordersByEmail = await prisma.order.findMany({
      where: {
        User: {
          email: { contains: 'eric', mode: 'insensitive' }
        }
      },
      take: 5
    });

    if (ordersByEmail.length > 0) {
      console.log(`\n📧 Orders gevonden via email match: ${ordersByEmail.length}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEricOrders();





