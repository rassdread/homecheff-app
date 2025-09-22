import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// User data isolation - ensures users can only access their own data
export async function ensureUserAccess(userId: string, requestedUserId: string): Promise<boolean> {
  // Users can only access their own data
  return userId === requestedUserId;
}

// Admin access check
export async function ensureAdminAccess(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });
  
  return user?.role === 'ADMIN';
}

// Seller access check
export async function ensureSellerAccess(userId: string, sellerId: string): Promise<boolean> {
  const seller = await prisma.sellerProfile.findFirst({
    where: { 
      id: sellerId,
      userId: userId 
    }
  });
  
  return !!seller;
}

// Product ownership check
export async function ensureProductOwnership(userId: string, productId: string): Promise<boolean> {
  const product = await prisma.product.findFirst({
    where: { 
      id: productId,
      seller: {
        userId: userId
      }
    }
  });
  
  return !!product;
}

// Order access check - users can only see their own orders
export async function ensureOrderAccess(userId: string, orderId: string): Promise<boolean> {
  const order = await prisma.order.findFirst({
    where: { 
      id: orderId,
      userId: userId 
    }
  });
  
  return !!order;
}

// Message access check - users can only see messages they sent or received
export async function ensureMessageAccess(userId: string, messageId: string): Promise<boolean> {
  const message = await prisma.message.findFirst({
    where: { 
      id: messageId,
      senderId: userId
    }
  });
  
  return !!message;
}

// Conversation access check
export async function ensureConversationAccess(userId: string, conversationId: string): Promise<boolean> {
  const conversation = await prisma.conversation.findFirst({
    where: { 
      id: conversationId
    }
  });
  
  return !!conversation;
}

// Review access check - users can only see reviews for their products or their own reviews
export async function ensureReviewAccess(userId: string, reviewId: string): Promise<boolean> {
  const review = await prisma.productReview.findFirst({
    where: { 
      id: reviewId,
      OR: [
        { buyerId: userId },
        { 
          product: {
            seller: {
              userId: userId
            }
          }
        }
      ]
    }
  });
  
  return !!review;
}

// Delivery profile access check
export async function ensureDeliveryAccess(userId: string, deliveryId: string): Promise<boolean> {
  const deliveryProfile = await prisma.deliveryProfile.findFirst({
    where: { 
      id: deliveryId,
      userId: userId 
    }
  });
  
  return !!deliveryProfile;
}

// Sanitize user data for public display
export function sanitizeUserForPublic(user: any) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    profileImage: user.profileImage,
    // Never expose: email, phone, address, internal IDs
  };
}

// Sanitize product data for public display
export function sanitizeProductForPublic(product: any) {
  return {
    id: product.id,
    title: product.title,
    description: product.description,
    priceCents: product.priceCents,
    category: product.category,
    unit: product.unit,
    delivery: product.delivery,
    isActive: product.isActive,
    createdAt: product.createdAt,
    seller: product.seller ? sanitizeUserForPublic(product.seller.User) : null,
    Image: product.Image,
    // Never expose: internal seller data, exact location, personal info
  };
}

// Sanitize order data - only show relevant info to user
export function sanitizeOrderForUser(order: any, userId: string) {
  const sanitized = {
    id: order.id,
    status: order.status,
    totalAmountCents: order.totalAmountCents,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: order.items?.map((item: any) => ({
      id: item.id,
      quantity: item.quantity,
      priceCents: item.priceCents,
      product: item.Product ? sanitizeProductForPublic(item.Product) : null
    }))
  };

  // Only show sensitive data to the order owner
  if (order.userId === userId) {
    return {
      ...sanitized,
      deliveryAddress: order.deliveryAddress,
      notes: order.notes,
      deliveryDate: order.deliveryDate,
      pickupDate: order.pickupDate
    };
  }

  return sanitized;
}

// Log security events
export async function logSecurityEvent(
  eventType: string,
  userId: string | null,
  details: any,
  ip?: string
) {
  try {
    await prisma.analyticsEvent.create({
      data: {
        eventType: 'SECURITY_EVENT',
        entityType: 'SECURITY',
        entityId: eventType,
        userId: userId,
        metadata: {
          eventType,
          details,
          ip,
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

// Validate session and get user ID
export async function validateSession(request: NextRequest): Promise<{ userId: string | null; session: any }> {
  try {
    const session = await auth();
    if (!(session as any)?.user?.id) {
      return { userId: null, session: null };
    }
    return { userId: (session as any).user.id, session };
  } catch (error) {
    console.error('Session validation error:', error);
    return { userId: null, session: null };
  }
}
