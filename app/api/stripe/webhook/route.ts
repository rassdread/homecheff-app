import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { normalizeSubscriptionName, PLAN_TO_PRICE } from "@/lib/stripe";
import { NotificationService } from "@/lib/notifications/notification-service";
import { calculateDistance } from "@/lib/geocoding";
import { createShippingLabel, EctaroShipLabelRequest } from "@/lib/ectaroship";

async function readBuffer(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  const total = chunks.reduce((acc, cur) => new Uint8Array([...acc, ...cur]), new Uint8Array());
  return Buffer.from(total);
}

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-08-27.basil" });
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("Missing signature", { status: 400 });

  const buf = await readBuffer(req.body!);
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error("Webhook signature verify failed", err?.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    // Handle subscription events
    if (event.type === "checkout.session.completed" && event.data.object.mode === "subscription") {
      const session = event.data.object as Stripe.Checkout.Session;
      const plan = session.metadata?.plan;
      const userId = session.metadata?.userId;

      if (plan && userId) {
        const isRegistration = session.metadata?.isRegistration === "true";
        
        // Get seller profile for this user
        const sellerProfile = await prisma.sellerProfile.findUnique({
          where: { userId }
        });

        if (sellerProfile) {
          // Map plan from Stripe (BASIC/PRO/PREMIUM) to database name (Basic/Pro/Premium)
          const planName = normalizeSubscriptionName(plan);
          
          // Find subscription by name
          let subscription = await prisma.subscription.findFirst({
            where: { name: planName, isActive: true }
          });
          
          // If not found by name, try by id (basic/pro/premium)
          if (!subscription) {
            subscription = await prisma.subscription.findUnique({
              where: { id: plan.toLowerCase() }
            });
          }

          if (subscription) {
            let currentPeriodEnd: number | null = null;
            let stripeSubscriptionId: string | null = null;

            if (session.subscription) {
              const subscriptionId = typeof session.subscription === 'string'
                ? session.subscription
                : (session.subscription as any)?.id;
              if (subscriptionId) {
                stripeSubscriptionId = subscriptionId;
                try {
                  const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId);
                  const subscriptionData = subscriptionResponse as any;
                  currentPeriodEnd = subscriptionData?.current_period_end ?? null;
                } catch (err: any) {
                  console.warn(`Kon Stripe subscription ${subscriptionId} niet ophalen:`, err?.message || err);
                }
              }
            }

            // Update seller profile with subscription
            const updateData: Record<string, any> = {
              subscriptionId: subscription.id,
              subscriptionValidUntil: currentPeriodEnd
                ? new Date(currentPeriodEnd * 1000)
                : new Date(Date.now() + subscription.durationDays * 24 * 60 * 60 * 1000),
            };

            if (stripeSubscriptionId) {
              updateData.stripeSubscriptionId = stripeSubscriptionId;
            }

            if (typeof session.customer === 'string') {
              updateData.stripeCustomerId = session.customer;
            }

            await prisma.sellerProfile.update({
              where: { userId },
              data: updateData
            });

            // 💰 CREATE BUSINESS SUBSCRIPTION RECORD (for affiliate tracking)
            if (stripeSubscriptionId && typeof session.customer === 'string') {
              try {
                const promoCodeId = session.metadata?.promo_code_id || null;
                const attributionId = session.metadata?.attribution_id || null;
                const basePriceCents = parseInt(session.metadata?.base_price_cents || '0') || subscription.priceCents;
                const finalPriceCents = parseInt(session.metadata?.final_price_cents || '0') || subscription.priceCents;

                const now = new Date();
                // Revenue share window is 12 months (365 days) from subscription start
                // This means affiliate gets commission for 12 months on this subscription
                const { ATTRIBUTION_WINDOW_DAYS } = await import('@/lib/affiliate-config');
                const endsAt = new Date(now.getTime() + ATTRIBUTION_WINDOW_DAYS * 24 * 60 * 60 * 1000);

                // Check if BusinessSubscription already exists
                const existing = await prisma.businessSubscription.findFirst({
                  where: { stripeSubscriptionId },
                });

                if (!existing) {
                  await prisma.businessSubscription.create({
                    data: {
                      businessUserId: userId,
                      stripeCustomerId: session.customer,
                      stripeSubscriptionId,
                      planId: subscription.id,
                      priceCents: finalPriceCents,
                      currency: 'eur',
                      status: 'active',
                      promoCodeId,
                      attributionId,
                      startsAt: now,
                      endsAt,
                    },
                  });
                  console.log(`✅ BusinessSubscription created for user ${userId}`);
                }
              } catch (bsError: any) {
                console.error(`❌ Failed to create BusinessSubscription:`, bsError.message);
                // Don't fail the whole process
              }
            }

            // 💰 CREATE ORDER FOR SUBSCRIPTION PAYMENT (for revenue tracking)
            const subscriptionAmountCents = session.amount_total || subscription.priceCents || 0;
            if (subscriptionAmountCents > 0) {
              try {
                await prisma.order.create({
                  data: {
                    userId: userId,
                    orderNumber: (await import('@/lib/orderNumberGenerator')).OrderNumberGenerator.generateSubscriptionNumber(),
                    status: 'CONFIRMED',
                    totalAmount: subscriptionAmountCents,
                    stripeSessionId: session.id,
                    notes: `Abonnement betaling: ${subscription.name}${isRegistration ? ' (Registratie)' : ''}`,
                    deliveryMode: 'PICKUP', // Not applicable for subscriptions
                  }
                });
                console.log(`✅ Subscription order created for user ${userId}: ${subscriptionAmountCents} cents`);
              } catch (orderError: any) {
                console.error(`❌ Failed to create subscription order:`, orderError.message);
                // Don't fail the whole process if order creation fails
              }
            }

            const context = isRegistration ? "registratie" : "abonnement upgrade";
            console.log(`✅ Subscription assigned to user ${userId} (${context}): ${plan} -> ${subscription.name}`);
          } else {
            console.error(`❌ Subscription not found for plan: ${plan} (mapped to: ${planName})`);
          }
        } else {
          console.error(`❌ SellerProfile not found for user ${userId} during subscription payment`);
        }
      }
    }
    // Handle subscription updates
    else if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;

      if (userId) {
        const sellerProfile = await prisma.sellerProfile.findUnique({
          where: { userId }
        });

        if (sellerProfile) {
          if (subscription.status !== 'active') {
            // Clear subscription if not active
            await prisma.sellerProfile.update({
              where: { userId },
              data: {
                subscriptionId: null,
                subscriptionValidUntil: null,
                stripeSubscriptionId: null,
              }
            });

            console.log(`✅ Subscription cleared for user ${userId}`);
          } else {
            const subscriptionItem = subscription.items.data[0];
            const priceId = subscriptionItem?.price?.id;
            let planKey: string | undefined;
            if (priceId) {
              const match = Object.entries(PLAN_TO_PRICE).find(([, value]) => value === priceId);
              planKey = match?.[0];
            }

            let dbSubscriptionId: string | undefined;
            if (planKey) {
              const planName = normalizeSubscriptionName(planKey);
              const dbSubscription = await prisma.subscription.findFirst({
                where: { name: planName, isActive: true }
              }) ?? await prisma.subscription.findUnique({ where: { id: planKey.toLowerCase() } });
              dbSubscriptionId = dbSubscription?.id;
            }

            const subscriptionCurrentPeriodEnd =
              (subscription as any)?.current_period_end ?? null;

            const updateData: Record<string, any> = {
              stripeSubscriptionId: subscription.id,
              subscriptionValidUntil: subscriptionCurrentPeriodEnd
                ? new Date(subscriptionCurrentPeriodEnd * 1000)
                : sellerProfile.subscriptionValidUntil,
            };

            if (dbSubscriptionId) {
              updateData.subscriptionId = dbSubscriptionId;
            }

            const subscriptionCustomer =
              typeof subscription.customer === 'string'
                ? subscription.customer
                : (subscription as any)?.customer;

            if (typeof subscriptionCustomer === 'string') {
              updateData.stripeCustomerId = subscriptionCustomer;
            }

            await prisma.sellerProfile.update({
              where: { userId },
              data: updateData
            });

            console.log(`✅ Subscription updated for user ${userId} (status: ${subscription.status})`);
          }
        }
      }
    }
    // Handle invoice.paid events (for affiliate commissions)
    else if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      // subscription is an expandable field in Stripe, so we need to handle it carefully
      const subscription = (invoice as any).subscription as string | Stripe.Subscription | null | undefined;
      const subscriptionId = typeof subscription === 'string' 
        ? subscription 
        : subscription?.id || null;

      if (subscriptionId && invoice.amount_paid && invoice.id) {
        try {
          const { processCommissionForInvoice } = await import('@/lib/affiliate-commission');
          await processCommissionForInvoice(
            invoice.id,
            subscriptionId,
            invoice.amount_paid,
            {
              customerId: typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id || '',
              periodStart: invoice.period_start?.toString() || '',
              periodEnd: invoice.period_end?.toString() || '',
            }
          );
        } catch (commissionError: any) {
          console.error(`❌ Failed to process commission for invoice ${invoice.id}:`, commissionError.message);
          // Don't fail webhook - log and continue
        }
      }
    }
    // Handle refunds (commission reversal)
    else if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      // invoice is an expandable field in Stripe
      const invoice = (charge as any).invoice as string | Stripe.Invoice | null | undefined;
      const invoiceId = typeof invoice === 'string' ? invoice : invoice?.id || null;

      if (invoiceId && charge.amount_refunded > 0) {
        try {
          const { processCommissionReversal } = await import('@/lib/affiliate-commission');
          await processCommissionReversal(
            charge.id,
            invoiceId,
            charge.amount_refunded,
            'REFUND'
          );
        } catch (reversalError: any) {
          console.error(`❌ Failed to process commission reversal for charge ${charge.id}:`, reversalError.message);
        }
      }
    }
    // Handle chargebacks (commission reversal)
    else if (event.type === "charge.dispute.created") {
      const dispute = event.data.object as Stripe.Dispute;
      const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;

      if (chargeId) {
        try {
          // Get charge to find invoice
          const charge = await stripe.charges.retrieve(chargeId);
          // invoice is an expandable field in Stripe
          const invoice = (charge as any).invoice as string | Stripe.Invoice | null | undefined;
          const invoiceId = typeof invoice === 'string' ? invoice : invoice?.id || null;

          if (invoiceId) {
            const { processCommissionReversal } = await import('@/lib/affiliate-commission');
            await processCommissionReversal(
              dispute.id,
              invoiceId,
              dispute.amount,
              'CHARGEBACK'
            );
          }
        } catch (reversalError: any) {
          console.error(`❌ Failed to process commission reversal for dispute ${dispute.id}:`, reversalError.message);
        }
      }
    }
    // Handle subscription cancellations
    else if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;

      if (userId) {
        await prisma.sellerProfile.update({
          where: { userId },
          data: {
            subscriptionId: null,
            subscriptionValidUntil: null,
            stripeSubscriptionId: null
          }
        });

        console.log(`✅ Subscription cancelled for user ${userId}`);
      }
    }
    // Handle transfer.created - Transfer successfully created (paid immediately in Stripe)
    else if (event.type === "transfer.created") {
      const transfer = event.data.object as Stripe.Transfer;
      
      console.log(`🔔 Transfer created: ${transfer.id}, Amount: €${(transfer.amount / 100).toFixed(2)}, Destination: ${transfer.destination}`);
      
      // Idempotency check: prevent duplicate processing
      // Check if payout already exists with this transfer ID (means we've processed it)
      const existingPayout = await prisma.payout.findFirst({
        where: { providerRef: transfer.id }
      });
      
      // Only proceed if this is the first time we see this transfer
      // If payout exists and was already processed, skip (but allow reprocessing for notifications)
      
      // Update payout record if providerRef matches
      if (transfer.id) {
        try {
          const payout = await prisma.payout.findFirst({
            where: { providerRef: transfer.id },
            include: { 
              User: {
                select: { id: true, name: true, email: true }
              }
            }
          });

          if (payout) {
            console.log(`✅ Transfer ${transfer.id} confirmed for payout ${payout.id}`);
            
            // Send notification to seller/deliverer that payout is received
            try {
              // Try to find order via transaction metadata or use fallback
              const orderNumber = payout.transactionId.substring(0, 8);
              
              await NotificationService.send({
                userId: payout.toUserId,
                message: {
                  title: '💰 Uitbetaling ontvangen',
                  body: `Je uitbetaling van €${(payout.amountCents / 100).toFixed(2)} is succesvol overgemaakt naar je bankrekening.`,
                  urgent: false,
                  data: {
                    type: 'PAYOUT_RECEIVED',
                    payoutId: payout.id,
                    amountCents: payout.amountCents,
                    orderNumber: orderNumber,
                    link: `/verkoper/payouts`
                  }
                },
                channels: ['push', 'email'],
                saveToDatabase: true
              });
              
              console.log(`📧 Payout confirmation notification sent to user ${payout.toUserId}`);
            } catch (notifError: any) {
              console.error(`❌ Failed to send payout notification:`, notifError.message);
              // Don't fail webhook if notification fails
            }
          } else {
            // Check if this is a new transfer we haven't created a payout for yet
            // (This might happen if transfer was created outside our system)
            console.log(`⚠️ Transfer ${transfer.id} not found in payouts table`);
          }
        } catch (error: any) {
          console.error(`❌ Error processing transfer.created for ${transfer.id}:`, error.message);
        }
      }
    }
    // Handle transfer.reversed - Transfer was reversed (refunded)
    else if (event.type === "transfer.reversed") {
      const transferReversal = event.data.object as unknown as Stripe.TransferReversal;
      const transferId = typeof transferReversal.transfer === 'string' 
        ? transferReversal.transfer 
        : (transferReversal.transfer as any)?.id;
      
      console.log(`🔔 Transfer reversed: ${transferReversal.id}, Transfer: ${transferId}, Amount: €${(transferReversal.amount / 100).toFixed(2)}`);
      
      if (transferId) {
        try {
          // Idempotency check: prevent duplicate refund creation
          const existingRefund = await prisma.refund.findFirst({
            where: { providerRef: transferReversal.id }
          });
          
          if (existingRefund) {
            console.log(`⏭️ Transfer reversal ${transferReversal.id} already processed, skipping`);
            return new NextResponse("ok", { status: 200 });
          }
          
          const payout = await prisma.payout.findFirst({
            where: { providerRef: transferId },
            include: { 
              User: {
                select: { id: true, name: true, email: true }
              }
            }
          });

          if (payout) {
            // Create a refund record for the reversed transfer
            await prisma.refund.create({
              data: {
                id: `refund_reversal_${transferReversal.id}_${Date.now()}`,
                transactionId: payout.transactionId,
                amountCents: transferReversal.amount,
                providerRef: transferReversal.id,
              }
            });

            console.log(`✅ Transfer reversal processed for payout ${payout.id}, refund record created`);
            
            // Notify seller/deliverer about the reversal
            try {
              // Use transactionId as fallback for order number
              const orderNumber = payout.transactionId.substring(0, 8);
              
              await NotificationService.send({
                userId: payout.toUserId,
                message: {
                  title: '⚠️ Uitbetaling teruggedraaid',
                  body: `Je uitbetaling van €${(transferReversal.amount / 100).toFixed(2)} is teruggedraaid. Neem contact op met support voor meer informatie.`,
                  urgent: true,
                  data: {
                    type: 'PAYOUT_REVERSED',
                    payoutId: payout.id,
                    refundId: transferReversal.id,
                    amountCents: transferReversal.amount,
                    orderNumber: orderNumber,
                    link: `/verkoper/payouts`
                  }
                },
                channels: ['push', 'email'],
                saveToDatabase: true
              });
              
              console.log(`📧 Payout reversal notification sent to user ${payout.toUserId}`);
            } catch (notifError: any) {
              console.error(`❌ Failed to send payout reversal notification:`, notifError.message);
              // Don't fail webhook if notification fails
            }
          } else {
            console.log(`⚠️ Transfer ${transferId} for reversal not found in payouts table`);
          }
        } catch (error: any) {
          console.error(`❌ Error processing transfer.reversed for ${transferReversal.id}:`, error.message);
        }
      }
    }
    // Handle transfer.updated - Transfer metadata or description updated
    else if (event.type === "transfer.updated") {
      const transfer = event.data.object as Stripe.Transfer;
      
      console.log(`🔔 Transfer updated: ${transfer.id}`);
      
      // Check if we have a payout for this transfer
      if (transfer.id) {
        try {
          const payout = await prisma.payout.findFirst({
            where: { providerRef: transfer.id }
          });

          if (payout) {
            // Transfer was updated - log it for audit purposes
            console.log(`✅ Transfer ${transfer.id} updated for payout ${payout.id}`);
            // Could add audit logging here if needed
          }
        } catch (error: any) {
          console.error(`❌ Error processing transfer.updated for ${transfer.id}:`, error.message);
        }
      }
    }
    // Handle balance.available - Balance updated (funds available to be paid out)
    else if (event.type === "balance.available") {
      const balance = event.data.object as Stripe.Balance;
      
      console.log(`🔔 Balance available: Available: €${(balance.available[0]?.amount || 0) / 100}, Pending: €${(balance.pending[0]?.amount || 0) / 100}`);
      
      // Log balance updates for financial tracking
      // Could trigger automated payouts or notifications here if needed
    }
    // Handle payment events
    else if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log(`🔔 Webhook received: checkout.session.completed for session ${session.id}`);
      console.log(`📋 Session metadata:`, JSON.stringify(session.metadata, null, 2));
      console.log(`💰 Payment status: ${session.payment_status}, Mode: ${session.mode}`);
      console.log(`💳 Amount total: ${session.amount_total}, Currency: ${session.currency}`);
      
      // Skip subscription payments (handled above)
      if (session.mode === "subscription") {
        console.log(`⏭️ Skipping subscription payment for session ${session.id}`);
        return new NextResponse("ok", { status: 200 });
      }

      // Idempotency check: prevent duplicate order creation
      if (session.metadata?.orderCreated === 'true') {
        console.log(`⚠️ Order already created for session ${session.id}, skipping`);
        return new NextResponse("ok", { status: 200 });
      }

      // Check if order already exists (idempotency)
      const existingOrder = await prisma.order.findFirst({
        where: { stripeSessionId: session.id }
      });

      if (existingOrder) {
        console.log(`✅ Order ${existingOrder.id} already exists for session ${session.id}`);
        return new NextResponse("ok", { status: 200 });
      }
      
      // Handle order creation
      try {
        // Validate required metadata
        const buyerId = session.metadata?.buyerId;
        if (!buyerId) {
          console.error(`❌ Webhook: No buyerId in metadata for session ${session.id}`);
          // Check if order already exists (might be a retry)
          const existingOrder = await prisma.order.findFirst({
            where: { stripeSessionId: session.id }
          });
          if (existingOrder) {
            console.log(`✅ Order already exists for session ${session.id}, returning OK`);
            return new NextResponse("ok", { status: 200 });
          }
          // If no order exists and no buyerId, return error
          return new NextResponse("Missing buyerId in metadata", { status: 400 });
        }

        // Parse items from metadata
        let items: Array<any> = [];
        if (session.metadata?.items || session.metadata?.items_compact_1) {
          if (session.metadata?.items) {
            try {
              items = JSON.parse(session.metadata.items);
            } catch (parseError: any) {
              console.warn(`⚠️ Failed to parse items JSON for session ${session.id}:`, parseError.message);
              // Continue to try compact format
            }
          }
          
          if (!items.length) {
            const itemChunks = Object.entries(session.metadata || {})
              .filter(([key]) => key.startsWith('items_compact_'))
              .sort(([a], [b]) => (a > b ? 1 : a < b ? -1 : 0))
              .map(([, value]) => value)
              .filter(Boolean) as string[];

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
              }).filter(item => item.productId && item.quantity > 0 && item.priceCents > 0); // Filter invalid items
            }
          }
        }

        // Validate items
        if (!items.length) {
          console.error(`❌ Webhook: No valid items found in metadata for session ${session.id}`);
          // Check if order already exists (might be a retry)
          const existingOrder = await prisma.order.findFirst({
            where: { stripeSessionId: session.id }
          });
          if (existingOrder) {
            console.log(`✅ Order already exists for session ${session.id}, returning OK`);
            return new NextResponse("ok", { status: 200 });
          }
          return new NextResponse("No valid items in metadata", { status: 400 });
        }

        console.log(`🔍 Webhook: Creating order for buyerId: ${buyerId}, sessionId: ${session.id}, items: ${items.length}`);
        
        const metadata = session.metadata || {};
        const deliveryMode = metadata.deliveryMode;
        const address = metadata.address;
        const notes = metadata.notes;
        const pickupDate = metadata.pickupDate;
        const deliveryDate = metadata.deliveryDate;
        const amountPaidCents = metadata.amountPaidCents ? parseInt(metadata.amountPaidCents) : 0;
        const productsTotalCents = metadata.productsTotalCents ? parseInt(metadata.productsTotalCents) : 0;
        const deliveryFeeCents = metadata.deliveryFeeCents ? parseInt(metadata.deliveryFeeCents) : 0;
        
        // Safely parse deliveryFeeBreakdown
        let deliveryFeeBreakdown: { homecheffCut?: number } | null = null;
        if (metadata.deliveryFeeBreakdown) {
          try {
            deliveryFeeBreakdown = JSON.parse(metadata.deliveryFeeBreakdown) as { homecheffCut?: number };
          } catch (parseError: any) {
            console.warn(`⚠️ Failed to parse deliveryFeeBreakdown for session ${session.id}:`, parseError.message);
            // Continue without breakdown
          }
        }
        
        const stripeFeeCents = metadata.stripeFeeCents ? parseInt(metadata.stripeFeeCents) : 0;
        const enableSmsNotification = metadata.enableSmsNotification === 'true';

        // Map delivery mode to database enum
        const mappedDeliveryMode = (() => {
          const mode = deliveryMode;
          if (mode === 'SHIPPING') return 'SHIPPING';
          if (mode === 'LOCAL_DELIVERY' || mode === 'TEEN_DELIVERY' || mode === 'DELIVERY') return 'DELIVERY';
          if (mode === 'PICKUP') return 'PICKUP';
          return 'PICKUP'; // default fallback
        })();
        
        const isPickup = deliveryMode === 'PICKUP';
        const isDelivery = deliveryMode === 'DELIVERY' || deliveryMode === 'LOCAL_DELIVERY' || deliveryMode === 'TEEN_DELIVERY';
        const isShipping = deliveryMode === 'SHIPPING';

        // Use database transaction for atomicity (order + items + stock update)
        const order = await prisma.$transaction(async (tx) => {
          // Create order
          const newOrder = await tx.order.create({
            data: {
              userId: buyerId,
              orderNumber: await (await import('@/lib/orderNumberGenerator')).OrderNumberGenerator.generateOrderNumber(),
              status: 'CONFIRMED',
              stripeSessionId: session.id,
              totalAmount: amountPaidCents,
              deliveryMode: mappedDeliveryMode,
              pickupAddress: isPickup ? address : null,
              deliveryAddress: (isDelivery || isShipping) ? address : null,
              pickupDate: pickupDate ? new Date(pickupDate) : null,
              deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
              notes: notes,
              // Shipping fields (if shipping mode)
              shippingCostCents: (deliveryMode === 'SHIPPING' && deliveryFeeCents) ? deliveryFeeCents : null,
              paymentHeld: deliveryMode === 'SHIPPING', // Hold payment for shipping orders
              payoutTrigger: deliveryMode === 'SHIPPING' ? 'DELIVERED' : null, // Wait for delivery
            },
          });

          // Create order items and update stock atomically
          const createdOrderItems: Array<{ id: string; productId: string; orderItemId: string }> = [];
          
          for (const item of items) {
            // Check stock availability before decrementing (race condition prevention)
            const product = await tx.product.findUnique({
              where: { id: item.productId },
              select: { stock: true, maxStock: true }
            });

            if (!product) {
              throw new Error(`Product ${item.productId} not found`);
            }

            const availableStock = typeof product.stock === 'number' 
              ? product.stock 
              : typeof product.maxStock === 'number' 
                ? product.maxStock 
                : null;

            // Strict stock check: must have enough stock (not just >= 0)
            if (availableStock !== null) {
              if (availableStock <= 0) {
                throw new Error(`Product ${item.productId} is out of stock. Available: ${availableStock}, Requested: ${item.quantity}`);
              }
              if (availableStock < item.quantity) {
                throw new Error(`Insufficient stock for product ${item.productId}. Available: ${availableStock}, Requested: ${item.quantity}`);
              }
            }

            // Create order item
            const orderItem = await tx.orderItem.create({
              data: {
                orderId: newOrder.id,
                productId: item.productId,
                quantity: item.quantity,
                priceCents: item.priceCents,
              },
            });

            createdOrderItems.push({
              id: item.productId,
              productId: item.productId,
              orderItemId: orderItem.id
            });

            // Confirm stock reservation and update product stock atomically
            const reservation = await tx.stockReservation.findFirst({
              where: { 
                stripeSessionId: session.id,
                productId: item.productId,
                status: 'PENDING'
              },
              select: { id: true, status: true }
            });

            if (reservation && reservation.status === 'PENDING') {
              // Update reservation to CONFIRMED
              await tx.stockReservation.update({
                where: { id: reservation.id },
                data: { status: 'CONFIRMED' }
              });
            }

            // Update product stock (within transaction for atomicity)
            // Only decrement if stock is not null (products with stock management)
            if (product.stock !== null && typeof product.stock === 'number') {
              // Use decrement which is atomic and prevents negative stock
              const updatedProduct = await tx.product.update({
                where: { id: item.productId },
                data: {
                  stock: {
                    decrement: item.quantity,
                  },
                },
                select: { stock: true }
              });

              // Verify stock didn't go negative (safety check)
              if (updatedProduct.stock !== null && updatedProduct.stock < 0) {
                throw new Error(`Stock went negative for product ${item.productId}. This should not happen.`);
              }
            }
          }

          console.log(`✅ Webhook: Order created successfully - OrderId: ${newOrder.id}, BuyerId: ${buyerId}, StripeSessionId: ${session.id}`);
          return { order: newOrder, orderItems: createdOrderItems };
        });

        const createdOrder = order.order;
        const createdOrderItems = order.orderItems;

        // Get unique seller IDs from items
        let sellerIds = [...new Set(items.map((item: any) => item.sellerId).filter(Boolean))] as string[];
        if (sellerIds.length === 0) {
          const fallbackProducts = await prisma.product.findMany({
            where: {
              id: {
                in: items.map((item: any) => item.productId).filter(Boolean),
              },
            },
            select: {
              seller: {
                select: {
                  User: {
                    select: { id: true },
                  },
                },
              },
            },
          });

          sellerIds = fallbackProducts
            .map((product) => product.seller?.User?.id)
            .filter((id): id is string => Boolean(id));
        }

        // Create order conversation for communication
        const conversation = await prisma.conversation.create({
          data: {
            id: `order_${createdOrder.id}`,
            orderId: createdOrder.id,
            title: `Bestelling ${createdOrder.orderNumber}`,
            lastMessageAt: new Date(),
            ConversationParticipant: {
              create: [
                { userId: buyerId, id: `participant_buyer_${Date.now()}` },
                // Add seller participants based on items
                ...sellerIds.map((sellerId: string, index: number) => ({
                  id: `participant_seller_${Date.now()}_${index}`,
                  userId: sellerId,
                })),
              ],
            },
          },
        });

        // Send system message with pickup/delivery details
        if (deliveryMode === 'PICKUP') {
          // Get seller details for pickup address
          // NOTE: sellerIds contains User.id values, not SellerProfile.id values
          for (const sellerUserId of sellerIds) {
            const seller = await prisma.sellerProfile.findUnique({
              where: { userId: sellerUserId as string },
              include: {
                User: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
                    place: true,
                    city: true,
                    postalCode: true,
                    phoneNumber: true
                  }
                }
              }
            });

            if (seller?.User) {
              const pickupAddress = [
                seller.User.address,
                seller.User.postalCode,
                seller.User.city || seller.User.place
              ].filter(Boolean).join(', ') || 'Adres niet beschikbaar';

              const pickupMessage = `📦 **Afhaaladres**\n\n` +
                `Verkoper: ${seller.User.name}\n` +
                `Adres: ${pickupAddress}\n` +
                (seller.User.phoneNumber ? `Telefoon: ${seller.User.phoneNumber}\n` : '') +
                `\nNeem contact op met de verkoper om een afhaaltijd af te spreken.`;

              await prisma.message.create({
                data: {
                  id: `msg_pickup_${createdOrder.id}_${Date.now()}`,
                  conversationId: conversation.id,
                  senderId: seller.User.id,
                  text: pickupMessage,
                  messageType: 'SYSTEM',
                  isEncrypted: false,
                },
              });

            }
          }
        }

        // Send notification to ALL available deliverers if delivery mode
        if (deliveryMode === 'DELIVERY' || deliveryMode === 'TEEN_DELIVERY') {
          try {
            // Get buyer coordinates from metadata
            const coordinates = session.metadata?.coordinates 
              ? JSON.parse(session.metadata.coordinates) 
              : null;

            if (coordinates?.lat && coordinates?.lng) {
              // Find all available deliverers within range
              const availableDeliverers = await prisma.deliveryProfile.findMany({
                where: {
                  isActive: true,
                  user: {
                    lat: { not: null },
                    lng: { not: null }
                  }
                },
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      lat: true,
                      lng: true
                    }
                  }
                }
              });

              // Get all products in order to check seller locations
              const orderProducts = await prisma.product.findMany({
                where: {
                  id: { in: items.map((item: any) => item.productId) }
                },
                include: {
                  seller: {
                    include: {
                      User: {
                        select: {
                          lat: true,
                          lng: true
                        }
                      }
                    }
                  }
                }
              });


              // Create delivery orders for each product and notify available deliverers
              for (const item of items) {
                const product = orderProducts.find(p => p.id === item.productId);
                if (!product?.seller?.User?.lat || !product?.seller?.User?.lng) continue;

                // Create a single delivery order for this product (unassigned)
                const deliveryOrder = await prisma.deliveryOrder.create({
                  data: {
                    id: `delivery_${createdOrder.id}_${item.productId}_${Date.now()}`,
                    order: {
                      connect: { id: createdOrder.id }
                    },
                    ...(item.productId
                      ? {
                          product: { connect: { id: item.productId } }
                        }
                      : {}),
                    status: 'PENDING',
                    deliveryAddress: address || '',
                    deliveryFee: deliveryFeeCents || 200,
                    estimatedTime: deliveryDate ? 60 : null,
                  }
                });

                // Filter deliverers who are within range of BOTH seller and buyer
                const eligibleDeliverers = availableDeliverers.filter(deliverer => {
                  if (!deliverer.user.lat || !deliverer.user.lng) return false;

                  const distanceToSeller = calculateDistance(
                    deliverer.user.lat,
                    deliverer.user.lng,
                    product.seller.User.lat!,
                    product.seller.User.lng!
                  );

                  const distanceToBuyer = calculateDistance(
                    deliverer.user.lat,
                    deliverer.user.lng,
                    coordinates.lat,
                    coordinates.lng
                  );

                  return distanceToSeller <= deliverer.maxDistance && 
                         distanceToBuyer <= deliverer.maxDistance;
                });

                // Notify ALL eligible deliverers using new notification service
                for (const deliverer of eligibleDeliverers) {
                  const distanceToBuyer = calculateDistance(
                    deliverer.user.lat!,
                    deliverer.user.lng!,
                    coordinates.lat,
                    coordinates.lng
                  );
                  
                  await NotificationService.sendDeliveryOrderAvailableNotification(
                    deliverer.user.id,
                    deliveryOrder.id,
                    createdOrder.id,
                    (await import('@/lib/orderNumberGenerator')).OrderNumberGenerator.getDisplayNumber(createdOrder.orderNumber, createdOrder.id),
                    deliveryFeeCents || 200,
                    distanceToBuyer,
                    deliveryOrder.estimatedTime || 60
                  );
                }

              }
            } else {
              console.warn('⚠️ No coordinates available for deliverer matching');
            }
          } catch (delivererError) {
            console.error('Error notifying deliverers:', delivererError);
            // Don't fail the whole process if deliverer notification fails
          }
        }

        // Send notifications: Order placed and payment received
        try {
          // Get buyer info for notification
          const buyer = await prisma.user.findUnique({
            where: { id: buyerId },
            select: { name: true, email: true }
          });

          const buyerName = buyer?.name || 'Een klant';

          // 1. Notificatie naar koper: Bestelling geplaatst
          await NotificationService.sendOrderPlacedNotification(
            buyerId,
            createdOrder.id,
            (await import('@/lib/orderNumberGenerator')).OrderNumberGenerator.getDisplayNumber(createdOrder.orderNumber, createdOrder.id)
          );

          // 2. Notificatie naar koper: Betaling ontvangen
          // 3. Notificatie naar verkoper: Nieuwe bestelling + Betaling ontvangen
          for (const sellerId of sellerIds) {
            const seller = await prisma.user.findUnique({
              where: { id: sellerId },
              select: { 
                id: true, 
                name: true, 
                email: true, 
                phoneNumber: true 
              }
            });

            if (!seller) continue;

            // Nieuwe bestelling notificatie (inclusief SMS als verkoper dit heeft ingeschakeld in preferences)
            await NotificationService.sendNewOrderNotification(
              seller.id,
              createdOrder.id,
              (await import('@/lib/orderNumberGenerator')).OrderNumberGenerator.getDisplayNumber(createdOrder.orderNumber, createdOrder.id),
              buyerName,
              amountPaidCents
            );

            // Betaling ontvangen notificatie
            await NotificationService.sendOrderPaidNotification(
              buyerId,
              seller.id,
              createdOrder.id,
              (await import('@/lib/orderNumberGenerator')).OrderNumberGenerator.getDisplayNumber(createdOrder.orderNumber, createdOrder.id),
              amountPaidCents
            );

            // SMS notificatie indien koper heeft betaald voor SMS (optioneel, betaald door koper)
            // Dit is een extra SMS bovenop de SMS die de verkoper krijgt via zijn preferences
            if (enableSmsNotification && seller.phoneNumber) {
              try {
                await NotificationService.send({
                  userId: seller.id,
                  message: {
                    title: `📦 Nieuwe bestelling #${createdOrder.orderNumber}`,
                    body: `${buyerName} heeft een bestelling geplaatst (€${(amountPaidCents / 100).toFixed(2)})`,
                    urgent: true,
                    data: {
                      type: 'NEW_ORDER_SMS',
                      orderId: createdOrder.id,
                      orderNumber: createdOrder.orderNumber,
                      paidByBuyer: true // Indicatie dat koper heeft betaald voor deze SMS
                    }
                  },
                  channels: ['sms'],
                  saveToDatabase: false
                });
                console.log(`✅ SMS sent to seller ${seller.id} for order ${createdOrder.orderNumber} (paid by buyer)`);
              } catch (smsError) {
                console.error(`❌ Failed to send SMS to seller ${seller.id}:`, smsError);
              }
            }
          }

          console.log(`✅ All notifications sent for order ${createdOrder.orderNumber}`);
        } catch (notificationError) {
          console.error('Error sending notifications:', notificationError);
          // Don't fail the whole process if notifications fail
        }

        // Generate review tokens and create review records for each order item
        // Reviews will be requested after order is delivered/completed
        try {
          const { generateReviewToken, getDefaultTokenExpiry } = await import('@/lib/review-tokens');
          
          for (const createdItem of createdOrderItems) {
            // Check if review already exists for this order item
            const existingReview = await prisma.productReview.findFirst({
              where: {
                orderItemId: createdItem.orderItemId,
                buyerId: buyerId,
                productId: createdItem.productId
              }
            });

            // Only create review record if it doesn't exist
            if (!existingReview) {
              const reviewToken = generateReviewToken();
              const tokenExpiry = getDefaultTokenExpiry();

              await prisma.productReview.create({
                data: {
                  id: `review_${createdOrder.id}_${createdItem.productId}_${Date.now()}`,
                  productId: createdItem.productId,
                  buyerId: buyerId,
                  orderId: createdOrder.id,
                  orderItemId: createdItem.orderItemId,
                  rating: 0, // Placeholder, will be set when review is submitted
                  reviewToken: reviewToken,
                  reviewTokenExpires: tokenExpiry,
                  isVerified: false // Will be set to true when review is submitted
                }
              });

              console.log(`✅ Review token created for order item ${createdItem.productId}`);
            }
          }
        } catch (reviewTokenError) {
          console.error('Error creating review tokens:', reviewTokenError);
          // Don't fail the whole process if review token creation fails
        }

        // 💰 CREATE PAYOUTS FOR SELLERS
        // Process each item in the order to create seller payouts
        for (const item of items) {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            include: {
              seller: {
                include: {
                  User: {
                    select: {
                      id: true,
                      stripeConnectAccountId: true,
                      stripeConnectOnboardingCompleted: true,
                      phoneNumber: true
                    }
                  }
                }
              }
            }
          });

          if (!product?.seller?.User) continue;

          const itemTotal = item.priceCents * item.quantity;
          
          // Calculate platform fee based on seller's subscription
          let platformFeePercentage = 12; // Default for individuals
          
          // Check if seller has a business subscription
          const sellerProfile = await prisma.sellerProfile.findUnique({
            where: { userId: product.seller.User.id },
            include: {
              Subscription: true
            }
          });
          
          if (sellerProfile?.Subscription) {
            // Use subscription fee (stored in basis points)
            platformFeePercentage = sellerProfile.Subscription.feeBps / 100;
          }
          
          const platformFeeCents = Math.round(itemTotal * platformFeePercentage / 100);
          
          // Calculate SMS costs if seller has SMS notifications enabled in preferences
          // SMS provider cost: ~€0.05 per SMS, platform fee: 20% = €0.01, total: €0.06 per seller
          const smsBaseCostCents = 5; // €0.05 base SMS cost
          const smsPlatformFeePercentage = 20; // 20% platform fee on SMS
          let smsCostCents = 0;
          
          // Check if seller has SMS notifications enabled in preferences
          const sellerPreferences = await prisma.$queryRaw<any[]>`
            SELECT "smsOrderUpdates" FROM "NotificationPreferences" 
            WHERE "userId" = ${product.seller.User.id}
            LIMIT 1
          `.then(rows => rows[0]).catch(() => null);
          
          // If seller has SMS enabled and has phone number, charge for SMS
          if (sellerPreferences?.smsOrderUpdates && product.seller.User.phoneNumber) {
            // Calculate SMS cost: base cost + platform fee percentage
            const smsPlatformFeeCents = Math.round(smsBaseCostCents * smsPlatformFeePercentage / 100);
            smsCostCents = smsBaseCostCents + smsPlatformFeeCents; // Total: €0.05 + €0.01 = €0.06
            console.log(`📱 SMS cost (€${(smsCostCents / 100).toFixed(2)}) will be deducted from seller ${product.seller.User.id} payout (base: €${(smsBaseCostCents / 100).toFixed(2)}, platform fee: €${(smsPlatformFeeCents / 100).toFixed(2)})`);
          }
          
          // Deduct SMS costs from seller payout
          const sellerPayoutCents = itemTotal - platformFeeCents - smsCostCents;

          // Check if this is a shipping order (needs escrow)
          const isShippingOrder = (mappedDeliveryMode as string) === 'SHIPPING';

          // Create transaction record (for tracking)
          // Note: reservationId is optional - we don't use reservations for orders    
          const transactionData: any = {
            id: `txn_${createdOrder.id}_${item.productId}_${Date.now()}`,
            buyerId: buyerId,
            sellerId: product.seller.User.id,
            amountCents: itemTotal,
            platformFeeBps: Math.round(platformFeePercentage * 100), // Convert to basis points
            status: 'CAPTURED',
            provider: 'STRIPE',
            providerRef: session.id,
            updatedAt: new Date()
          };
          const transaction = await prisma.transaction.create({
            data: transactionData
          });

          // For shipping orders: create escrow instead of immediate payout
          if (isShippingOrder) {
            // Create escrow to hold seller payment until delivery
            await prisma.paymentEscrow.create({
              data: {
                orderId: createdOrder.id,
                sellerId: product.seller.User.id,
                amountCents: sellerPayoutCents,
                payoutTrigger: 'DELIVERED', // Wait for delivery confirmation
                currentStatus: 'held',
              }
            });
            
            console.log(`💰 Escrow created for shipping order ${createdOrder.id}: €${(sellerPayoutCents / 100).toFixed(2)} (will be paid after delivery)`);
            
            // Still create payout record for tracking, but don't transfer yet
            const payout = await prisma.payout.create({
              data: {
                id: `payout_seller_${createdOrder.id}_${item.productId}_${Date.now()}`,
                transactionId: transaction.id,
                toUserId: product.seller.User.id,
                amountCents: sellerPayoutCents,
                providerRef: null // Will be set after delivery
              }
            });
            
            // Skip immediate Stripe transfer - will be done after delivery via webhook
            continue; // Skip to next item
          }

          // Create payout record for seller (SMS costs + platform fee already deducted)
          // For non-shipping orders: immediate payout
          const payout = await prisma.payout.create({
            data: {
              id: `payout_seller_${createdOrder.id}_${item.productId}_${Date.now()}`,
              transactionId: transaction.id,
              toUserId: product.seller.User.id,
              amountCents: sellerPayoutCents,
              providerRef: session.payment_intent as string || null
            }
          });
          
          // Log SMS cost deduction if applicable
          if (smsCostCents > 0) {
            const smsPlatformFeeCents = Math.round(smsBaseCostCents * smsPlatformFeePercentage / 100);
            console.log(`💰 SMS cost (€${(smsCostCents / 100).toFixed(2)}) deducted from seller ${product.seller.User.id} payout. Breakdown: base €${(smsBaseCostCents / 100).toFixed(2)} + platform fee €${(smsPlatformFeeCents / 100).toFixed(2)}. Original payout: €${((itemTotal - platformFeeCents) / 100).toFixed(2)}, After SMS: €${(sellerPayoutCents / 100).toFixed(2)}`);
          }

          // 💰 ACTUAL STRIPE TRANSFER TO CONNECT ACCOUNT
          // Note: SMS costs are already deducted from sellerPayoutCents
          if (product.seller.User.stripeConnectAccountId && sellerPayoutCents > 0) {
            try {
              const transfer = await stripe.transfers.create({
                amount: sellerPayoutCents,
                currency: 'eur',
                destination: product.seller.User.stripeConnectAccountId,
                transfer_group: `order_${createdOrder.id}`,
                metadata: {
                  orderId: createdOrder.id,
                  productId: item.productId,
                  sellerId: product.seller.User.id,
                  platformFeeCents: platformFeeCents.toString(),
                  smsCostCents: smsCostCents.toString(),
                  smsBaseCostCents: smsCostCents > 0 ? smsBaseCostCents.toString() : '0',
                  smsPlatformFeeCents: smsCostCents > 0 ? Math.round(smsBaseCostCents * smsPlatformFeePercentage / 100).toString() : '0',
                  homecheff_app: 'true'
                }
              });

              // Update payout with transfer reference
              await prisma.payout.update({
                where: { id: payout.id },
                data: { 
                  providerRef: transfer.id
                }
              });

              console.log(`✅ Transfer created for seller ${product.seller.User.id}: ${transfer.id}`);
            } catch (transferError: any) {
              console.error(`❌ Transfer failed for seller ${product.seller.User.id}:`, transferError.message);
              
              // Update payout as failed
              await prisma.payout.update({
                where: { id: payout.id },
                data: { 
                  providerRef: `failed_${Date.now()}`
                }
              });
            }
          }

          // 💰 PROCESS AFFILIATE COMMISSION FOR ORDER
          // Commission: 25% van HomeCheff fee per gebruiker (koper/verkoper)
          // Als beide zijn aangebracht: 50% (25% + 25%)
          if (platformFeeCents > 0) {
            try {
              const { processCommissionForOrder } = await import('@/lib/affiliate-commission');
              await processCommissionForOrder(
                `${createdOrder.id}_${item.productId}`,
                platformFeeCents,
                buyerId,
                product.seller.User.id,
                {
                  orderId: createdOrder.id,
                  productId: item.productId,
                  itemTotal: itemTotal.toString(),
                  platformFeePercentage: platformFeePercentage.toString(),
                }
              );
            } catch (commissionError: any) {
              console.error(`❌ Failed to process affiliate commission for order ${createdOrder.id}:`, commissionError.message);
              // Don't fail the whole process if commission processing fails
            }
          }

        }

        // 📦 AUTOMATICALLY CREATE SHIPPING LABEL FOR SHIPPING ORDERS
        // Check if order is shipping and no label exists yet
        if (deliveryMode === 'SHIPPING' || (mappedDeliveryMode as string) === 'SHIPPING') {
          try {
            // Check if label already exists
            const existingLabel = await prisma.shippingLabel.findFirst({
              where: { orderId: createdOrder.id }
            });

            if (!existingLabel) {
              // Fetch order with all necessary data for label creation
              const orderForLabel = await prisma.order.findUnique({
                where: { id: createdOrder.id },
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
                                  email: true,
                                  address: true,
                                  postalCode: true,
                                  city: true,
                                  country: true,
                                  phoneNumber: true
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  },
                  User: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      address: true,
                      postalCode: true,
                      city: true,
                      country: true,
                      phoneNumber: true
                    }
                  }
                }
              });

              if (orderForLabel && orderForLabel.items.length > 0) {
                const firstProduct = orderForLabel.items[0]?.Product;
                const sellerUser = firstProduct?.seller?.User;
                const buyerUser = orderForLabel.User;

                // Only create label if both seller and buyer have complete addresses
                if (sellerUser && buyerUser && 
                    sellerUser.postalCode && sellerUser.country &&
                    buyerUser.postalCode && buyerUser.country) {
                  
                  // Calculate weight and dimensions from products
                  const totalItems = orderForLabel.items.reduce((sum, item) => sum + item.quantity, 0);
                  const calculatedWeight = totalItems * 1.0; // 1kg per item
                  const calculatedDimensions = {
                    length: Math.max(30, Math.ceil(Math.sqrt(totalItems)) * 10),
                    width: 20,
                    height: Math.max(10, totalItems * 5),
                  };

                  // Create label request
                  const labelRequest: EctaroShipLabelRequest = {
                    orderId: createdOrder.id,
                    recipient: {
                      name: buyerUser.name || 'Buyer',
                      address: buyerUser.address || orderForLabel.deliveryAddress || '',
                      postalCode: buyerUser.postalCode,
                      city: buyerUser.city || '',
                      country: buyerUser.country,
                      email: buyerUser.email || undefined,
                      phone: buyerUser.phoneNumber || undefined,
                    },
                    sender: {
                      name: sellerUser.name || 'Seller',
                      address: sellerUser.address || '',
                      postalCode: sellerUser.postalCode,
                      city: sellerUser.city || '',
                      country: sellerUser.country,
                      email: sellerUser.email || undefined,
                      phone: sellerUser.phoneNumber || undefined,
                    },
                    weight: calculatedWeight,
                    dimensions: calculatedDimensions,
                    description: `Order ${orderForLabel.orderNumber || createdOrder.id}`,
                  };

                  // Create label via EctaroShip
                  const labelResult = await createShippingLabel(labelRequest);

                  if ('error' in labelResult) {
                    console.warn(`⚠️ Failed to auto-create shipping label for order ${createdOrder.id}: ${labelResult.error}`);
                  } else {
                    // Save label to database
                    await prisma.shippingLabel.create({
                      data: {
                        orderId: createdOrder.id,
                        ectaroShipLabelId: labelResult.labelId,
                        pdfUrl: labelResult.pdfUrl,
                        trackingNumber: labelResult.trackingNumber,
                        carrier: labelResult.carrier,
                        status: 'generated',
                        priceCents: Math.round(labelResult.price * 100),
                      }
                    });

                    // Update order with shipping info
                    await prisma.order.update({
                      where: { id: createdOrder.id },
                      data: {
                        shippingLabelId: labelResult.labelId,
                        shippingTrackingNumber: labelResult.trackingNumber,
                        shippingCarrier: labelResult.carrier,
                        shippingStatus: 'label_created',
                        shippingLabelCostCents: Math.round(labelResult.price * 100),
                      }
                    });

                    console.log(`✅ Shipping label automatically created for order ${createdOrder.id}: ${labelResult.labelId}`);
                    
                    // Notify seller that shipping label is ready
                    try {
                      await NotificationService.sendShippingLabelReadyNotification(
                        sellerUser.id,
                        createdOrder.id,
                        orderForLabel.orderNumber || createdOrder.id,
                        labelResult.trackingNumber
                      );
                      console.log(`📧 Shipping label ready notification sent to seller ${sellerUser.id}`);
                    } catch (notifError) {
                      console.error(`❌ Error sending shipping label notification:`, notifError);
                      // Don't fail the whole process if notification fails
                    }
                  }
                } else {
                  console.warn(`⚠️ Cannot auto-create shipping label for order ${createdOrder.id}: missing address information (seller: ${!!sellerUser?.postalCode}, buyer: ${!!buyerUser?.postalCode})`);
                }
              }
            } else {
              console.log(`ℹ️ Shipping label already exists for order ${createdOrder.id}`);
            }
          } catch (labelError: any) {
            console.error(`❌ Error auto-creating shipping label for order ${createdOrder.id}:`, labelError.message);
            // Don't fail the whole process if label creation fails
          }
        }

        // 💰 CREATE PAYOUT FOR DELIVERY (if applicable)
        if ((deliveryMode === 'DELIVERY' || deliveryMode === 'TEEN_DELIVERY') && deliveryFeeCents > 0) {
          // Find the delivery order(s) for this main order
          const deliveryOrders = await prisma.deliveryOrder.findMany({
            where: { orderId: createdOrder.id },
            include: {
              deliveryProfile: {
                include: {
                  user: {
                    select: {
                      id: true
                    }
                  }
                }
              }
            }
          });

          for (const deliveryOrder of deliveryOrders) {
            if (!deliveryOrder.deliveryProfile?.user?.id) continue;
            const deliveryProfileId = deliveryOrder.deliveryProfileId;
            if (!deliveryProfileId) continue;

            // Calculate deliverer payout (prefer detailed breakdown when available)
            const deliveryPlatformFee = deliveryFeeBreakdown?.homecheffCut ?? Math.round(deliveryFeeCents * 0.12);
            const delivererPayoutCents = deliveryFeeCents - deliveryPlatformFee;

            // Create transaction for delivery
            // Note: Delivery payouts are created when deliverer accepts and completes order
            // This is just a placeholder - actual payout happens in delivery status update                                                                                           
            const deliveryTransactionData: any = {
              id: `txn_delivery_${deliveryOrder.id}_${Date.now()}`,
              buyerId: buyerId,
              sellerId: deliveryOrder.deliveryProfile.user.id,
              amountCents: deliveryFeeCents,
              platformFeeBps: 1200, // 12% in basis points
              status: 'CAPTURED',
              provider: 'STRIPE',
              providerRef: session.id,
              updatedAt: new Date()
            };
            const deliveryTransaction = await prisma.transaction.create({
              data: deliveryTransactionData
            });

            // Create payout for deliverer (will be updated when order is delivered)
            await prisma.payout.create({
              data: {
                id: `payout_delivery_${deliveryOrder.id}_${Date.now()}`,
                transactionId: deliveryTransaction.id,
                toUserId: deliveryOrder.deliveryProfile.user.id,
                amountCents: delivererPayoutCents,
                providerRef: session.payment_intent as string || null
              }
            });

            // Update delivery profile earnings
            await prisma.deliveryProfile.update({
              where: { id: deliveryProfileId },
              data: {
                totalEarnings: {
                  increment: delivererPayoutCents
                }
              }
            });
          }
        }
      } catch (orderError: any) {
        console.error(`❌ CRITICAL: Failed to process order for session ${session.id}:`, orderError);
        
        // Check if order was already created (might have been created before error)
        const existingOrder = await prisma.order.findFirst({
          where: { stripeSessionId: session.id }
        });
        
        if (existingOrder) {
          console.log(`✅ Order ${existingOrder.id} exists for session ${session.id}, returning OK despite error`);
          return new NextResponse("ok", { status: 200 });
        }
        
        // Log full error details for debugging
        console.error('Error details:', {
          message: orderError.message,
          stack: orderError.stack,
          sessionId: session.id,
          buyerId: session.metadata?.buyerId,
          hasItems: !!(session.metadata?.items || session.metadata?.items_compact_1),
          metadataKeys: Object.keys(session.metadata || {})
        });
        
        // Only return 500 for retriable errors (e.g., database connection issues)
        // For validation errors (400), return 400 so Stripe doesn't retry
        const isRetriableError = 
          orderError.message?.includes('connect') ||
          orderError.message?.includes('timeout') ||
          orderError.message?.includes('ECONNREFUSED') ||
          orderError.code === 'P1001' || // Prisma connection error
          orderError.code === 'P1008' || // Prisma timeout
          orderError.code === 'P2002';    // Prisma unique constraint (might succeed on retry)
        
        const statusCode = isRetriableError ? 500 : 400;
        const errorMessage = isRetriableError 
          ? `Order processing failed (retriable): ${orderError.message}`
          : `Order processing failed (non-retriable): ${orderError.message}`;
        
        return new NextResponse(errorMessage, { status: statusCode });
      }
      
      // Handle subscription updates (existing code)
      const plan = session.metadata?.plan;
      const userId = session.metadata?.userId;
      if (plan && userId) {
        await prisma.subscription.upsert({
          where: { id: userId },
          update: {
            name: plan as any,
            isActive: true,
          },
          create: {
            id: userId,
            name: plan as any,
            isActive: true,
            priceCents: 0,
            feeBps: 0,
            durationDays: 0,
            updatedAt: new Date(),
          },
        });
      }
    }
  } catch (e) {
    console.error("Webhook handling error", e);
    return new NextResponse("Webhook handler failed", { status: 500 });
  }

  return new NextResponse("ok", { status: 200 });
}


