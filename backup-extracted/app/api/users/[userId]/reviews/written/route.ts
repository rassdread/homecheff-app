import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    // Get reviews written by the user
    const reviews = await prisma.productReview.findMany({
      where: {
        buyerId: userId
      },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' }
        },
        product: {
          select: {
            id: true,
            title: true,
            category: true,
            Image: {
              select: {
                fileUrl: true
              },
              take: 1
            },
            seller: {
              select: {
                User: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                    profileImage: true,
                    displayFullName: true,
                    displayNameOption: true,
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get dish data for reviews on inspiration items
    const dishIds = reviews.map(r => r.dishId).filter(Boolean) as string[];
    const dishes = await prisma.dish.findMany({
      where: { id: { in: dishIds } },
      select: {
        id: true,
        title: true,
        category: true,
        photos: {
          select: { url: true, isMain: true },
          take: 1
        },
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            profileImage: true,
            displayFullName: true,
            displayNameOption: true,
          }
        }
      }
    });

    const dishMap = new Map(dishes.map(d => [d.id, d]));

    // Format reviews with product/dish data
    const formattedReviews = reviews.map(review => {
      const dish = dishMap.get(review.dishId || '');
      
      return {
        ...review,
        createdAt: review.createdAt.toISOString(),
        updatedAt: review.updatedAt.toISOString(),
        images: review.images.map(img => ({
          id: img.id,
          url: img.url,
          sortOrder: img.sortOrder
        })),
        product: review.product ? {
          id: review.product.id,
          title: review.product.title,
          category: review.product.category,
          image: review.product.Image[0]?.fileUrl || null
        } : dish ? {
          id: dish.id,
          title: dish.title || 'Inspiratie',
          category: dish.category || 'INSPIRATION',
          image: dish.photos[0]?.url || null
        } : null,
        seller: review.product?.seller?.User || dish?.user || null
      };
    });

    return NextResponse.json({
      reviews: formattedReviews,
      totalCount: formattedReviews.length
    });

  } catch (error) {
    console.error('Error fetching written reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
