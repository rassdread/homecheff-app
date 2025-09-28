import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    
    if (!(session as any)?.user?.id) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const { password, confirmationText } = await request.json();

    if (confirmationText !== 'VERWIJDEREN') {
      return NextResponse.json({ error: 'Ongeldige bevestiging' }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: 'Wachtwoord is verplicht' }, { status: 400 });
    }

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: (session as any).user.id },
      select: {
        id: true,
        email: true,
        passwordHash: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Ongeldig wachtwoord' }, { status: 401 });
    }

    // Start transaction to delete all related data
    await prisma.$transaction(async (tx) => {
      // Delete all user-related data in the correct order (respecting foreign key constraints)
      
      // 1. Delete analytics events
      await tx.analyticsEvent.deleteMany({
        where: { userId: user.id }
      });

      // 2. Delete messages
      await tx.message.deleteMany({
        where: { senderId: user.id }
      });

      // 3. Delete conversations
      await tx.conversation.deleteMany({
        where: {
          OR: [
            { user1Id: user.id },
            { user2Id: user.id }
          ]
        }
      });

      // 4. Delete favorites
      await tx.favorite.deleteMany({
        where: { userId: user.id }
      });

      // 5. Delete follows (both as follower and seller)
      await tx.follow.deleteMany({
        where: {
          OR: [
            { followerId: user.id },
            { sellerId: user.id }
          ]
        }
      });

      // 6. Delete order items first, then orders
      const userOrders = await tx.order.findMany({
        where: { userId: user.id },
        select: { id: true }
      });

      for (const order of userOrders) {
        await tx.orderItem.deleteMany({
          where: { orderId: order.id }
        });
      }

      await tx.order.deleteMany({
        where: { userId: user.id }
      });

      // 7. Delete product reviews
      await tx.productReview.deleteMany({
        where: { buyerId: user.id }
      });

      // 8. Delete products and their images
      const userProducts = await tx.product.findMany({
        where: { sellerId: user.id },
        select: { id: true }
      });

      for (const product of userProducts) {
        await tx.productImage.deleteMany({
          where: { productId: product.id }
        });
      }

      await tx.product.deleteMany({
        where: { sellerId: user.id }
      });

      // 9. Delete dishes and their photos
      const userDishes = await tx.dish.findMany({
        where: { userId: user.id },
        select: { id: true }
      });

      for (const dish of userDishes) {
        await tx.dishPhoto.deleteMany({
          where: { dishId: dish.id }
        });
      }

      await tx.dish.deleteMany({
        where: { userId: user.id }
      });

      // 10. Delete workspace content and photos
      const userWorkspaceContent = await tx.workspaceContent.findMany({
        where: { sellerProfileId: user.id },
        select: { id: true }
      });

      for (const content of userWorkspaceContent) {
        await tx.workspacePhoto.deleteMany({
          where: { workspaceContentId: content.id }
        });
      }

      await tx.workspaceContent.deleteMany({
        where: { sellerProfileId: user.id }
      });

      // 11. Delete workplace photos
      await tx.workplacePhoto.deleteMany({
        where: { sellerProfileId: user.id }
      });

      // 12. Delete seller profile
      await tx.sellerProfile.deleteMany({
        where: { userId: user.id }
      });

      // 13. Delete delivery profile
      await tx.deliveryProfile.deleteMany({
        where: { userId: user.id }
      });

      // 14. Finally, delete the user
      await tx.user.delete({
        where: { id: user.id }
      });
    });

    // Create analytics event for account deletion
    try {
      await prisma.analyticsEvent.create({
        data: {
          eventType: 'ACCOUNT_DELETED',
          entityType: 'USER',
          entityId: user.id,
          userId: user.id,
          metadata: {
            deletedAt: new Date().toISOString(),
            email: user.email
          },
        },
      });
    } catch (error) {
      // Ignore analytics error as user is already deleted
      console.warn('Could not create analytics event for account deletion:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Account succesvol verwijderd'
    });

  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het verwijderen van je account' 
    }, { status: 500 });
  }
}
