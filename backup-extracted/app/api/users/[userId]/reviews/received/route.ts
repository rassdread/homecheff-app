import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    // Get reviews received on user's products and dishes
    const [productReviews, dishReviews] = await Promise.all([
      // Reviews on products
      prisma.productReview.findMany({
        where: {
          product: {
            seller: {
              userId: userId
            }
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
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      // Reviews on dishes (inspiration items)
      prisma.productReview.findMany({
        where: {
          dishId: {
            in: await prisma.dish.findMany({
              where: { userId: userId },
              select: { id: true }
            }).then(dishes => dishes.map(d => d.id))
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
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Get dish data for dish reviews
    const dishIds = dishReviews.map(r => r.dishId).filter(Boolean) as string[];
    const dishes = await prisma.dish.findMany({
      where: { id: { in: dishIds } },
      select: {
        id: true,
        title: true,
        category: true,
        photos: {
          select: { url: true, isMain: true },
          take: 1
        }
      }
    });

    const dishMap = new Map(dishes.map(d => [d.id, d]));

    // Combine and format reviews
    const allReviews = [
      ...productReviews.map(review => ({
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
        } : null
      })),
      ...dishReviews.map(review => {
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
          product: dish ? {
            id: dish.id,
            title: dish.title || 'Inspiratie',
            category: dish.category || 'INSPIRATION',
            image: dish.photos[0]?.url || null
          } : null
        };
      })
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Calculate average rating
    const averageRating = allReviews.length > 0 
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length 
      : 0;

    return NextResponse.json({
      reviews: allReviews,
      averageRating,
      totalCount: allReviews.length
    });

  } catch (error) {
    console.error('Error fetching received reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
