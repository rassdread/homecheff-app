import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get comprehensive user stats
    const [
      // Fans (people who follow this user)
      fansCount,
      // Following (people this user follows)
      followingCount,
      // Profile views
      profileViews,
      // Product views (for all user's products)
      productViews,
      // Dish views (for all user's dishes/inspiration)
      dishViews,
      // Props received (on all user's content)
      propsReceived,
      // Reviews received (on all user's products)
      reviewsReceived,
      // Products count
      productsCount,
      // Dishes count (inspiration)
      dishesCount,
      // Orders count (as buyer)
      ordersCount,
      // Sales count (as seller)
      salesCount
    ] = await Promise.all([
      // Fans count
      prisma.follow.count({
        where: { sellerId: userId }
      }),
      
      // Following count
      prisma.follow.count({
        where: { followerId: userId }
      }),
      
      // Profile views
      prisma.analyticsEvent.count({
        where: {
          entityId: userId,
          entityType: 'PROFILE',
          eventType: 'VIEW'
        }
      }),
      
      // Product views (sum of all views on user's products) - simplified for now
      Promise.resolve(0),
      
      // Dish views (sum of all views on user's dishes) - simplified for now
      Promise.resolve(0),
      
      // Props received (on all user's content) - to be implemented
      Promise.resolve(0),
      
      // Reviews received - simplified for now
      Promise.resolve(0),
      
      // Products count - simplified for now
      Promise.resolve(0),
      
      // Dishes count - simplified for now
      Promise.resolve(0),
      
      // Orders count (as buyer)
      prisma.order.count({
        where: { userId: userId }
      }),
      
      // Sales count (orders containing user's products) - simplified for now
      Promise.resolve(0)
    ]);

    // Calculate total views and content
    const totalViews = profileViews + productViews + dishViews;
    const totalContent = productsCount + dishesCount;

    return NextResponse.json({
      // Social stats
      fans: fansCount,
      following: followingCount,
      
      // Engagement stats
      views: totalViews,
      profileViews,
      productViews,
      dishViews,
      props: propsReceived,
      reviews: reviewsReceived,
      
      // Content stats
      products: productsCount,
      dishes: dishesCount,
      totalContent,
      
      // Commerce stats
      orders: ordersCount,
      sales: salesCount,
      
      // Calculated metrics
      avgViewsPerContent: totalContent > 0 ? Math.round(totalViews / totalContent) : 0,
      engagementRate: totalViews > 0 ? Math.round((propsReceived / totalViews) * 100) : 0
    });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}
