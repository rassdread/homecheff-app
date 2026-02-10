import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isTokenExpired } from '@/lib/review-tokens';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reviews/token/[token]
 * Validate review token and get review data
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Find review by token
    const review = await prisma.productReview.findUnique({
      where: { reviewToken: token },
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
                    name: true,
                    username: true
                  }
                }
              }
            }
          }
        },
        order: {
          select: {
            id: true,
            orderNumber: true
          }
        },
        orderItem: {
          select: {
            id: true,
            quantity: true
          }
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!review) {
      return NextResponse.json({ error: 'Review token not found' }, { status: 404 });
    }

    // Check if token is expired
    if (review.reviewTokenExpires && isTokenExpired(review.reviewTokenExpires)) {
      return NextResponse.json({ error: 'Review token has expired' }, { status: 410 });
    }

    // Check if review already submitted
    if (review.reviewSubmittedAt) {
      return NextResponse.json({ 
        error: 'Review already submitted',
        review: {
          id: review.id,
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          submittedAt: review.reviewSubmittedAt
        }
      }, { status: 409 });
    }

    // Return review data for form
    return NextResponse.json({
      valid: true,
      review: {
        id: review.id,
        productId: review.productId,
        productTitle: review.product.title,
        productImage: review.product.Image[0]?.fileUrl || null,
        sellerName: review.product.seller?.User?.name || review.product.seller?.User?.username || 'Verkoper',
        orderNumber: review.order?.orderNumber || null,
        buyerName: review.buyer.name || 'Klant'
      }
    });

  } catch (error) {
    console.error('Error validating review token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}




