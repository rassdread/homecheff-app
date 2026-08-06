import { NextRequest, NextResponse } from 'next/server';
import { processDuePushOutbox } from '@/lib/notifications/push-outbox-delivery';
import { getOutboxStats } from '@/lib/notifications/push-outbox';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function authorizeCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  // Production must not leave the outbox drain publicly callable.
  if (process.env.NODE_ENV === 'production' && !secret) {
    return false;
  }
  if (!secret) return true;
  const authHeader = req.headers.get('authorization');
  return authHeader === `Bearer ${secret}`;
}

/** Drain durable FCM outbox (every minute via vercel.json). */
export async function GET(req: NextRequest) {
  if (!authorizeCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await processDuePushOutbox(50);
    const stats = await getOutboxStats();
    return NextResponse.json({
      success: true,
      ...result,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[cron/notification-outbox]', error);
    return NextResponse.json(
      {
        error: 'Failed to process notification outbox',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
