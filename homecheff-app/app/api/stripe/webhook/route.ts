import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

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
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Handle order creation
      if (session.metadata?.items) {
        const items = JSON.parse(session.metadata.items);
        const buyerId = session.metadata.buyerId;
        const deliveryMode = session.metadata.deliveryMode;
        const address = session.metadata.address;
        const notes = session.metadata.notes;
        const pickupDate = session.metadata.pickupDate;
        const deliveryDate = session.metadata.deliveryDate;
        const totalAmount = parseInt(session.metadata.totalAmount);
        const deliveryFeeCents = session.metadata.deliveryFeeCents ? parseInt(session.metadata.deliveryFeeCents) : 0;

        // Create order
        const order = await prisma.order.create({
          data: {
            userId: buyerId,
            orderNumber: `ORD-${Date.now()}`,
            status: 'CONFIRMED',
            totalAmount: totalAmount,
            deliveryMode: deliveryMode as any,
            pickupAddress: deliveryMode === 'PICKUP' ? address : null,
            deliveryAddress: deliveryMode === 'DELIVERY' ? address : null,
            pickupDate: pickupDate ? new Date(pickupDate) : null,
            deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
            notes: notes,
          },
        });

        // Create order items
        for (const item of items) {
          await prisma.orderItem.create({
            data: {
              orderId: order.id,
              productId: item.productId,
              quantity: item.quantity,
              priceCents: item.priceCents,
            },
          });

          // Update product stock
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }

        // Get unique seller IDs from items
        const sellerIds = [...new Set(items.map((item: any) => item.sellerId))];

        // Create order conversation for communication
        const conversation = await prisma.conversation.create({
          data: {
            id: `order_${order.id}`,
            orderId: order.id,
            title: `Bestelling ${order.orderNumber}`,
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

        console.log(`✅ Order created: ${order.id} for user: ${buyerId}`);
        console.log(`✅ Conversation created: ${conversation.id}`);

        // Send system message with pickup/delivery details
        if (deliveryMode === 'PICKUP') {
          // Get seller details for pickup address
          for (const sellerId of sellerIds) {
            const seller = await prisma.sellerProfile.findUnique({
              where: { id: sellerId as string },
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
                  id: `msg_pickup_${order.id}_${Date.now()}`,
                  conversationId: conversation.id,
                  senderId: seller.User.id,
                  text: pickupMessage,
                  messageType: 'SYSTEM',
                  isEncrypted: false,
                },
              });

              console.log(`✅ Pickup address message sent for seller ${seller.User.name}`);
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
                    id: `delivery_${order.id}_${item.productId}_${Date.now()}`,
                    orderId: order.id,
                    deliveryProfileId: '', // Unassigned - first to accept gets it
                    productId: item.productId,
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

                console.log(`📢 Found ${eligibleDeliverers.length} eligible deliverers for product ${item.productId}`);

                // Notify ALL eligible deliverers
                for (const deliverer of eligibleDeliverers) {
                  await prisma.notification.create({
                    data: {
                      id: `notif_delivery_${deliveryOrder.id}_${deliverer.id}_${Date.now()}`,
                      userId: deliverer.user.id,
                      type: 'NEW_LISTING_NEARBY',
                      payload: {
                        title: '🔔 Nieuwe bezorgopdracht beschikbaar!',
                        message: `Bestelling ${order.orderNumber} - ${item.title}. Eerste die accepteert krijgt de opdracht!`,
                        orderId: order.id,
                        orderNumber: order.orderNumber,
                        deliveryOrderId: deliveryOrder.id,
                        deliveryFee: deliveryFeeCents || 200,
                        productTitle: item.title,
                        pickupAddress: address,
                        link: `/delivery/dashboard`
                      }
                    }
                  });
                }

                console.log(`✅ Notified ${eligibleDeliverers.length} deliverers for order ${order.orderNumber}`);
              }
            } else {
              console.warn('⚠️ No coordinates available for deliverer matching');
            }
          } catch (delivererError) {
            console.error('Error notifying deliverers:', delivererError);
            // Don't fail the whole process if deliverer notification fails
          }
        }

        console.log(`✅ Order processing complete for ${order.orderNumber}`);

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
                      stripeConnectOnboardingCompleted: true
                    }
                  }
                }
              }
            }
          });

          if (!product?.seller?.User) continue;

          const itemTotal = item.priceCents * item.quantity;
          
          // Calculate platform fee (12% for individuals, varies for business)
          const platformFeePercentage = 12; // Default to 12% for now
          const platformFeeCents = Math.round(itemTotal * platformFeePercentage / 100);
          const sellerPayoutCents = itemTotal - platformFeeCents;

          // Create transaction record (for tracking)
          const transaction = await prisma.transaction.create({
            data: {
              id: `txn_${order.id}_${item.productId}_${Date.now()}`,
              reservationId: `res_${order.id}_${item.productId}`, // Dummy reservation for order
              buyerId: buyerId,
              sellerId: product.seller.User.id,
              amountCents: itemTotal,
              platformFeeBps: platformFeePercentage * 100, // Convert to basis points
              status: 'CAPTURED',
              provider: 'STRIPE',
              providerRef: session.id,
              updatedAt: new Date()
            }
          });

          // Create payout record for seller
          await prisma.payout.create({
            data: {
              id: `payout_seller_${order.id}_${item.productId}_${Date.now()}`,
              transactionId: transaction.id,
              toUserId: product.seller.User.id,
              amountCents: sellerPayoutCents,
              providerRef: session.payment_intent as string || null
            }
          });

          console.log(`💰 Payout created for seller ${product.seller.User.id}: €${(sellerPayoutCents / 100).toFixed(2)}`);
        }

        // 💰 CREATE PAYOUT FOR DELIVERY (if applicable)
        if ((deliveryMode === 'DELIVERY' || deliveryMode === 'TEEN_DELIVERY') && deliveryFeeCents > 0) {
          // Find the delivery order(s) for this main order
          const deliveryOrders = await prisma.deliveryOrder.findMany({
            where: { orderId: order.id },
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

            // Calculate deliverer payout (88% of delivery fee, 12% platform cut)
            const deliveryPlatformFee = Math.round(deliveryFeeCents * 0.12);
            const delivererPayoutCents = deliveryFeeCents - deliveryPlatformFee;

            // Create transaction for delivery
            const deliveryTransaction = await prisma.transaction.create({
              data: {
                id: `txn_delivery_${deliveryOrder.id}_${Date.now()}`,
                reservationId: `res_delivery_${order.id}`,
                buyerId: buyerId,
                sellerId: deliveryOrder.deliveryProfile.user.id,
                amountCents: deliveryFeeCents,
                platformFeeBps: 1200, // 12% in basis points
                status: 'CAPTURED',
                provider: 'STRIPE',
                providerRef: session.id,
                updatedAt: new Date()
              }
            });

            // Create payout for deliverer
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
              where: { id: deliveryOrder.deliveryProfileId },
              data: {
                totalEarnings: {
                  increment: delivererPayoutCents
                }
              }
            });

            console.log(`💰 Delivery payout created for ${deliveryOrder.deliveryProfile.user.id}: €${(delivererPayoutCents / 100).toFixed(2)}`);
          }
        }

        console.log(`✅ All payouts processed for order ${order.orderNumber}`);
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
