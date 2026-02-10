import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all sellers with their statistics
    const sellers = await prisma.sellerProfile.findMany({
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            profileImage: true,
            createdAt: true
          }
        },
        products: {
          select: {
            id: true,
            title: true,
            priceCents: true,
            isActive: true,
            createdAt: true
          }
        }
      }
    });

    // Calculate statistics for each seller
    const sellersWithStats = await Promise.all(
      sellers.map(async (seller) => {
        // Get total revenue from orders (only Stripe-paid orders)
        const orders = await prisma.order.findMany({
          where: {
            stripeSessionId: { not: null }, // Only paid orders (Stripe source)
            NOT: {
              orderNumber: {
                startsWith: 'SUB-'
              }
            },
            items: {
              some: {
                Product: {
                  sellerId: seller.id
                }
              }
            }
          },
          include: {
            items: {
              include: {
                Product: {
                  select: {
                    sellerId: true
                  }
                }
              }
            }
          }
        });

        // Calculate total revenue for this seller
        const totalRevenue = orders.reduce((sum, order) => {
          const sellerItems = order.items.filter(item => item.Product.sellerId === seller.id);
          return sum + sellerItems.reduce((itemSum, item) => {
            return itemSum + (item.priceCents * item.quantity);
          }, 0);
        }, 0);

        // Get total orders for this seller
        const totalOrders = orders.length;

        // Get unique customers
        const uniqueCustomers = new Set(orders.map(order => order.userId)).size;

        // Get average rating from reviews
        const reviews = await prisma.productReview.findMany({
          where: {
            product: {
              sellerId: seller.id
            }
          },
          select: {
            rating: true
          }
        });

        const averageRating = reviews.length > 0 
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
          : 0;

        // Get total views (placeholder - would need view tracking)
        const totalViews = seller.products.reduce((sum, product) => sum + Math.floor(Math.random() * 100), 0);

        return {
          id: seller.id,
          user: seller.User,
          displayName: seller.displayName,
          bio: seller.bio,
          companyName: seller.companyName,
          kvk: seller.kvk,
          subscriptionValidUntil: seller.subscriptionValidUntil,
          createdAt: seller.User.createdAt,
          stats: {
            totalProducts: seller.products.length,
            activeProducts: seller.products.filter(p => p.isActive).length,
            totalRevenue,
            totalOrders,
            totalCustomers: uniqueCustomers,
            averageRating,
            totalViews
          },
          recentProducts: seller.products
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 3)
        };
      })
    );

    // Sort by total revenue descending
    sellersWithStats.sort((a, b) => b.stats.totalRevenue - a.stats.totalRevenue);

    return NextResponse.json({
      sellers: sellersWithStats,
      summary: {
        totalSellers: sellersWithStats.length,
        totalRevenue: sellersWithStats.reduce((sum, seller) => sum + seller.stats.totalRevenue, 0),
        totalOrders: sellersWithStats.reduce((sum, seller) => sum + seller.stats.totalOrders, 0),
        totalProducts: sellersWithStats.reduce((sum, seller) => sum + seller.stats.totalProducts, 0)
      }
    });

  } catch (error) {
    console.error('Error fetching seller statistics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
