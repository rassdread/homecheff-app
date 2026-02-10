import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { sellerId: string } }
) {
  try {
    // Check authentication first
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sellerId } = params;

    // Get seller profile with user data
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: sellerId },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            username: true,
            profileImage: true,
            createdAt: true,
            bio: true
          }
        },
        products: {
          where: { isActive: true },
          include: {
            Image: {
              select: {
                fileUrl: true,
                sortOrder: true
              },
              take: 1,
              orderBy: { sortOrder: 'asc' }
            },
            reviews: {
              select: {
                rating: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 12
        }
      }
    });

    if (!sellerProfile) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    // Calculate statistics
    const totalProducts = await prisma.product.count({
      where: { sellerId: sellerProfile.id }
    });

    const activeProducts = await prisma.product.count({
      where: { 
        sellerId: sellerProfile.id,
        isActive: true 
      }
    });

    // Calculate average rating (only submitted reviews)
    const reviews = await prisma.productReview.findMany({
      where: {
        product: {
          sellerId: sellerProfile.id
        },
        reviewSubmittedAt: { not: null } // Only count submitted reviews
      },
      select: {
        rating: true
      }
    });

    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0;

    const totalReviews = reviews.length;

    // Get recent orders count (for seller stats)
    const recentOrders = await prisma.order.count({
      where: {
        items: {
          some: {
            Product: {
              sellerId: sellerProfile.id
            }
          }
        },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    });

    return NextResponse.json({
      seller: {
        ...sellerProfile,
        statistics: {
          totalProducts,
          activeProducts,
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews,
          recentOrders
        }
      }
    });

  } catch (error) {
    console.error('Error fetching seller profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

