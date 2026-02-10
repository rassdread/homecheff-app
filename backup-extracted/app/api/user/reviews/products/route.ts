import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Haal alle producten op van een gebruiker die reviews hebben
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all products from this user (via SellerProfile) that have reviews
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!sellerProfile) {
      return NextResponse.json({ products: [] });
    }

    // Get products with reviews
    const products = await prisma.product.findMany({
      where: {
        sellerId: sellerProfile.id,
        reviews: {
          some: {}
        }
      },
      include: {
        Image: {
          select: { id: true, fileUrl: true, sortOrder: true },
          orderBy: { sortOrder: 'asc' },
          take: 1
        },
        reviews: {
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
          },
          orderBy: { createdAt: 'desc' }
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
    });

    // Also get dishes with reviews
    const dishes = await prisma.dish.findMany({
      where: {
        userId,
        reviews: {
          some: {}
        }
      },
      include: {
        photos: {
          select: { id: true, url: true, idx: true },
          orderBy: { idx: 'asc' },
          take: 1
        },
        reviews: {
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
          },
          orderBy: { createdAt: 'desc' }
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
    });

    // Transform products and dishes to unified format
    const productsWithReviews = products.map(product => ({
      id: product.id,
      title: product.title,
      description: product.description,
      priceCents: product.priceCents,
      category: product.category,
      type: 'product' as const,
      image: product.Image?.[0]?.fileUrl || null,
      reviewCount: product._count.reviews,
      averageRating: product.reviews.length > 0
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
        : 0,
      reviews: product.reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        images: review.images.map(img => ({
          id: img.id,
          url: img.url,
          sortOrder: img.sortOrder
        })),
        isVerified: review.isVerified,
        createdAt: review.createdAt,
        buyer: review.buyer
      }))
    }));

    const dishesWithReviews = dishes.map(dish => ({
      id: dish.id,
      title: dish.title,
      description: dish.description,
      priceCents: dish.priceCents,
      category: dish.category,
      type: 'dish' as const,
      image: dish.photos?.[0]?.url || null,
      reviewCount: dish._count.reviews,
      averageRating: dish.reviews.length > 0
        ? dish.reviews.reduce((sum, r) => sum + r.rating, 0) / dish.reviews.length
        : 0,
      reviews: dish.reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        images: review.images.map(img => ({
          id: img.id,
          url: img.url,
          sortOrder: img.sortOrder
        })),
        isVerified: review.isVerified,
        createdAt: review.createdAt,
        buyer: review.buyer
      }))
    }));

    // Combine and sort by most recent review
    const allItems = [...productsWithReviews, ...dishesWithReviews].sort((a, b) => {
      const aLatestReview = a.reviews[0]?.createdAt || new Date(0);
      const bLatestReview = b.reviews[0]?.createdAt || new Date(0);
      return new Date(bLatestReview).getTime() - new Date(aLatestReview).getTime();
    });

    return NextResponse.json({ products: allItems });
  } catch (error) {
    console.error('Error fetching user products with reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products with reviews' },
      { status: 500 }
    );
  }
}




