import { NextRequest, NextResponse } from 'next/server';
import { authorizeCronRequest } from '@/lib/email/cron-auth';
import { runShippingStatusSync } from '@/lib/shipping/status-sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Incremental EctaroShip label status sync.
 * Schedule: every 10 minutes (vercel.json).
 * Auth: Bearer CRON_SECRET
 */
export async function GET(req: NextRequest) {
  if (!authorizeCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runShippingStatusSync();
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown';
    console.error(JSON.stringify({ event: 'SHIPMENT_SYNC_FAILED', error: message }));
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
