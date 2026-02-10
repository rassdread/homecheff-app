import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { DeliveryCountdownService } from '@/lib/delivery-countdown';

/**
 * Cron job endpoint to check and send delivery countdown warnings
 * Should be called every minute by a cron service (e.g., Vercel Cron, external cron)
 * 
 * To set up with Vercel Cron, add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/delivery-warnings",
 *     "schedule": "* * * * *"
 *   }]
 * }
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret (optional, for security)
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await DeliveryCountdownService.checkAndSendWarnings();

    return NextResponse.json({ 
      success: true, 
      message: 'Countdown warnings checked and sent',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in delivery warnings cron job:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process delivery warnings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


