import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Official EctaroShip Partner API has no webhook registration / HMAC secret.
 * Shipment status is synchronized via GET /api/v1/shipping/labels (cron).
 *
 * This endpoint remains fail-closed / permanently disabled — never fail-open.
 */
export async function POST(_req: NextRequest) {
  return NextResponse.json(
    {
      error: 'EctaroShip webhooks are not part of the Partner API contract',
      code: 'ECTAROSHIP_WEBHOOK_UNSUPPORTED',
      sync: '/api/cron/shipping-sync',
    },
    { status: 410 },
  );
}

export async function GET() {
  return NextResponse.json(
    {
      error: 'EctaroShip webhooks are not part of the Partner API contract',
      code: 'ECTAROSHIP_WEBHOOK_UNSUPPORTED',
    },
    { status: 410 },
  );
}
