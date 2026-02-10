import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { role: true }
    });

    if (adminUser?.role !== 'ADMIN' && adminUser?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userIds } = await req.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'Invalid user IDs' }, { status: 400 });
    }

    // Check if trying to delete self
    if (userIds.includes((session.user as any).id)) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    // Delete users with proper cascade handling
    await prisma.$transaction(async (tx) => {
      for (const userId of userIds) {
        // 1. Delete analytics events
        await tx.analyticsEvent.deleteMany({
          where: { userId }
        });

        // 2. Delete product reviews (as buyer)
        await tx.productReview.deleteMany({
          where: { buyerId: userId }
        });
        
        // 2b. Delete products directly associated with user (sellerId = userId)
        const directProducts = await tx.product.findMany({
          where: { sellerId: userId },
          select: { id: true }
        });
        
        for (const product of directProducts) {
          // Delete product images
          await tx.image.deleteMany({
            where: { productId: product.id }
          });
          
          // Delete product reviews
          await tx.productReview.deleteMany({
            where: { productId: product.id }
          });
          
          // Delete favorites for this product
          await tx.favorite.deleteMany({
            where: { productId: product.id }
          });
          
          // Delete order items for this product
          await tx.orderItem.deleteMany({
            where: { productId: product.id }
          });
        }
        
        await tx.product.deleteMany({
          where: { sellerId: userId }
        });

        // 3. Delete order items and orders
        const orders = await tx.order.findMany({
          where: { userId },
          select: { id: true }
        });
        
        for (const order of orders) {
          await tx.orderItem.deleteMany({
            where: { orderId: order.id }
          });
        }
        
        await tx.order.deleteMany({
          where: { userId }
        });

        // 4. Delete messages and conversations
        const conversations = await tx.conversationParticipant.findMany({
          where: { userId },
          select: { conversationId: true }
        });
        
        for (const conv of conversations) {
          await tx.message.deleteMany({
            where: { conversationId: conv.conversationId }
          });
        }
        
        await tx.conversationParticipant.deleteMany({
          where: { userId }
        });
        
        await tx.conversation.deleteMany({
          where: {
            ConversationParticipant: {
              some: { userId }
            }
          }
        });

        // 5. Delete follows and favorites
        await tx.follow.deleteMany({
          where: { OR: [{ followerId: userId }, { sellerId: userId }] }
        });
        
        await tx.favorite.deleteMany({
          where: { userId }
        });

        // 6. Delete seller profile and related data
        const sellerProfiles = await tx.sellerProfile.findMany({
          where: { userId },
          select: { id: true }
        });
        
        for (const profile of sellerProfiles) {
          // Delete workplace photos
          await tx.workplacePhoto.deleteMany({
            where: { sellerProfileId: profile.id }
          });
          
          // Delete products and their images
          const products = await tx.product.findMany({
            where: { sellerId: profile.id },
            select: { id: true }
          });
          
          for (const product of products) {
            await tx.image.deleteMany({
              where: { productId: product.id }
            });
          }
          
          await tx.product.deleteMany({
            where: { sellerId: profile.id }
          });
        }
        
        await tx.sellerProfile.deleteMany({
          where: { userId }
        });

        // 7. Delete delivery profile
        await tx.deliveryProfile.deleteMany({
          where: { userId }
        });
      }

      // 8. Finally, delete all users
      await tx.user.deleteMany({
        where: { id: { in: userIds } }
      });
    });

    return NextResponse.json({ success: true, deletedCount: userIds.length });
  } catch (error) {
    console.error('Error bulk deleting users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

