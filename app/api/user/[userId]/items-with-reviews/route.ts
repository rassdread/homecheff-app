import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Haal items met reviews op voor openbaar profiel
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Get dishes (inspiratie items) with reviews
    const dishesWithReviews = await prisma.dish.findMany({
      where: {
        userId: userId,
        status: 'PUBLISHED',
        reviews: {
          some: {}
        }
      },
      include: {
        photos: {
          where: { isMain: true },
          take: 1,
          orderBy: { idx: 'asc' }
        },
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                username: true,
                profileImage: true,
                image: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5 // Laatste 5 reviews
        },
        _count: {
          select: {
            reviews: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    }).catch(() => []);

    // Get products with reviews
    const productsWithReviews = await prisma.product.findMany({
      where: {
        seller: {
          userId: userId
        },
        isActive: true,
        reviews: {
          some: {}
        }
      },
      include: {
        Image: {
          where: { sortOrder: 0 },
          take: 1
        },
        reviews: {
          include: {
            buyer: {
              select: {
                id: true,
                name: true,
                username: true,
                profileImage: true,
                image: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5 // Laatste 5 reviews
        },
        _count: {
          select: {
            reviews: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }).catch(() => []);

    // Transform data
    const items = [
      ...dishesWithReviews.map(dish => ({
        id: dish.id,
        type: 'dish' as const,
        title: dish.title,
        description: dish.description,
        category: dish.category,
        image: dish.photos[0]?.url || null,
        reviewCount: dish._count.reviews,
        averageRating: dish.reviews.length > 0
          ? Math.round((dish.reviews.reduce((sum, r) => sum + r.rating, 0) / dish.reviews.length) * 10) / 10
          : 0,
        recentReviews: dish.reviews.map(r => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment || '',
          reviewer: {
            id: r.reviewer.id,
            name: r.reviewer.name,
            username: r.reviewer.username,
            image: r.reviewer.profileImage || r.reviewer.image
          },
          createdAt: r.createdAt.toISOString()
        })),
        createdAt: dish.createdAt.toISOString(),
        updatedAt: dish.updatedAt.toISOString()
      })),
      ...productsWithReviews.map(product => ({
        id: product.id,
        type: 'product' as const,
        title: product.title,
        description: product.description,
        category: product.category,
        image: product.Image[0]?.fileUrl || null,
        reviewCount: product._count.reviews,
        averageRating: product.reviews.length > 0
          ? Math.round((product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length) * 10) / 10
          : 0,
        recentReviews: product.reviews.map(r => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment || '',
          reviewer: {
            id: r.buyer.id,
            name: r.buyer.name,
            username: r.buyer.username,
            image: r.buyer.profileImage || r.buyer.image
          },
          createdAt: r.createdAt.toISOString()
        })),
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.createdAt.toISOString() // Product has no updatedAt, use createdAt
      }))
    ].sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching items with reviews:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}































