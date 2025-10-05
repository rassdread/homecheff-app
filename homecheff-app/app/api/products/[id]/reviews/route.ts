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

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.productReview.findUnique({
      where: {
        productId_buyerId: {
          productId: id,
          buyerId: user.id
        }
      }
    });

    if (existingReview) {
      return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 400 });
    }

    // Verify purchase if orderId is provided
    let isVerified = false;
    if (orderId) {
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          userId: user.id,
          items: {
            some: {
              productId: id
            }
          }
        }
      });
      isVerified = !!order;
    }

    // Create review
    const review = await prisma.productReview.create({
      data: {
        productId: id,
        buyerId: user.id,
        orderId: orderId || null,
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



