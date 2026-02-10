import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '7d';

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (range) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get promo analytics data
    const [
      modalViews,
      modalClicks,
      tileClicks,
      registrations,
      hourlyData,
      deviceData
    ] = await Promise.all([
      // Modal views
      prisma.analyticsEvent.groupBy({
        by: ['entityId'],
        where: {
          eventType: 'PROMO_MODAL_VIEW',
          entityType: 'PROMO_MODAL',
          createdAt: { gte: startDate }
        },
        _count: { id: true }
      }),

      // Modal clicks (CTA + Login)
      prisma.analyticsEvent.groupBy({
        by: ['entityId', 'eventType'],
        where: {
          eventType: { in: ['PROMO_MODAL_CTA', 'PROMO_MODAL_LOGIN', 'PROMO_MODAL_CLOSE'] },
          entityType: 'PROMO_MODAL',
          createdAt: { gte: startDate }
        },
        _count: { id: true }
      }),

      // Tile clicks
      prisma.analyticsEvent.groupBy({
        by: ['entityId'],
        where: {
          eventType: 'PROMO_TILE_CLICK',
          entityType: 'PROMO_TILE',
          createdAt: { gte: startDate }
        },
        _count: { id: true }
      }),

      // New registrations (approximate - users created in timeframe)
      prisma.user.count({
        where: {
          createdAt: { gte: startDate }
        }
      }),

      // Hourly breakdown
      prisma.analyticsEvent.findMany({
        where: {
          eventType: { in: ['PROMO_MODAL_VIEW', 'PROMO_MODAL_CTA', 'PROMO_TILE_CLICK'] },
          createdAt: { gte: startDate }
        },
        select: {
          eventType: true,
          createdAt: true,
          metadata: true
        }
      }),

      // Device data from metadata
      prisma.analyticsEvent.findMany({
        where: {
          eventType: { in: ['PROMO_MODAL_VIEW', 'PROMO_TILE_CLICK'] },
          createdAt: { gte: startDate }
        },
        select: {
          metadata: true
        }
      })
    ]);

    // Process modal stats
    const modalStats = modalViews.map(view => {
      const modalType = view.entityId;
      const ctaClicks = modalClicks.find(c => c.entityId === modalType && c.eventType === 'PROMO_MODAL_CTA')?._count.id || 0;
      const loginClicks = modalClicks.find(c => c.entityId === modalType && c.eventType === 'PROMO_MODAL_LOGIN')?._count.id || 0;
      const closes = modalClicks.find(c => c.entityId === modalType && c.eventType === 'PROMO_MODAL_CLOSE')?._count.id || 0;
      const totalClicks = ctaClicks + loginClicks;
      const conversionRate = view._count.id > 0 ? (totalClicks / view._count.id) * 100 : 0;

      return {
        modalType,
        views: view._count.id,
        ctaClicks,
        loginClicks,
        closes,
        conversionRate
      };
    });

    // Process tile stats
    const tileStats = tileClicks.map(tile => {
      const tileType = tile.entityId;
      const modalViewsForTile = modalViews.find(m => m.entityId === tileType)?._count.id || 0;
      const conversionRate = tile._count.id > 0 ? (modalViewsForTile / tile._count.id) * 100 : 0;

      return {
        tileType,
        clicks: tile._count.id,
        modalViews: modalViewsForTile,
        conversionRate
      };
    });

    // Process hourly stats
    const hourlyStats = Array.from({ length: 24 }, (_, hour) => {
      const hourEvents = hourlyData.filter(event => 
        new Date(event.createdAt).getHours() === hour
      );
      
      return {
        hour,
        views: hourEvents.filter(e => e.eventType === 'PROMO_MODAL_VIEW').length,
        clicks: hourEvents.filter(e => e.eventType === 'PROMO_MODAL_CTA' || e.eventType === 'PROMO_TILE_CLICK').length
      };
    });

    // Process device stats
    let mobileCount = 0;
    let desktopCount = 0;

    deviceData.forEach(event => {
      const userAgent = (event.metadata as any)?.userAgent || '';
      if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
        mobileCount++;
      } else {
        desktopCount++;
      }
    });

    // Calculate totals
    const totalViews = modalViews.reduce((sum, modal) => sum + modal._count.id, 0);
    const totalClicks = modalClicks
      .filter(click => click.eventType === 'PROMO_MODAL_CTA' || click.eventType === 'PROMO_MODAL_LOGIN')
      .reduce((sum, click) => sum + click._count.id, 0);
    const conversionRate = totalViews > 0 ? (registrations / totalViews) * 100 : 0;

    return NextResponse.json({
      totalViews,
      totalClicks,
      totalRegistrations: registrations,
      conversionRate,
      modalStats,
      tileStats,
      hourlyStats,
      deviceStats: {
        mobile: mobileCount,
        desktop: desktopCount
      }
    });

  } catch (error) {
    console.error('Error fetching promo analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



