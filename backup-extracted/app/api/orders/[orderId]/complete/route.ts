import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendReviewRequestEmail } from '@/lib/email';
import { NotificationService } from '@/lib/notifications/notification-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/orders/[orderId]/complete
 * Mark order as completed/delivered and send review requests
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = params;

    // Get order with items and buyer
    const order = await prisma.order.findUnique({
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

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if user is seller or buyer
    const userId = (session.user as any).id;
    const isBuyer = order.userId === userId;
    const isSeller = order.items.some(item => item.Product.seller?.User?.id === userId);

    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update order status to DELIVERED
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'DELIVERED'
      },
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

    // Send review request emails and notifications for each product
    for (const item of updatedOrder.items) {
      // Find review record for this order item
      const review = await prisma.productReview.findFirst({
        where: {
          orderId: orderId,
          orderItemId: item.id,
          buyerId: updatedOrder.User.id,
          productId: item.Product.id
        }
      });

      if (!review || !review.reviewToken || review.reviewSubmittedAt) {
        // Review already submitted or token doesn't exist, skip
        continue;
      }

      // Check if token is still valid
      if (review.reviewTokenExpires && new Date() > review.reviewTokenExpires) {
        continue; // Token expired, skip
      }

      const sellerName = item.Product.seller?.User?.name || 
                        item.Product.seller?.User?.username || 
                        'Verkoper';
      const productImage = item.Product.Image[0]?.fileUrl || undefined;
      const reviewUrl = `${process.env.NEXTAUTH_URL || 'https://homecheff.nl'}/review/${review.reviewToken}`;

      // Send review request email
      try {
        await sendReviewRequestEmail({
          email: updatedOrder.User.email,
          buyerName: updatedOrder.User.name || 'Klant',
          orderNumber: (await import('@/lib/orderNumberGenerator')).OrderNumberGenerator.getDisplayNumber(updatedOrder.orderNumber, updatedOrder.id),
          productTitle: item.Product.title,
          productImage: productImage,
          reviewToken: review.reviewToken,
          sellerName: sellerName
        });
        console.log(`✅ Review request email sent for product ${item.Product.id}`);
      } catch (emailError) {
        console.error(`❌ Failed to send review request email:`, emailError);
        // Continue with other items even if one fails
      }

      // Send review link in berichtenbox (in-app notification)
      try {
        await NotificationService.send({
          userId: updatedOrder.User.id,
          message: {
            title: `⭐ Review verzoek: ${item.Product.title}`,
            body: `Je bestelling is voltooid! Help andere gebruikers door een review achter te laten voor ${item.Product.title}.`,
            urgent: false,
              data: {
                type: 'REVIEW_REQUEST',
                orderId: orderId,
                orderNumber: (await import('@/lib/orderNumberGenerator')).OrderNumberGenerator.getDisplayNumber(updatedOrder.orderNumber, updatedOrder.id),
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
        // Continue with other items
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Order marked as completed and review requests sent'
    });

  } catch (error) {
    console.error('Error completing order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


