import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Voeg een response toe aan een review
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id: reviewId } = await params;
    const { comment } = await request.json();

    if (!comment || comment.trim().length === 0) {
      return NextResponse.json({ error: 'Comment is required' }, { status: 400 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get review and check if user is the seller
    const review = await prisma.productReview.findUnique({
      where: { id: reviewId },
      include: {
        product: {
          include: {
            seller: {
              select: { userId: true }
            }
          }
        }
      }
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Check if user is the seller or admin
    const isSeller = review.product.seller.userId === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isSeller && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized to respond to this review' }, { status: 403 });
    }

    // Check if seller already responded
    if (isSeller) {
      const existingResponse = await prisma.reviewResponse.findFirst({
        where: {
          reviewId,
          sellerId: user.id
        }
      });

      if (existingResponse) {
        return NextResponse.json({ error: 'You have already responded to this review' }, { status: 400 });
      }
    }

    // Create response
    const response = await prisma.reviewResponse.create({
      data: {
        reviewId,
        sellerId: user.id,
        comment: comment.trim()
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            username: true,
            profileImage: true
          }
        }
      }
    });

    return NextResponse.json({ response }, { status: 201 });
  } catch (error) {
    console.error('Error creating review response:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// GET - Haal responses op voor een review
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params;

    const responses = await prisma.reviewResponse.findMany({
      where: { reviewId },
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
    });

    return NextResponse.json({ responses });
  } catch (error) {
    console.error('Error fetching review responses:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
