const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function recoverMissingOrders() {
  try {
    console.log('🔄 Order Recovery - Recovering missing orders from Stripe sessions...\n');

    // Get all pending stock reservations with Stripe sessions
    const pendingReservations = await prisma.stockReservation.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        product: {
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

    console.log(`🔍 Found ${pendingReservations.length} pending reservations to process`);

    for (const reservation of pendingReservations) {
      console.log(`\n📦 Processing: ${reservation.product.title}`);
      console.log(`   Session: ${reservation.stripeSessionId}`);

      // Check if order already exists
      const existingOrder = await prisma.order.findFirst({
        where: { stripeSessionId: reservation.stripeSessionId }
      });

      if (existingOrder) {
        console.log(`   ✅ Order already exists, updating reservation status`);
        await prisma.stockReservation.update({
          where: { id: reservation.id },
          data: { status: 'CONFIRMED' }
        });
        continue;
      }

      // Try to get Stripe session details
      let stripeSession;
      try {
        stripeSession = await stripe.checkout.sessions.retrieve(reservation.stripeSessionId);
        console.log(`   ✅ Retrieved Stripe session`);
        console.log(`   💰 Amount: €${(stripeSession.amount_total / 100).toFixed(2)}`);
        console.log(`   📧 Customer: ${stripeSession.customer_details?.email || 'Unknown'}`);
        console.log(`   ✅ Payment Status: ${stripeSession.payment_status}`);
      } catch (error) {
        console.log(`   ❌ Could not retrieve Stripe session: ${error.message}`);
        continue;
      }

      // Only process completed payments
      if (stripeSession.payment_status !== 'paid') {
        console.log(`   ⚠️ Payment not completed (${stripeSession.payment_status}), skipping`);
        continue;
      }

      // Find buyer by email
      const buyerEmail = stripeSession.customer_details?.email;
      if (!buyerEmail) {
        console.log(`   ❌ No customer email found in Stripe session`);
        continue;
      }

      const buyer = await prisma.user.findUnique({
        where: { email: buyerEmail },
        select: { id: true, name: true }
      });

      if (!buyer) {
        console.log(`   ❌ Buyer not found in database: ${buyerEmail}`);
        continue;
      }

      console.log(`   👤 Buyer: ${buyer.name} (${buyerEmail})`);

      // Create the missing order
      try {
        const orderData = {
          userId: buyer.id,
          orderNumber: await (await import('../lib/orderNumberGenerator.js')).OrderNumberGenerator.generateOrderNumber(),
          status: 'CONFIRMED',
          stripeSessionId: reservation.stripeSessionId,
          totalAmount: stripeSession.amount_total || (reservation.quantity * reservation.product.priceCents),
          deliveryMode: (() => {
            const mode = stripeSession.metadata?.deliveryMode;
            if (mode === 'LOCAL_DELIVERY' || mode === 'TEEN_DELIVERY') return 'DELIVERY';
            if (mode === 'PICKUP') return 'PICKUP';
            return 'PICKUP'; // default
          })(),
          pickupAddress: stripeSession.metadata?.deliveryMode === 'PICKUP' ? stripeSession.metadata?.address : null,
          deliveryAddress: stripeSession.metadata?.deliveryMode === 'DELIVERY' ? stripeSession.metadata?.address : null,
          notes: stripeSession.metadata?.notes || 'Order recovered from failed webhook',
        };

        // Parse dates if available
        if (stripeSession.metadata?.pickupDate) {
          try {
            orderData.pickupDate = new Date(stripeSession.metadata.pickupDate);
          } catch (e) {
            console.log(`   ⚠️ Could not parse pickup date: ${stripeSession.metadata.pickupDate}`);
          }
        }

        if (stripeSession.metadata?.deliveryDate) {
          try {
            orderData.deliveryDate = new Date(stripeSession.metadata.deliveryDate);
          } catch (e) {
            console.log(`   ⚠️ Could not parse delivery date: ${stripeSession.metadata.deliveryDate}`);
          }
        }

        // Use transaction for atomicity
        const result = await prisma.$transaction(async (tx) => {
          // Create order
          const newOrder = await tx.order.create({
            data: orderData
          });

          // Create order item
          const orderItem = await tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              productId: reservation.productId,
              quantity: reservation.quantity,
              priceCents: reservation.product.priceCents,
            }
          });

          // Update reservation status
          await tx.stockReservation.update({
            where: { id: reservation.id },
            data: { status: 'CONFIRMED' }
          });

          // Update product stock (decrement)
          await tx.product.update({
            where: { id: reservation.productId },
            data: {
              stock: {
                decrement: reservation.quantity
              }
            }
          });

          return { order: newOrder, orderItem };
        });

        console.log(`   ✅ Order recovered successfully!`);
        console.log(`   📋 Order Number: ${result.order.orderNumber}`);
        console.log(`   💰 Total: €${(result.order.totalAmount / 100).toFixed(2)}`);
        console.log(`   📦 Items: ${reservation.quantity}x ${reservation.product.title}`);

      } catch (error) {
        console.log(`   ❌ Failed to create order: ${error.message}`);
        continue;
      }
    }

    // Summary
    console.log(`\n📊 Recovery Summary:`);
    const totalOrders = await prisma.order.count();
    const paidOrders = await prisma.order.count({
      where: { stripeSessionId: { not: null } }
    });
    const confirmedReservations = await prisma.stockReservation.count({
      where: { status: 'CONFIRMED' }
    });
    const pendingReservationsAfter = await prisma.stockReservation.count({
      where: { status: 'PENDING' }
    });

    console.log(`   Total orders now: ${totalOrders}`);
    console.log(`   Paid orders: ${paidOrders}`);
    console.log(`   Confirmed reservations: ${confirmedReservations}`);
    console.log(`   Pending reservations: ${pendingReservationsAfter}`);

    console.log('\n✅ Recovery complete!');
    
  } catch (error) {
    console.error('❌ Error during recovery:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Only run if called directly
if (require.main === module) {
  recoverMissingOrders();
}

module.exports = { recoverMissingOrders };
