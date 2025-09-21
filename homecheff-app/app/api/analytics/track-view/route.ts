import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { productId, userId, type = 'product' } = await req.json();

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Note: viewCount is not a field in the Product model
    // We track views through the AnalyticsEvent table instead

    // Create analytics record for detailed tracking
    await prisma.analyticsEvent.create({
      data: {
        eventType: 'VIEW',
        entityType: 'PRODUCT',
        entityId: productId,
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
