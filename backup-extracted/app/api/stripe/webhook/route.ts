import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { normalizeSubscriptionName, PLAN_TO_PRICE } from "@/lib/stripe";
import { NotificationService } from "@/lib/notifications/notification-service";

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
        if (session.metadata?.items || session.metadata?.items_compact_1) {
          let items: Array<any> = [];
        if (session.metadata?.items) {
          try {
            items = JSON.parse(session.metadata.items);
          } catch {
            // ignore legacy parsing errors
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
            });
          }
        }
        const buyerId = session.metadata.buyerId;
        console.log(`🔍 Webhook: Creating order for buyerId: ${buyerId}, sessionId: ${session.id}`);
        
        if (!buyerId) {
          console.error(`❌ Webhook: No buyerId in metadata for session ${session.id}`);
          throw new Error('buyerId is required in session metadata');
        }
        
        const deliveryMode = session.metadata.deliveryMode;
        const address = session.metadata.address;
        const notes = session.metadata.notes;
        const pickupDate = session.metadata.pickupDate;
        const deliveryDate = session.metadata.deliveryDate;
        const amountPaidCents = session.metadata.amountPaidCents ? parseInt(session.metadata.amountPaidCents) : 0;
        const productsTotalCents = session.metadata.productsTotalCents ? parseInt(session.metadata.productsTotalCents) : 0;
        const deliveryFeeCents = session.metadata.deliveryFeeCents ? parseInt(session.metadata.deliveryFeeCents) : 0;
        const deliveryFeeBreakdown = session.metadata.deliveryFeeBreakdown ? JSON.parse(session.metadata.deliveryFeeBreakdown) : null;
        const stripeFeeCents = session.metadata.stripeFeeCents ? parseInt(session.metadata.stripeFeeCents) : 0;
        const enableSmsNotification = session.metadata.enableSmsNotification === 'true';

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
              deliveryMode: (() => {
                const mode = deliveryMode;
                if (mode === 'LOCAL_DELIVERY' || mode === 'TEEN_DELIVERY') return 'DELIVERY';
                if (mode === 'PICKUP') return 'PICKUP';
                return 'PICKUP'; // default fallback
              })(),
              pickupAddress: deliveryMode === 'PICKUP' ? address : null,
              deliveryAddress: deliveryMode === 'DELIVERY' ? address : null,
              pickupDate: pickupDate ? new Date(pickupDate) : null,
              deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
              notes: notes,
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

              // Helper function to calculate distance
              function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
                const R = 6371;
                const dLat = (lat2 - lat1) * Math.PI / 180;
                const dLng = (lng2 - lng1) * Math.PI / 180;
                const a = 
                  Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                  Math.sin(dLng/2) * Math.sin(dLng/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                return R * c;
              }

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

          // Create payout record for seller (SMS costs + platform fee already deducted)
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
        } else {
          console.warn(`⚠️ No items found in session metadata for ${session.id}`);
        }
      } catch (orderError: any) {
        console.error(`❌ CRITICAL: Failed to process order for session ${session.id}:`, orderError);
        // Log full error details for debugging
        console.error('Error details:', {
          message: orderError.message,
          stack: orderError.stack,
          sessionId: session.id,
          buyerId: session.metadata?.buyerId,
          metadata: session.metadata
        });
        // Return 500 so Stripe will retry
        return new NextResponse(`Order processing failed: ${orderError.message}`, { status: 500 });
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


