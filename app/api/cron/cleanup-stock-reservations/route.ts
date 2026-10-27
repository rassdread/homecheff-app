import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyReservationBuyer } from '@/lib/delivery/reservation-notifications';
import { releaseExpiredUnpaidHolds } from '@/lib/products/courier-stock-hold';
import { recoverDuplicateCheckoutPayment } from '@/lib/payments/duplicate-payment-recovery';

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
    const result = await releaseExpiredUnpaidHolds(prisma);
    for (const buyerId of result.buyers) {
      await notifyReservationBuyer(buyerId, 'expired');
    }

    const openIncidents = await prisma.checkoutPaymentIncident.findMany({
      where: { status: 'REFUND_REQUIRED' },
      select: { id: true },
      take: 20,
    });
    let incidentsReviewed = 0;
    for (const incident of openIncidents) {
      try {
        await recoverDuplicateCheckoutPayment(prisma, incident.id);
        incidentsReviewed += 1;
      } catch (recoverErr) {
        console.error('[checkout-recovery] incident retry failed', recoverErr);
      }
    }

    console.log(`✅ Cleaned up ${result.cleaned} expired stock reservations`);

    return NextResponse.json({
      message: result.cleaned === 0
        ? 'No expired reservations to clean up'
        : 'Expired reservations cleaned up',
      cleaned: result.cleaned,
      totalExpired: result.cleaned,
      incidentsReviewed,
    });

  } catch (error: any) {
    console.error('Error cleaning up stock reservations:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

































