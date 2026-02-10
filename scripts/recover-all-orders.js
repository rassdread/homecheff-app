const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function recoverAllOrders() {
  try {
    console.log('🔄 MASS ORDER RECOVERY - Recovering ALL missing orders from Stripe...\n');

    // Get all paid checkout sessions from Stripe (last 30 days)
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      created: {
        gte: Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000)
      }
    });

    console.log(`📊 Found ${sessions.data.length} Stripe sessions to process`);

    // Get existing orders to avoid duplicates
    const existingOrders = await prisma.order.findMany({
      select: { stripeSessionId: true }
    });
    const existingSessionIds = new Set(existingOrders.map(o => o.stripeSessionId).filter(Boolean));

    let processedCount = 0;
    let recoveredCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const session of sessions.data) {
      processedCount++;
      console.log(`\n${processedCount}/${sessions.data.length}. Processing: ${session.id}`);

      // Skip if not paid
      if (session.payment_status !== 'paid') {
        console.log(`   ⏭️ Skipped: Not paid (${session.payment_status})`);
        skippedCount++;
        continue;
      }

      // Skip subscriptions
      if (session.mode === 'subscription') {
        console.log(`   ⏭️ Skipped: Subscription payment`);
        skippedCount++;
        continue;
      }

      // Skip if order already exists
      if (existingSessionIds.has(session.id)) {
        console.log(`   ✅ Skipped: Order already exists`);
        skippedCount++;
        continue;
      }

      // Get customer info
      const customerEmail = session.customer_details?.email;
      if (!customerEmail) {
        console.log(`   ❌ Skipped: No customer email`);
        skippedCount++;
        continue;
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: customerEmail },
        select: { id: true, name: true }
      });

      if (!user) {
        console.log(`   ❌ Skipped: User not found (${customerEmail})`);
        skippedCount++;
        continue;
      }

      console.log(`   👤 Customer: ${user.name} (${customerEmail})`);
      console.log(`   💰 Amount: €${(session.amount_total / 100).toFixed(2)}`);

      // Parse items from metadata
      let items = [];
      try {
        if (session.metadata?.items) {
          items = JSON.parse(session.metadata.items);
        } else if (session.metadata?.items_compact_1) {
          // Parse compact format
          const itemChunks = Object.entries(session.metadata)
            .filter(([key]) => key.startsWith('items_compact_'))
            .sort(([a], [b]) => (a > b ? 1 : a < b ? -1 : 0))
            .map(([, value]) => value)
            .filter(Boolean);

          if (itemChunks.length > 0) {
            const compactEntries = itemChunks.join(';').split(';').filter(Boolean);
            items = compactEntries.map((entry) => {
              const [productId, quantity, priceCents, sellerId] = entry.split('|');
              return {
                productId,
                quantity: Number.parseInt(quantity ?? '0', 10),
                priceCents: Number.parseInt(priceCents ?? '0', 10),
                sellerId: sellerId || null,
              };
            });
          }
        }
      } catch (error) {
        console.log(`   ❌ Error parsing items: ${error.message}`);
        errorCount++;
        continue;
      }

      if (items.length === 0) {
        console.log(`   ❌ Skipped: No items found in metadata`);
        skippedCount++;
        continue;
      }

      console.log(`   📦 Items: ${items.length} products`);

      // Create order
      try {
        const deliveryMode = (() => {
          const mode = session.metadata?.deliveryMode;
          if (mode === 'LOCAL_DELIVERY' || mode === 'TEEN_DELIVERY') return 'DELIVERY';
          if (mode === 'PICKUP') return 'PICKUP';
          return 'PICKUP'; // default
        })();

        const orderData = {
          userId: user.id,
          orderNumber: await (await import('../lib/orderNumberGenerator.js')).OrderNumberGenerator.generateOrderNumber(),
          status: 'CONFIRMED',
          stripeSessionId: session.id,
          totalAmount: session.amount_total,
          deliveryMode,
          pickupAddress: deliveryMode === 'PICKUP' ? session.metadata?.address : null,
          deliveryAddress: deliveryMode === 'DELIVERY' ? session.metadata?.address : null,
          notes: session.metadata?.notes || 'Order recovered from failed webhook',
        };

        // Parse dates if available
        if (session.metadata?.pickupDate) {
          try {
            orderData.pickupDate = new Date(session.metadata.pickupDate);
          } catch (e) {
            console.log(`   ⚠️ Could not parse pickup date`);
          }
        }

        if (session.metadata?.deliveryDate) {
          try {
            orderData.deliveryDate = new Date(session.metadata.deliveryDate);
          } catch (e) {
            console.log(`   ⚠️ Could not parse delivery date`);
          }
        }

        // Use transaction for atomicity
        const result = await prisma.$transaction(async (tx) => {
          // Create order
          const newOrder = await tx.order.create({
            data: orderData
          });

          // Create order items
          const createdItems = [];
          for (const item of items) {
            // Verify product exists
            const product = await tx.product.findUnique({
              where: { id: item.productId },
              select: { id: true, title: true, stock: true }
            });

            if (!product) {
              console.log(`   ⚠️ Product not found: ${item.productId}, skipping item`);
              continue;
            }

            const orderItem = await tx.orderItem.create({
              data: {
                orderId: newOrder.id,
                productId: item.productId,
                quantity: item.quantity,
                priceCents: item.priceCents,
              }
            });

            createdItems.push({ orderItem, product });

            // Update product stock if available
            if (typeof product.stock === 'number' && product.stock >= item.quantity) {
              await tx.product.update({
                where: { id: item.productId },
                data: {
                  stock: {
                    decrement: item.quantity
                  }
                }
              });
              console.log(`   📦 ${product.title}: Stock updated (-${item.quantity})`);
            } else {
              console.log(`   ⚠️ ${product.title}: Stock not updated (insufficient or null)`);
            }
          }

          // Update any existing stock reservations
          try {
            await tx.stockReservation.updateMany({
              where: { stripeSessionId: session.id },
              data: { status: 'CONFIRMED' }
            });
          } catch (e) {
            // Ignore if no reservations exist
          }

          return { order: newOrder, items: createdItems };
        });

        recoveredCount++;
        console.log(`   ✅ ORDER RECOVERED SUCCESSFULLY!`);
        console.log(`   📋 Order: ${result.order.orderNumber}`);
        console.log(`   📦 Items: ${result.items.length} products added`);

      } catch (error) {
        errorCount++;
        console.log(`   ❌ Failed to recover order: ${error.message}`);
        console.log(`   🔍 Error details:`, error.stack?.split('\n')[0]);
        continue;
      }
    }

    // Final summary
    console.log(`\n🎯 RECOVERY SUMMARY:`);
    console.log(`   📊 Total sessions processed: ${processedCount}`);
    console.log(`   ✅ Orders recovered: ${recoveredCount}`);
    console.log(`   ⏭️ Sessions skipped: ${skippedCount}`);
    console.log(`   ❌ Errors encountered: ${errorCount}`);

    // Check final database state
    const finalOrderCount = await prisma.order.count();
    const finalPaidOrderCount = await prisma.order.count({
      where: { stripeSessionId: { not: null } }
    });

    console.log(`\n📊 FINAL DATABASE STATE:`);
    console.log(`   Total orders: ${finalOrderCount}`);
    console.log(`   Paid orders: ${finalPaidOrderCount}`);
    
    const newHealthPercentage = processedCount > 0 ? Math.round((finalPaidOrderCount / (processedCount - skippedCount + finalPaidOrderCount)) * 100) : 100;
    console.log(`   🏥 New webhook health: ${newHealthPercentage}%`);

    if (recoveredCount > 0) {
      console.log(`\n🎉 SUCCESS: Recovered ${recoveredCount} missing orders!`);
      console.log(`💡 Your orders should now be visible in all dashboards.`);
    }

    console.log('\n✅ Mass recovery complete!');
    
  } catch (error) {
    console.error('❌ Critical error during mass recovery:', error);
  } finally {
    await prisma.$disconnect();
  }
}

recoverAllOrders();
