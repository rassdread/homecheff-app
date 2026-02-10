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
    // Use a longer timeout for bulk operations
    await prisma.$transaction(async (tx) => {
      for (const userId of userIds) {
        try {
        // 1. Delete analytics events
        await tx.analyticsEvent.deleteMany({
          where: { userId }
        });

        // 2. Delete product reviews (as buyer)
        await tx.productReview.deleteMany({
          where: { buyerId: userId }
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
        // First, get all conversations where this user is a participant
        const conversationParticipants = await tx.conversationParticipant.findMany({
          where: { userId },
          select: { conversationId: true }
        });
        
        const conversationIds = [...new Set(conversationParticipants.map(c => c.conversationId))];
        
        if (conversationIds.length > 0) {
          // Delete conversation keys first
          await tx.conversationKey.deleteMany({
            where: { conversationId: { in: conversationIds } }
          });
          
          // Delete messages in these conversations
          await tx.message.deleteMany({
            where: { conversationId: { in: conversationIds } }
          });
          
          // Delete all participants in these conversations
          await tx.conversationParticipant.deleteMany({
            where: { conversationId: { in: conversationIds } }
          });
          
          // Finally delete the conversations themselves
          await tx.conversation.deleteMany({
            where: { id: { in: conversationIds } }
          });
        }

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
          
          // Delete workspace content and related data
          const workspaceContents = await tx.workspaceContent.findMany({
            where: { sellerProfileId: profile.id },
            select: { id: true }
          });
          
          for (const content of workspaceContents) {
            // Delete workspace content photos
            await tx.workspaceContentPhoto.deleteMany({
              where: { workspaceContentId: content.id }
            });
            
            // Delete workspace content props
            await tx.workspaceContentProp.deleteMany({
              where: { workspaceContentId: content.id }
            });
            
            // Delete workspace content comments
            await tx.workspaceContentComment.deleteMany({
              where: { workspaceContentId: content.id }
            });
            
            // Delete related records (Recipe, GrowingProcess, DesignItem)
            await tx.recipe.deleteMany({
              where: { workspaceContentId: content.id }
            });
            
            await tx.growingProcess.deleteMany({
              where: { workspaceContentId: content.id }
            });
            
            await tx.designItem.deleteMany({
              where: { workspaceContentId: content.id }
            });
          }
          
          await tx.workspaceContent.deleteMany({
            where: { sellerProfileId: profile.id }
          });
          
          // Delete products and their images
          const products = await tx.product.findMany({
            where: { sellerId: profile.id },
            select: { id: true }
          });
          
          for (const product of products) {
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
            
            // Delete stock reservations
            await tx.stockReservation.deleteMany({
              where: { productId: product.id }
            });
            
            // Delete delivery orders
            await tx.deliveryOrder.deleteMany({
              where: { productId: product.id }
            });
            
            // Note: Conversations linked to products are already handled in step 4
            // We don't need to delete them again here
          }
          
          await tx.product.deleteMany({
            where: { sellerId: profile.id }
          });
        }
        
        await tx.sellerProfile.deleteMany({
          where: { userId }
        });

        // 7. Delete delivery profile and related data
        const deliveryProfiles = await tx.deliveryProfile.findMany({
          where: { userId },
          select: { id: true }
        });
        
        for (const profile of deliveryProfiles) {
          // Delete delivery orders
          await tx.deliveryOrder.deleteMany({
            where: { deliveryProfileId: profile.id }
          });
          
          // Delete delivery reviews
          await tx.deliveryReview.deleteMany({
            where: { deliveryProfileId: profile.id }
          });
          
          // Delete delivery availability
          await tx.deliveryAvailability.deleteMany({
            where: { deliveryProfileId: profile.id }
          });
          
          // Delete delivery notification settings
          await tx.deliveryNotificationSettings.deleteMany({
            where: { deliveryProfileId: profile.id }
          });
          
          // Delete shift notifications
          await tx.shiftNotification.deleteMany({
            where: { deliveryProfileId: profile.id }
          });
          
          // Delete vehicle photos
          await tx.vehiclePhoto.deleteMany({
            where: { deliveryProfileId: profile.id }
          });
        }
        
        await tx.deliveryProfile.deleteMany({
          where: { userId }
        });

        // 8. Delete transactions, payouts, and refunds
        const transactions = await tx.transaction.findMany({
          where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
          select: { id: true }
        });
        
        for (const transaction of transactions) {
          await tx.payout.deleteMany({
            where: { transactionId: transaction.id }
          });
          
          await tx.refund.deleteMany({
            where: { transactionId: transaction.id }
          });
        }
        
        await tx.transaction.deleteMany({
          where: { OR: [{ buyerId: userId }, { sellerId: userId }] }
        });

        // 9. Delete reservations
        await tx.reservation.deleteMany({
          where: { OR: [{ buyerId: userId }, { sellerId: userId }] }
        });

        // 10. Delete notifications
        await tx.notification.deleteMany({
          where: { userId }
        });

        // 11. Delete reports
        await tx.report.deleteMany({
          where: { OR: [{ reporterId: userId }, { targetUserId: userId }] }
        });

        // 12. Delete dish reviews
        await tx.dishReview.deleteMany({
          where: { reviewerId: userId }
        });

        // 13. Delete review responses
        await tx.reviewResponse.deleteMany({
          where: { sellerId: userId }
        });

        // 14. Delete fan requests
        await tx.fanRequest.deleteMany({
          where: { OR: [{ requesterId: userId }, { targetId: userId }] }
        });

        // 15. Delete dishes
        await tx.dish.deleteMany({
          where: { userId }
        });

        // 16. Delete listings
        await tx.listing.deleteMany({
          where: { ownerId: userId }
        });

        // 17. Delete business
        await tx.business.deleteMany({
          where: { userId }
        });

        // 18. Delete dynamic seller
        await tx.dynamicSeller.deleteMany({
          where: { userId }
        });

        // 19. Delete admin preferences and permissions
        await tx.adminPreferences.deleteMany({
          where: { userId }
        });
        
        await tx.adminPermissions.deleteMany({
          where: { userId }
        });

        // 20. Delete sessions
        await tx.session.deleteMany({
          where: { userId }
        });

        // 21. Delete accounts
        await tx.account.deleteMany({
          where: { userId }
        });

        // 22. Delete device tokens
        await tx.deviceToken.deleteMany({
          where: { userId }
        });

        // 23. Delete push tokens
        await tx.pushToken.deleteMany({
          where: { userId }
        });

        // 24. Delete notification preferences
        await tx.notificationPreferences.deleteMany({
          where: { userId }
        });

        // 25. Delete encryption keys
        await tx.encryptionKey.deleteMany({
          where: { userId }
        });

        // 26. Delete audit logs
        await tx.auditLog.deleteMany({
          where: { userId }
        });

        // 27. Delete admin actions
        await tx.adminAction.deleteMany({
          where: { adminId: userId }
        });

        // 28. Delete listing tags and media (if user owns listings)
        const userListings = await tx.listing.findMany({
          where: { ownerId: userId },
          select: { id: true }
        });
        
        const listingIds = userListings.map(l => l.id);
        
        if (listingIds.length > 0) {
          await tx.listingTag.deleteMany({
            where: { listingId: { in: listingIds } }
          });
          
          await tx.listingMedia.deleteMany({
            where: { listingId: { in: listingIds } }
          });
          
          await tx.reservation.deleteMany({
            where: { listingId: { in: listingIds } }
          });
          
          await tx.favorite.deleteMany({
            where: { listingId: { in: listingIds } }
          });
        }
        
        await tx.listing.deleteMany({
          where: { ownerId: userId }
        });
        } catch (userError: any) {
          console.error(`Error deleting user ${userId}:`, userError);
          // Continue with next user instead of failing entire batch
          throw new Error(`Failed to delete user ${userId}: ${userError?.message || 'Unknown error'}`);
        }
      }

      // Finally, delete all users
      await tx.user.deleteMany({
        where: { id: { in: userIds } }
      });
    }, {
      timeout: 30000, // 30 second timeout for bulk operations
    });

    return NextResponse.json({ success: true, deletedCount: userIds.length });
  } catch (error: any) {
    console.error('Error bulk deleting users:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack
    });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

