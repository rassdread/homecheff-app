import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { getDisplayName } from '@/lib/displayName';

export async function POST(req: NextRequest) {
  try {
    const { productId, sellerId } = await req.json();

    if (!productId || !sellerId) {
      return NextResponse.json({ error: 'Product ID and Seller ID are required' }, { status: 400 });
    }

    // Get the product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        title: true,
        priceCents: true,
        seller: {
          select: {
            User: {
              select: {
                id: true,
                name: true,
                username: true,
                displayFullName: true,
                displayNameOption: true,
              }
            }
          }
        }
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get all users who follow this seller
    const followers = await prisma.follow.findMany({
      where: { sellerId: sellerId },
      select: {
        followerId: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    const sellerUser = product.seller?.User;
    const sellerLabel = sellerUser ? getDisplayName(sellerUser) : 'Een verkoper';

    // Create notifications for all followers
    const notifications = await Promise.all(
      followers.map(follower =>
        prisma.notification.create({
          data: {
            id: `new-product-${productId}-${follower.followerId}`,
            userId: follower.followerId,
            type: 'NEW_LISTING_NEARBY',
            payload: {
              title: 'Nieuwe product van je favoriete verkoper!',
              message: `${sellerLabel} heeft een nieuw product geplaatst: ${product.title}`,
              from: 'system',
              productId: productId,
              sellerId: sellerId,
              sellerName: sellerLabel,
              productTitle: product.title,
              productPrice: product.priceCents
            }
          }
        })
      )
    );
    return NextResponse.json({ 
      success: true, 
      notificationsCreated: notifications.length 
    });

  } catch (error) {
    console.error('Error creating new product notifications:', error);
    return NextResponse.json({ error: 'Failed to create notifications' }, { status: 500 });
  }
}
