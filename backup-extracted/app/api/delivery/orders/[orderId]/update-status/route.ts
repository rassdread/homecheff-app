import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/notifications/notification-service';

export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const { orderId } = params;
    const { status, notes } = await req.json();

    // Validate status
    const validStatuses = ['ACCEPTED', 'PICKED_UP', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Ongeldige status' 
      }, { status: 400 });
    }

    // Get user's delivery profile
    const profile = await prisma.deliveryProfile.findUnique({
      where: { userId: (session.user as any).id }
    });

    if (!profile) {
      return NextResponse.json({ 
        error: 'Geen bezorger profiel gevonden' 
      }, { status: 404 });
    }

    // Update delivery order status
    const updateData: any = {
      status,
      notes: notes || null
    };

    // Add timestamp for specific statuses
    if (status === 'PICKED_UP') {
      updateData.pickedUpAt = new Date();
    } else if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
      
      // Stop countdown and calculate actual delivery time
      const { DeliveryCountdownService } = await import('@/lib/delivery-countdown');
      const actualDeliveryTime = await DeliveryCountdownService.calculateActualDeliveryTime(orderId);
      if (actualDeliveryTime !== null) {
        updateData.actualDeliveryTime = actualDeliveryTime;
        await DeliveryCountdownService.stopCountdown(orderId, actualDeliveryTime);
      } else {
        await DeliveryCountdownService.stopCountdown(orderId);
      }
      
      // Update delivery profile stats
      await prisma.deliveryProfile.update({
        where: { id: profile.id },
        data: {
          totalDeliveries: { increment: 1 },
          totalEarnings: { increment: profile.totalEarnings || 0 } // Will be updated with actual fee
        }
      });
    }

    const updatedOrder = await prisma.deliveryOrder.update({
      where: {
        id: orderId,
        deliveryProfileId: profile.id
      },
      data: updateData,
      include: {
        order: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            items: {
              include: {
                Product: {
                  include: {
                    seller: {
                      include: {
                        User: {
                          select: {
                            id: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Send notifications based on status
    try {
      const { OrderNumberGenerator } = await import('@/lib/orderNumberGenerator');
      const orderNumber = OrderNumberGenerator.getDisplayNumber(updatedOrder.order.orderNumber, updatedOrder.orderId);
      const sellerId = updatedOrder.order.items[0]?.Product?.seller?.User?.id;

      if (status === 'PICKED_UP') {
        await NotificationService.sendDeliveryPickedUpNotification(
          updatedOrder.order.User.id, // buyer
          sellerId || updatedOrder.order.User.id, // seller
          (session.user as any).id, // deliverer
          updatedOrder.orderId,
          orderNumber
        );
      } else if (status === 'DELIVERED') {
        await NotificationService.sendDeliveryCompletedNotification(
          updatedOrder.order.User.id, // buyer
          sellerId || updatedOrder.order.User.id, // seller
          (session.user as any).id, // deliverer
          updatedOrder.orderId,
          orderNumber,
          updatedOrder.deliveryFee
        );
      }
    } catch (notifError) {
      console.error('Error sending status update notifications:', notifError);
      // Don't fail the request if notifications fail
    }

    // If delivered, trigger payout to delivery person
    if (status === 'DELIVERED') {
      await triggerDeliveryPayout(updatedOrder, profile);
      
      // Also update main order status to DELIVERED if all delivery orders are delivered
      const allDeliveryOrders = await prisma.deliveryOrder.findMany({
        where: { orderId: updatedOrder.order.id }
      });
      
      const allDelivered = allDeliveryOrders.every(orderEntry => orderEntry.status === 'DELIVERED');
      
      if (allDelivered) {
        // Update main order status
        await prisma.order.update({
          where: { id: updatedOrder.order.id },
          data: { status: 'DELIVERED' }
        });
        
        // Trigger review requests (same logic as in orders/[orderId]/update)
        try {
          const { sendReviewRequestEmail } = await import('@/lib/email');
          const { NotificationService } = await import('@/lib/notifications/notification-service');
          
          const orderWithItems = await prisma.order.findUnique({
            where: { id: updatedOrder.order.id },
            include: {
              items: {
                include: {
                  Product: {
                    include: {
                      Image: {
                        take: 1,
                        select: { fileUrl: true }
                      },
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
              },
              User: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          });

          if (orderWithItems) {
            for (const item of orderWithItems.items) {
              const review = await prisma.productReview.findFirst({
                where: {
                  orderId: updatedOrder.order.id,
                  orderItemId: item.id,
                  buyerId: orderWithItems.User.id,
                  productId: item.Product.id
                }
              });

              if (!review || !review.reviewToken || review.reviewSubmittedAt) continue;
              if (review.reviewTokenExpires && new Date() > review.reviewTokenExpires) continue;

              const sellerName = item.Product.seller?.User?.name || 
                                item.Product.seller?.User?.username || 
                                'Verkoper';
              const productImage = item.Product.Image[0]?.fileUrl || undefined;
              const reviewUrl = `${process.env.NEXTAUTH_URL || 'https://homecheff.nl'}/review/${review.reviewToken}`;

              // Send email
              try {
                await sendReviewRequestEmail({
                  email: orderWithItems.User.email,
                  buyerName: orderWithItems.User.name || 'Klant',
                  orderNumber: (await import('@/lib/orderNumberGenerator')).OrderNumberGenerator.getDisplayNumber(orderWithItems.orderNumber, orderWithItems.id),
                  productTitle: item.Product.title,
                  productImage: productImage,
                  reviewToken: review.reviewToken,
                  sellerName: sellerName
                });
              } catch (emailError) {
                console.error(`❌ Failed to send review request email:`, emailError);
              }

              // Send notification
              try {
                await NotificationService.send({
                  userId: orderWithItems.User.id,
                  message: {
                    title: `⭐ Review verzoek: ${item.Product.title}`,
                    body: `Je bestelling is voltooid! Help andere gebruikers door een review achter te laten voor ${item.Product.title}.`,
                    urgent: false,
                    data: {
                      type: 'REVIEW_REQUEST',
                      orderId: updatedOrder.order.id,
                      orderNumber: (await import('@/lib/orderNumberGenerator')).OrderNumberGenerator.getDisplayNumber(orderWithItems.orderNumber, orderWithItems.id),
                      productId: item.Product.id,
                      productTitle: item.Product.title,
                      reviewToken: review.reviewToken,
                      link: reviewUrl
                    }
                  },
                  channels: ['push'],
                  saveToDatabase: true
                });
              } catch (notificationError) {
                console.error(`❌ Failed to send review notification:`, notificationError);
              }
            }
          }
        } catch (reviewError) {
          console.error('Error sending review requests:', reviewError);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      order: updatedOrder 
    });

  } catch (error) {
    console.error('Order status update error:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het updaten van de bestelling' 
    }, { status: 500 });
  }
}

async function triggerDeliveryPayout(deliveryOrder: any, profile: any) {
  try {
    // Calculate delivery person's cut (88% of delivery fee)
    const deliveryPersonCut = Math.round(deliveryOrder.deliveryFee * 0.88);
    const homecheffCut = deliveryOrder.deliveryFee - deliveryPersonCut;

    // Create payout record
    await prisma.payout.create({
      data: {
        id: `payout_${Date.now()}`,
        toUserId: profile.userId,
        amountCents: deliveryPersonCut,
        transactionId: deliveryOrder.orderId
      }
    });

    // TODO: In production, integrate with Stripe Connect for actual payout
    // await stripe.transfers.create({
    //   amount: deliveryPersonCut,
    //   currency: 'eur',
    //   destination: profile.stripeConnectAccountId,
    //   metadata: {
    //     deliveryOrderId: deliveryOrder.id,
    //     type: 'delivery_fee'
    //   }
    // });

  } catch (error) {
    console.error('Error triggering delivery payout:', error);
  }
}
