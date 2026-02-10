import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
// import { UserRole } from '@prisma/client';

// PATCH - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if user is admin
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { role: true }
    });

    if (adminUser?.role !== 'ADMIN' && adminUser?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Geen admin rechten' }, { status: 403 });
    }

    const { name, email, username, bio, place, gender, interests, role, password, profileImage } = await request.json();

    // Validate required fields
    if (!name || !email || !username || !role) {
      return NextResponse.json({ 
        error: 'Naam, email, gebruikersnaam en rol zijn verplicht' 
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: 'Ongeldig email adres' 
      }, { status: 400 });
    }

    // Validate role
    const validRoles = ['USER', 'ADMIN', 'SELLER', 'BUYER', 'DELIVERY'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ 
        error: 'Ongeldige rol' 
      }, { status: 400 });
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: { 
        email,
        NOT: { id }
      }
    });

    if (existingUser) {
      return NextResponse.json({ 
        error: 'Email adres is al in gebruik door een andere gebruiker' 
      }, { status: 400 });
    }

    // Check if username is already taken by another user
    const existingUsername = await prisma.user.findFirst({
      where: { 
        username,
        NOT: { id }
      }
    });

    if (existingUsername) {
      return NextResponse.json({ 
        error: 'Gebruikersnaam is al in gebruik door een andere gebruiker' 
      }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = {
      name,
      email,
      username,
      bio: bio || null,
      place: place || null,
      gender: gender || null,
      interests: interests || [],
      role: role as any,
    };

    // Add profile image if provided
    if (profileImage) {
      updateData.image = profileImage;
      updateData.profileImage = profileImage;
    }

    // Add password if provided
    if (password && password.trim() !== '') {
      if (password.length < 6) {
        return NextResponse.json({ 
          error: 'Wachtwoord moet minimaal 6 karakters lang zijn' 
        }, { status: 400 });
      }
      updateData.passwordHash = await bcrypt.hash(password, 12);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        role: true,
        bio: true,
        place: true,
        gender: true,
        interests: true,
        image: true,
        profileImage: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Gebruiker succesvol bijgewerkt'
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het bijwerken van de gebruiker' 
    }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if user is admin
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { role: true }
    });

    if (adminUser?.role !== 'ADMIN' && adminUser?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Geen admin rechten' }, { status: 403 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true }
    });

    if (!user) {
      return NextResponse.json({ 
        error: 'Gebruiker niet gevonden' 
      }, { status: 404 });
    }

    // Delete user with proper cascade handling
    await prisma.$transaction(async (tx) => {
      // 1. Delete analytics events
      await tx.analyticsEvent.deleteMany({
        where: { userId: id }
      });

      // 2. Delete product reviews
      await tx.productReview.deleteMany({
        where: { buyerId: id }
      });

      // 3. Delete order items and orders
      const orders = await tx.order.findMany({
        where: { userId: id },
        select: { id: true }
      });
      
      for (const order of orders) {
        await tx.orderItem.deleteMany({
          where: { orderId: order.id }
        });
      }
      
      await tx.order.deleteMany({
        where: { userId: id }
      });

      // 4. Delete messages and conversations
      const conversations = await tx.conversationParticipant.findMany({
        where: { userId: id },
        select: { conversationId: true }
      });
      
      for (const conv of conversations) {
        await tx.message.deleteMany({
          where: { conversationId: conv.conversationId }
        });
      }
      
      await tx.conversationParticipant.deleteMany({
        where: { userId: id }
      });
      
      await tx.conversation.deleteMany({
        where: {
          ConversationParticipant: {
            some: { userId: id }
          }
        }
      });

      // 5. Delete follows and favorites
      await tx.follow.deleteMany({
        where: { OR: [{ followerId: id }, { sellerId: id }] }
      });
      
      await tx.favorite.deleteMany({
        where: { userId: id }
      });

      // 6. Delete products directly associated with user (sellerId = userId)
      const directProducts = await tx.product.findMany({
        where: { sellerId: id },
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
        where: { sellerId: id }
      });

      // 7. Delete seller profile and related data
      const sellerProfiles = await tx.sellerProfile.findMany({
        where: { userId: id },
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
          where: { sellerId: profile.id }
        });
      }
      
      await tx.sellerProfile.deleteMany({
        where: { userId: id }
      });

      // 8. Delete delivery profile
      await tx.deliveryProfile.deleteMany({
        where: { userId: id }
      });

      // 9. Finally, delete the user
      await tx.user.delete({
        where: { id }
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Gebruiker succesvol verwijderd'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het verwijderen van de gebruiker' 
    }, { status: 500 });
  }
}