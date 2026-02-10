import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const reviews = await prisma.productReview.findMany({
      where: {
        dishId: id, // Changed from productId to dishId for inspiration items
        // For inspiration items, we don't require verified purchases
      },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            username: true,
            profileImage: true,
            displayFullName: true,
            displayNameOption: true,
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
                profileImage: true,
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Error fetching inspiration reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { rating, comment, title, reviewType, images = [] } = await request.json();

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating moet tussen 1 en 5 zijn' },
        { status: 400 }
      );
    }

    if (!comment || comment.trim().length < 10) {
      return NextResponse.json(
        { error: 'Review moet minimaal 10 tekens lang zijn' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if inspiration item exists
    const inspiration = await prisma.dish.findUnique({
      where: { id },
      select: { 
        id: true, 
        userId: true,
        title: true 
      }
    });

    if (!inspiration) {
      return NextResponse.json(
        { error: 'Inspiratie item niet gevonden' },
        { status: 404 }
      );
    }

    // Check if user already reviewed this inspiration
    const existingReview = await prisma.productReview.findFirst({
      where: {
        dishId: id, // Changed from productId to dishId
        buyerId: user.id
      }
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'Je hebt al een review achtergelaten voor deze inspiratie' },
        { status: 400 }
      );
    }

    // Create review for inspiration (always unverified since no purchase required)
    const review = await prisma.productReview.create({
      data: {
        dishId: id, // Changed from productId to dishId
        buyerId: user.id,
        rating,
        title: title?.trim() || null,
        comment: comment.trim(),
        isVerified: false, // Inspiration reviews are never "verified purchases"
        // No orderId for inspiration reviews
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
            profileImage: true,
            displayFullName: true,
            displayNameOption: true,
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
                profileImage: true,
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('Error creating inspiration review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
