import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    const limit = parseInt(searchParams.get('limit') || '5');

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get seller profile
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true }
    });

    if (!sellerProfile) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    // Calculate date range
    const now = new Date();
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[period] || 30;

    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Get products with their sales data
    const products = await prisma.product.findMany({
      where: {
        sellerId: sellerProfile.id
      },
      include: {
        orderItems: {
          where: {
            Order: {
              createdAt: {
                gte: startDate,
                lte: now
              }
            }
          },
          include: {
            Order: true
          }
        },
        reviews: {
          select: {
            rating: true
          }
        }
      }
    });

    // Calculate stats for each product
    const productsWithStats = products.map(product => {
      const sales = product.orderItems.reduce((sum, item) => sum + item.quantity, 0);
      const revenue = product.orderItems.reduce((sum, item) => {
        return sum + (item.priceCents * item.quantity);
      }, 0);

      const averageRating = product.reviews.length > 0
        ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
        : 0;

      // Estimate views (this would need to be tracked separately)
      const views = sales * 10; // Rough estimate

      return {
        id: product.id,
        title: product.title,
        sales,
        revenue,
        views,
        rating: averageRating
      };
    });

    // Sort by revenue and take top products
    const topProducts = productsWithStats
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);

    return NextResponse.json({ products: topProducts });
  } catch (error) {
    console.error('Error fetching dashboard products:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}



