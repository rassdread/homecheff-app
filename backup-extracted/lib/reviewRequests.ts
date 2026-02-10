// HomeCheff Review Request System
// Automatically send review requests after order delivery

import { prisma } from '@/lib/prisma';
import { OrderNumberGenerator } from '@/lib/orderNumberGenerator';

export interface ReviewRequestData {
  orderId: string;
  orderNumber: string;
  buyerName: string;
  buyerEmail: string;
  items: {
    productId: string;
    productTitle: string;
    sellerName: string;
    quantity: number;
  }[];
}

// Generate review token for secure review submission
export function generateReviewToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Send review request after order is delivered
export async function sendReviewRequest(orderId: string) {
  try {
    // Get order with items and buyer info
    const order = await prisma.order.findUnique({
      where: { id: orderId },
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
      }
    });

    if (!order || !order.User?.email) {
      console.log('Order or user email not found for review request');
      return false;
    }

    // Create review tokens for each product
    const reviewTokens: Array<{
      productId: string;
      productTitle: string;
      sellerName: string;
      quantity: number;
      token: string;
    }> = [];
    for (const item of order.items) {
      const token = generateReviewToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days to review

      // Create or update ProductReview record with review token
      // Check if review already exists
      const existingReview = await prisma.productReview.findFirst({
        where: {
          productId: item.Product.id,
          buyerId: order.User.id
        }
      });

      if (!existingReview) {
        await prisma.productReview.create({
          data: {
          productId: item.Product.id,
          buyerId: order.User.id,
          orderId: order.id,
          orderItemId: item.id,
          rating: 0, // Placeholder, will be updated when review is submitted
          comment: '', // Placeholder
          reviewToken: token,
          reviewTokenExpires: expiresAt,
          isVerified: true
          }
        });
      }

      reviewTokens.push({
        productId: item.Product.id,
        productTitle: item.Product.title,
        sellerName: item.Product.seller.User.name || item.Product.seller.User.username || 'Verkoper',
        quantity: item.quantity,
        token
      });
    }

    const reviewRequestData: ReviewRequestData = {
      orderId: order.id,
      orderNumber: OrderNumberGenerator.getDisplayNumber(order.orderNumber, order.id),
      buyerName: order.User.name || 'Klant',
      buyerEmail: order.User.email,
      items: reviewTokens.map(token => ({
        productId: token.productId,
        productTitle: token.productTitle,
        sellerName: token.sellerName,
        quantity: token.quantity
      }))
    };

    // TODO: Send email with review request
    // For now, just log the request
    console.log('📧 Review request would be sent:', {
      to: reviewRequestData.buyerEmail,
      orderNumber: reviewRequestData.orderNumber,
      itemCount: reviewRequestData.items.length
    });

    return true;
  } catch (error) {
    console.error('Error sending review request:', error);
    return false;
  }
}

// Check if user can review product via token
export async function validateReviewToken(token: string, productId: string, userId: string) {
  const review = await prisma.productReview.findFirst({
    where: {
      reviewToken: token,
      reviewTokenExpires: {
        gte: new Date()
      },
      productId: productId,
      buyerId: userId
    },
    include: {
      order: true,
      product: true,
      orderItem: true
    }
  });

  return review;
}

// Mark review token as used
export async function markReviewTokenUsed(token: string) {
  await prisma.productReview.updateMany({
    where: { reviewToken: token },
    data: { 
      reviewToken: null,
      reviewTokenExpires: null,
      reviewSubmittedAt: new Date()
    }
  });
}
