import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Haal reviews op voor een product
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'newest';
    const filterBy = searchParams.get('filterBy') || 'all';

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get reviews with buyer info
    const reviews = await prisma.productReview.findMany({
      where: {
        productId: id,
        ...(filterBy !== 'all' ? { rating: parseInt(filterBy) } : {})
      },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            username: true,
            profileImage: true
          }
        },
        images: {
          orderBy: { sortOrder: 'asc' }
        },
        responses: {
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                username: true,
                profileImage: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: {
        createdAt: sortBy === 'oldest' ? 'asc' : 'desc'
      }
    });

    // Sort by rating if needed
    if (sortBy === 'highest' || sortBy === 'lowest') {
      reviews.sort((a, b) => {
        return sortBy === 'highest' ? b.rating - a.rating : a.rating - b.rating;
      });
    }

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - Maak een nieuwe review
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const { rating, title, comment, images = [], orderId } = await request.json();

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
    }

    if (!comment || comment.trim().length === 0) {
      return NextResponse.json({ error: 'Comment is required' }, { status: 400 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if product exists and get its category
    const product = await prisma.product.findUnique({
      where: { id },
      select: { 
        id: true, 
        category: true,
        subcategory: true,
        priceCents: true
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.productReview.findFirst({
      where: {
        productId: id,
        buyerId: user.id
      }
    });

    if (existingReview) {
      return NextResponse.json({ error: 'Je hebt dit product al beoordeeld' }, { status: 400 });
    }

    // Determine if review is for an 'Inspiratie' product
    // Inspiratie products are typically those without a price or with specific metadata
    const isInspirationProduct = product.priceCents === 0 || product.priceCents === null;
    
    // HomeCheff Review Rules - Community-focused approach
    let isVerified = false;

    // 🎨 INSPIRATIE: Altijd mogelijk (zoals Pinterest/Instagram)
    if (isInspirationProduct) {
      isVerified = false; // Inspiration reviews are community-based, not purchase-verified
    } 
    // 🍽️ PRODUCTEN: Alleen na aankoop (zoals Amazon/Bol.com)
    else {
      // Check if user has purchased this product
      const purchaseOrder = await prisma.order.findFirst({
        where: {
          userId: user.id,
          status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
          items: {
            some: {
              productId: id
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!purchaseOrder) {
        return NextResponse.json({ 
          error: 'Je kunt alleen producten beoordelen die je hebt gekocht van deze lokale verkoper' 
        }, { status: 403 });
      }

      // Mark as verified if specific order provided and matches
      if (orderId && orderId === purchaseOrder.id) {
        isVerified = true;
      } else {
        isVerified = true; // Still verified purchase, just not specific order
      }
    }

    // Create review with HomeCheff community approach
    const review = await prisma.productReview.create({
      data: {
        productId: id,
        buyerId: user.id,
        orderId: isVerified ? orderId : null,
        rating,
        title: title?.trim() || null,
        comment: comment.trim(),
        isVerified,
        images: {
          create: images.map((url: string, index: number) => ({
            url,
            sortOrder: index
          }))
        }
      },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            username: true,
            profileImage: true
          }
        },
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

