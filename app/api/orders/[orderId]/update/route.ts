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
              select: {
                Product: {
                  select: {
                    id: true,
                    // pickupAddress, pickupLat, pickupLng - columns don't exist in database yet
                    sellerId: true,
                    seller: {
                      select: {
                        userId: true,
                        User: {
                          select: { 
                            id: true,
                            name: true, 
                            username: true,
                            address: true,
                            postalCode: true,
                            city: true,
                            place: true
                          }
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

          // For SHIPPED status with PICKUP mode, use sendOrderReadyForPickupNotification with pickup address
          if (status === 'SHIPPED' && updatedOrder.deliveryMode === 'PICKUP') {
            // Get pickup address from order or seller User (pickupAddress column doesn't exist in Product yet)
            let pickupAddress = updatedOrder.pickupAddress;
            
            // If still no pickupAddress, get it from seller User
            if (!pickupAddress) {
              const sellerUser = orderWithBuyer.items[0]?.Product?.seller?.User;
              if (sellerUser) {
                pickupAddress = [
                  sellerUser.address,
                  sellerUser.postalCode,
                  sellerUser.city || sellerUser.place
                ].filter(Boolean).join(', ') || 'Adres niet beschikbaar';
              }
            }
            
            // Use the specific pickup notification function
            const sellerUser = orderWithBuyer.items[0]?.Product?.seller?.User;
            const sellerUserId = orderWithBuyer.items[0]?.Product?.seller?.userId;
            if (sellerUser && sellerUserId) {
              await NotificationService.sendOrderReadyForPickupNotification(
                orderWithBuyer.userId,
                sellerUserId,
                orderId,
                (await import('@/lib/orderNumberGenerator')).OrderNumberGenerator.getDisplayNumber(orderWithBuyer.orderNumber, orderId),
                pickupAddress || 'Adres niet beschikbaar'
              );
            }
          } else if (status === 'SHIPPED' && updatedOrder.deliveryMode === 'DELIVERY') {
            // For SHIPPED status with DELIVERY mode, send notification with delivery address
            let deliveryAddress = updatedOrder.deliveryAddress;
            
            // If deliveryAddress is not set in order, get it from buyer User
            if (!deliveryAddress) {
              const buyerUser = await prisma.user.findUnique({
                where: { id: orderWithBuyer.userId },
                select: {
                  address: true,
                  postalCode: true,
                  city: true,
                  place: true
                }
              });
              
              if (buyerUser) {
                deliveryAddress = [
                  buyerUser.address,
                  buyerUser.postalCode,
                  buyerUser.city || buyerUser.place
                ].filter(Boolean).join(', ') || 'Adres niet beschikbaar';
              }
            }
            
            const sellerUserId = orderWithBuyer.items[0]?.Product?.seller?.userId;
            if (sellerUserId) {
              await NotificationService.sendOrderReadyForDeliveryNotification(
                orderWithBuyer.userId,
                sellerUserId,
                orderId,
                (await import('@/lib/orderNumberGenerator')).OrderNumberGenerator.getDisplayNumber(orderWithBuyer.orderNumber, orderId),
                deliveryAddress || 'Adres niet beschikbaar'
              );
            }
          } else {
            // Send status update notification for other statuses
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
          const { generateReviewToken, getDefaultTokenExpiry } = await import('@/lib/review-tokens');
          
          for (const item of orderWithItems.items) {
            // Find review record for this order item
            let review = await prisma.productReview.findFirst({
              where: {
                orderId: orderId,
                orderItemId: item.id,
                buyerId: orderWithItems.User.id,
                productId: item.Product.id
              }
            });

            // If review is already submitted, skip
            if (review && review.reviewSubmittedAt) {
              continue; // Review already submitted, don't resend
            }

            // If placeholder review exists but not submitted, delete it and create new one
            if (review && !review.reviewSubmittedAt) {
              await prisma.productReview.delete({
                where: { id: review.id }
              });
              review = null; // Reset to create new one
            }

            // If no review exists or was deleted, create new placeholder review
            if (!review) {
              const reviewToken = generateReviewToken();
              const tokenExpiry = getDefaultTokenExpiry();

              review = await prisma.productReview.create({
                data: {
                  id: `review_${orderId}_${item.Product.id}_${Date.now()}`,
                  productId: item.Product.id,
                  buyerId: orderWithItems.User.id,
                  orderId: orderId,
                  orderItemId: item.id,
                  rating: 0, // Placeholder, will be set when review is submitted
                  reviewToken: reviewToken,
                  reviewTokenExpires: tokenExpiry,
                  isVerified: false // Will be set to true when review is submitted
                }
              });
            }

            // Check if token is still valid
            if (review.reviewTokenExpires && new Date() > review.reviewTokenExpires) {
              // Token expired, generate new one
              const newToken = generateReviewToken();
              const newExpiry = getDefaultTokenExpiry();
              
              review = await prisma.productReview.update({
                where: { id: review.id },
                data: {
                  reviewToken: newToken,
                  reviewTokenExpires: newExpiry
                }
              });
            }

            // Ensure review token exists
            if (!review.reviewToken) {
              console.error(`❌ Review token missing for review ${review.id}`);
              continue; // Skip this item if no token
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

