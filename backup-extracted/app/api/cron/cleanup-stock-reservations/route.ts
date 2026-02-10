import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Cleanup expired stock reservations
// This should be called by a cron job every 5 minutes
export async function GET(req: NextRequest) {
  // Verify cron secret (optional but recommended)
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    
    // Find all expired PENDING reservations
    const expiredReservations = await prisma.stockReservation.findMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: now }
      },
      select: {
        id: true,
        productId: true,
        quantity: true
      }
    });

    if (expiredReservations.length === 0) {
      return NextResponse.json({ 
        message: 'No expired reservations to clean up',
        cleaned: 0
      });
    }

    // Update expired reservations to EXPIRED status
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.stockReservation.updateMany({
        where: {
          id: { in: expiredReservations.map(r => r.id) },
          status: 'PENDING',
          expiresAt: { lt: now }
        },
        data: {
          status: 'EXPIRED'
        }
      });

      return updated.count;
    });

    console.log(`✅ Cleaned up ${result} expired stock reservations`);

    return NextResponse.json({
      message: 'Expired reservations cleaned up',
      cleaned: result,
      totalExpired: expiredReservations.length
    });

  } catch (error: any) {
    console.error('Error cleaning up stock reservations:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}




