import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/reviews/create
 * Create a new product review
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token, rating, title, comment, images } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Review token is required' }, { status: 400 });
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Find review by token
    const review = await prisma.productReview.findUnique({
      where: { reviewToken: token },
      include: {
        buyer: {
          select: { id: true, name: true }
        }
      }
    });

    if (!review) {
      return NextResponse.json({ error: 'Review token not found' }, { status: 404 });
    }

    // Verify buyer matches session
    if (review.buyerId !== (session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if review already submitted
    if (review.reviewSubmittedAt) {
      return NextResponse.json({ error: 'Review already submitted' }, { status: 409 });
    }

    // Check if token is expired
    if (review.reviewTokenExpires && new Date() > review.reviewTokenExpires) {
      return NextResponse.json({ error: 'Review token has expired' }, { status: 410 });
    }

    // Update review
    const updatedReview = await prisma.productReview.update({
      where: { id: review.id },
      data: {
        rating,
        title: title || null,
        comment: comment || null,
        reviewSubmittedAt: new Date(),
        isVerified: true, // Verified because it came from a valid order
        images: images && images.length > 0 ? {
          create: images.map((url: string) => ({
            fileUrl: url
          }))
        } : undefined
      },
      include: {
        product: {
          include: {
            Image: {
              take: 1,
              select: { fileUrl: true }
            },
            seller: {
              include: {
                User: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        dish: {
          select: {
            id: true,
            title: true,
            userId: true
          }
        }
      }
    });

    // Invalidate token by setting it to null (one-time use)
    await prisma.productReview.update({
      where: { id: review.id },
      data: {
        reviewToken: null
      }
    });

    // Create notification for seller about new review
    if (updatedReview.product?.seller?.User?.id || updatedReview.dish?.userId) {
      await prisma.notification.create({
        data: {
          id: `review_${updatedReview.id}_${Date.now()}`,
          userId: updatedReview.product?.seller?.User?.id || updatedReview.dish?.userId || '',
          type: 'REVIEW_RECEIVED',
          payload: {
            title: '⭐ Nieuwe review ontvangen!',
            message: `${review.buyer.name || 'Een klant'} heeft een ${rating}-sterren review achtergelaten voor ${updatedReview.product?.title || updatedReview.dish?.title || 'je item'}`,
            reviewId: updatedReview.id,
            productId: updatedReview.productId,
            dishId: updatedReview.dishId,
            rating: rating,
            link: updatedReview.productId ? `/verkoper/products/${updatedReview.productId}` : `/inspiratie/${updatedReview.dishId}`
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      review: {
        id: updatedReview.id,
        rating: updatedReview.rating,
        title: updatedReview.title,
        comment: updatedReview.comment
      }
    });

  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


