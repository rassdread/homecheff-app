import { prisma } from '@/lib/prisma';

export type AnalyticsEventType = 'VIEW' | 'CLICK' | 'LIKE' | 'SHARE' | 'PURCHASE' | 'FAVORITE';
export type AnalyticsEntityType = 'PRODUCT' | 'DISH' | 'PROFILE' | 'POST';

interface AnalyticsEvent {
  eventType: AnalyticsEventType;
  entityType: AnalyticsEntityType;
  entityId: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export class Analytics {
  /**
   * Track een analytics event
   */
  static async track({
    eventType,
    entityType,
    entityId,
    userId,
    sessionId,
    metadata = {}
  }: AnalyticsEvent) {
    try {
      // Voorkomen van spam - max 1 view per user per entity per 5 minuten
      if (eventType === 'VIEW' && userId) {
        const recentView = await prisma.analyticsEvent.findFirst({
          where: {
            eventType: 'VIEW',
            entityType,
            entityId,
            userId,
            createdAt: {
              gte: new Date(Date.now() - 5 * 60 * 1000) // 5 minuten geleden
            }
          }
        });

        if (recentView) {
          return; // Skip duplicate view
        }
      }

      await prisma.analyticsEvent.create({
        data: {
          eventType,
          entityType,
          entityId,
          userId,
          metadata: {
            ...metadata,
            sessionId
          },
          createdAt: new Date()
        }
      });

      console.log(`📊 Analytics: ${eventType} on ${entityType} ${entityId}`);
    } catch (error) {
      console.error('❌ Analytics tracking failed:', error);
      // Fail silently - analytics shouldn't break the app
    }
  }

  /**
   * Track product view
   */
  static async trackProductView(productId: string, userId?: string, sessionId?: string) {
    return this.track({
      eventType: 'VIEW',
      entityType: 'PRODUCT',
      entityId: productId,
      userId,
      sessionId
    });
  }

  /**
   * Track inspiration view
   */
  static async trackInspirationView(dishId: string, userId?: string, sessionId?: string) {
    return this.track({
      eventType: 'VIEW',
      entityType: 'DISH',
      entityId: dishId,
      userId,
      sessionId
    });
  }

  /**
   * Track profile view
   */
  static async trackProfileView(profileUserId: string, viewerUserId?: string, sessionId?: string) {
    return this.track({
      eventType: 'VIEW',
      entityType: 'PROFILE',
      entityId: profileUserId,
      userId: viewerUserId,
      sessionId
    });
  }

  /**
   * Track engagement (like, favorite, etc.)
   */
  static async trackEngagement(
    eventType: 'LIKE' | 'FAVORITE' | 'SHARE',
    entityType: AnalyticsEntityType,
    entityId: string,
    userId: string,
    metadata?: Record<string, any>
  ) {
    return this.track({
      eventType,
      entityType,
      entityId,
      userId,
      metadata
    });
  }

  /**
   * Get engagement stats voor een entity
   */
  static async getEngagementStats(entityType: AnalyticsEntityType, entityId: string) {
    const [views, likes, favorites, shares] = await Promise.all([
      prisma.analyticsEvent.count({
        where: { eventType: 'VIEW', entityType, entityId }
      }),
      prisma.analyticsEvent.count({
        where: { eventType: 'LIKE', entityType, entityId }
      }),
      prisma.analyticsEvent.count({
        where: { eventType: 'FAVORITE', entityType, entityId }
      }),
      prisma.analyticsEvent.count({
        where: { eventType: 'SHARE', entityType, entityId }
      })
    ]);

    return {
      views,
      likes,
      favorites,
      shares,
      totalEngagement: likes + favorites + shares,
      engagementRate: views > 0 ? ((likes + favorites + shares) / views) * 100 : 0
    };
  }

  /**
   * Get trending content gebaseerd op engagement
   */
  static async getTrendingContent(
    entityType: AnalyticsEntityType,
    timeframe: 'day' | 'week' | 'month' = 'week',
    limit = 10
  ) {
    const timeframeDays = {
      day: 1,
      week: 7,
      month: 30
    };

    const since = new Date(Date.now() - timeframeDays[timeframe] * 24 * 60 * 60 * 1000);

    const trending = await prisma.analyticsEvent.groupBy({
      by: ['entityId'],
      where: {
        entityType,
        createdAt: { gte: since }
      },
      _count: {
        entityId: true
      },
      orderBy: {
        _count: {
          entityId: 'desc'
        }
      },
      take: limit
    });

    return trending.map(item => ({
      entityId: item.entityId,
      engagementCount: item._count.entityId
    }));
  }

  /**
   * Get user engagement metrics
   */
  static async getUserEngagementMetrics(userId: string) {
    const [totalViews, totalLikes, totalShares, contentViews] = await Promise.all([
      // Views op user's content - simplified for now
      Promise.resolve(0),
      
      // Likes op user's content - simplified for now
      Promise.resolve(0),
      
      // Shares van user's content - simplified for now
      Promise.resolve(0),

      // User's eigen views (wat ze bekeken hebben)
      prisma.analyticsEvent.count({
        where: {
          eventType: 'VIEW',
          userId
        }
      })
    ]);

    return {
      totalViews,
      totalLikes,
      totalShares,
      contentViews,
      engagementRate: totalViews > 0 ? ((totalLikes + totalShares) / totalViews) * 100 : 0
    };
  }
}
