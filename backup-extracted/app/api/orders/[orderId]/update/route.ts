import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { OrderMessagingService } from '@/lib/orderMessaging';

const prisma = new PrismaClient();

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = params;
    const { 
      status, 
      pickupAddress, 
      deliveryAddress, 
      pickupDate, 
      deliveryDate,
      notes 
    } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get order with seller info
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            Product: {
              include: {
                seller: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if user is the seller for this order
    const isSeller = order.items.some(item => item.Product.seller.userId === user.id);
    
    if (!isSeller && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        ...(status && { status }),
        ...(pickupAddress && { pickupAddress }),
        ...(deliveryAddress && { deliveryAddress }),
        ...(pickupDate && { pickupDate: new Date(pickupDate) }),
        ...(deliveryDate && { deliveryDate: new Date(deliveryDate) }),
        ...(notes && { notes })
      }
    });

    // Send automatic update message if status changed
    if (status) {
      try {
        await OrderMessagingService.updateOrderStatus(orderId, status, {
          pickupAddress: updatedOrder.pickupAddress || undefined,
          deliveryAddress: updatedOrder.deliveryAddress || undefined,
          pickupDate: updatedOrder.pickupDate || undefined,
          deliveryDate: updatedOrder.deliveryDate || undefined,
          notes: updatedOrder.notes || undefined
        });
        console.log(`✅ OrderMessagingService executed for order ${orderId}`);
      } catch (msgError) {
        console.error(`❌ OrderMessagingService failed for order ${orderId}:`, msgError);
        // Continue with notifications even if messaging fails
      }

      // Send notification to buyer about status update
      try {
        const { NotificationService } = await import('@/lib/notifications/notification-service');
        
        // Get buyer info
        const orderWithBuyer = await prisma.order.findUnique({
          where: { id: orderId },
          select: {
            userId: true, // Buyer
            orderNumber: true,
            items: {
              include: {
                Product: {
                  include: {
                    seller: {
                      include: {
                        User: {
                          select: { name: true, username: true }
                        }
                      }
                    }
                  }
                }
              },
              take: 1
            }
          }
        });

        if (orderWithBuyer) {
          const sellerName = orderWithBuyer.items[0]?.Product?.seller?.User?.name || 
                            orderWithBuyer.items[0]?.Product?.seller?.User?.username || 
                            'Verkoper';

          // Send status update notification
          await NotificationService.sendOrderNotification(
            orderWithBuyer.userId,
            orderId,
            (await import('@/lib/orderNumberGenerator')).OrderNumberGenerator.getDisplayNumber(orderWithBuyer.orderNumber, orderId),
            status, // CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED
            {
              sellerName,
              link: `/orders/${orderId}`
            }
          );

          // Send additional push notification for important status changes
          const statusMessages = {
            'PROCESSING': `🔄 Je bestelling wordt klaargezet door ${sellerName}`,
            'SHIPPED': `🚚 Je bestelling is klaar! ${updatedOrder.deliveryMode === 'PICKUP' ? 'Je kunt het ophalen' : 'Het wordt bezorgd'}`,
            'DELIVERED': `🎉 Je bestelling is bezorgd! Laat een review achter voor ${sellerName}`
          };

          if (statusMessages[status as keyof typeof statusMessages]) {
            await NotificationService.send({
              userId: orderWithBuyer.userId,
              message: {
                title: `Bestelling ${orderWithBuyer.orderNumber}`,
                body: statusMessages[status as keyof typeof statusMessages],
                urgent: status === 'SHIPPED' || status === 'DELIVERED',
                data: {
                  type: 'ORDER_STATUS_UPDATE',
                  orderId: orderId,
                  orderNumber: orderWithBuyer.orderNumber,
                  status: status,
                  link: `/orders/${orderId}`
                }
              },
              channels: ['push'],
              saveToDatabase: true
            });
          }

          console.log(`✅ Notifications sent for order ${orderId} status ${status}`);
        }
      } catch (notificationError) {
        console.error(`❌ Notification failed for order ${orderId}:`, notificationError);
        // Don't fail the order update if notifications fail
      }
    }

    // If order is marked as DELIVERED, trigger review requests
    if (status === 'DELIVERED') {
      try {
        const { sendReviewRequestEmail } = await import('@/lib/email');
        const { NotificationService } = await import('@/lib/notifications/notification-service');
        
        // Get order with items and buyer
        const orderWithItems = await prisma.order.findUnique({
          where: { id: orderId },
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
          // Send review requests for each product
          for (const item of orderWithItems.items) {
            // Find review record for this order item
            const review = await prisma.productReview.findFirst({
              where: {
                orderId: orderId,
                orderItemId: item.id,
                buyerId: orderWithItems.User.id,
                productId: item.Product.id
              }
            });

            if (!review || !review.reviewToken || review.reviewSubmittedAt) {
              continue; // Review already submitted or token doesn't exist
            }

            // Check if token is still valid
            if (review.reviewTokenExpires && new Date() > review.reviewTokenExpires) {
              continue; // Token expired
            }

            const sellerName = item.Product.seller?.User?.name || 
                              item.Product.seller?.User?.username || 
                              'Verkoper';
            const productImage = item.Product.Image[0]?.fileUrl || undefined;
            const reviewUrl = `${process.env.NEXTAUTH_URL || 'https://homecheff.nl'}/review/${review.reviewToken}`;

            // Send review request email
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
              console.log(`✅ Review request email sent for product ${item.Product.id}`);
            } catch (emailError) {
              console.error(`❌ Failed to send review request email:`, emailError);
            }

            // Send review link in berichtenbox
            try {
              await NotificationService.send({
                userId: orderWithItems.User.id,
                message: {
                  title: `⭐ Review verzoek: ${item.Product.title}`,
                  body: `Je bestelling is voltooid! Help andere gebruikers door een review achter te laten voor ${item.Product.title}.`,
                  urgent: false,
                  data: {
                    type: 'REVIEW_REQUEST',
                    orderId: orderId,
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
              console.log(`✅ Review notification sent to berichtenbox for product ${item.Product.id}`);
            } catch (notificationError) {
              console.error(`❌ Failed to send review notification:`, notificationError);
            }
          }
        }
      } catch (reviewError) {
        console.error('Error sending review requests:', reviewError);
        // Don't fail the order update if review requests fail
      }
    }

    // Send address update message if address changed
    if (pickupAddress || deliveryAddress) {
      await OrderMessagingService.updateOrderAddress(orderId, {
        pickupAddress: updatedOrder.pickupAddress || undefined,
        deliveryAddress: updatedOrder.deliveryAddress || undefined,
        deliveryMode: updatedOrder.deliveryMode as any
      });
    }

    // Send time update message if time changed
    if (pickupDate || deliveryDate) {
      await OrderMessagingService.updateOrderTime(orderId, {
        pickupDate: updatedOrder.pickupDate || undefined,
        deliveryDate: updatedOrder.deliveryDate || undefined
      });
    }

    return NextResponse.json({ 
      success: true, 
      order: updatedOrder,
      message: 'Order updated successfully and notification sent to chat'
    });

  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

