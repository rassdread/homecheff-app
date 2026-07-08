import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { matchesCurrentMode, STRIPE_SESSION_ID_PREFIX } from '@/lib/stripe';

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

    // Get products with their sales data - ONLY from Stripe-paid orders
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
              },
              stripeSessionId: { not: null }, // Only Stripe Connect orders
              NOT: {
                orderNumber: {
                  startsWith: 'SUB-' // Exclude subscription orders
                }
              }
            }
          },
          include: {
            Order: {
              select: {
                id: true,
                createdAt: true,
                stripeSessionId: true
              }
            }
          }
        },
        reviews: {
          select: {
            rating: true
          }
        }
      }
    });

    const productIds = products.map((p) => p.id);
    const viewCounts =
      productIds.length === 0
        ? []
        : await prisma.analyticsEvent.groupBy({
            by: ['entityId'],
            where: {
              eventType: 'VIEW',
              entityType: 'PRODUCT',
              entityId: { in: productIds },
              createdAt: { gte: startDate, lte: now },
            },
            _count: { _all: true },
          });
    const viewsByProductId = new Map(
      viewCounts.map((row) => [row.entityId, row._count._all]),
    );

    const productsWithStats = products.map((product) => {
      const itemsInMode = product.orderItems.filter(
        (item) =>
          item.Order?.stripeSessionId &&
          matchesCurrentMode(item.Order.stripeSessionId)
      );
      const sales = itemsInMode.reduce((sum, item) => sum + item.quantity, 0);
      const revenue = itemsInMode.reduce((sum, item) => {
        return sum + (item.priceCents * item.quantity);
      }, 0);

      const averageRating = product.reviews.length > 0
        ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
        : 0;

      const views = viewsByProductId.get(product.id) ?? 0;

      return {
        id: product.id,
        title: product.title,
        sales,
        revenue,
        views,
        rating: averageRating,
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

