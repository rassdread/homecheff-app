import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { productId, dishId, userId, type = 'product', entityType = 'PRODUCT' } = await req.json();

    // Support both productId (for products) and dishId (for inspiration items)
    const entityId = productId || dishId;
    
    if (!entityId) {
      return NextResponse.json({ error: 'Product ID or Dish ID is required' }, { status: 400 });
    }

    // Determine entity type: if dishId is provided, use DISH, otherwise use provided entityType or default to PRODUCT
    const finalEntityType = dishId ? 'DISH' : (entityType || 'PRODUCT');

    // Note: viewCount is not a field in the Product/Dish model
    // We track views through the AnalyticsEvent table instead

    // Create analytics record for detailed tracking
    await prisma.analyticsEvent.create({
      data: {
        eventType: 'VIEW',
        entityType: finalEntityType,
        entityId: entityId,
        userId: userId || null,
        metadata: {
          type: type,
          timestamp: new Date().toISOString(),
          userAgent: req.headers.get('user-agent') || '',
          referer: req.headers.get('referer') || ''
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking view:', error);
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 });
  }
}
