import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Analytics, AnalyticsEventType, AnalyticsEntityType } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    
    const {
      eventType,
      entityType,
      entityId,
      metadata = {}
    }: {
      eventType: AnalyticsEventType;
      entityType: AnalyticsEntityType;
      entityId: string;
      metadata?: Record<string, any>;
    } = body;

    // Validatie
    if (!eventType || !entityType || !entityId) {
      return NextResponse.json(
        { error: 'Missing required fields: eventType, entityType, entityId' },
        { status: 400 }
      );
    }

    // Get session ID from headers or generate one
    const sessionId = request.headers.get('x-session-id') || 
                     request.headers.get('x-forwarded-for') || 
                     'anonymous';

    // Track het event
    await Analytics.track({
      eventType,
      entityType,
      entityId,
      userId: (session?.user as any)?.id,
      sessionId,
      metadata: {
        ...metadata,
        userAgent: request.headers.get('user-agent'),
        referer: request.headers.get('referer'),
        timestamp: new Date().toISOString()
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Analytics tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track analytics event' },
      { status: 500 }
    );
  }
}
