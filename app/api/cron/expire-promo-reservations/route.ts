/**
 * Cron: expire abandoned RESERVED promo redemptions (TTL).
 * Auth: Bearer CRON_SECRET when configured (same pattern as other crons).
 */

import { NextRequest, NextResponse } from 'next/server';
import { expireReservedPromoRedemptions } from '@/lib/promo-codes/expire-reserved-redemptions';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await expireReservedPromoRedemptions();
    return NextResponse.json({
      ok: true,
      message: 'Promo reservation TTL cleanup complete',
      ...result,
    });
  } catch (error: any) {
    console.error('[cron/expire-promo-reservations]', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 },
    );
  }
}
