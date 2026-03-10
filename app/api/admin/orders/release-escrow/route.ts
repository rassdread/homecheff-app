/**
 * Admin: escrow vrijgeven voor bestellingen die al DELIVERED zijn maar nog "held" escrow hebben.
 * Gebruik dit om bestaande bestellingen te repareren (uitbetaling naar verkoper mogelijk).
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { releaseEscrowForOrder } from '@/lib/releaseEscrowOnDelivered';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    let orderId: string | undefined;
    try {
      const body = await req.json();
      orderId = typeof body?.orderId === 'string' ? body.orderId : undefined;
    } catch {
      // Geen body = alle DELIVERED orders met held escrow
    }

    if (orderId) {
      const result = await releaseEscrowForOrder(prisma, orderId);
      return NextResponse.json({
        success: true,
        orderId,
        released: result.released,
        errors: result.errors,
      });
    }

    const ordersWithHeldEscrow = await prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        stripeSessionId: { not: null },
        paymentEscrow: {
          some: { currentStatus: 'held', payoutTrigger: 'DELIVERED' },
        },
      },
      select: { id: true },
    });

    const results: Array<{ orderId: string; released: number; errors: string[] }> = [];
    for (const order of ordersWithHeldEscrow) {
      const result = await releaseEscrowForOrder(prisma, order.id);
      results.push({ orderId: order.id, released: result.released, errors: result.errors });
    }

    const totalReleased = results.reduce((s, r) => s + r.released, 0);
    return NextResponse.json({
      success: true,
      message: `${totalReleased} escrow(s) vrijgegeven voor ${ordersWithHeldEscrow.length} bestelling(en).`,
      ordersProcessed: ordersWithHeldEscrow.length,
      totalReleased,
      details: results,
    });
  } catch (error) {
    console.error('Admin release-escrow error:', error);
    return NextResponse.json(
      { error: 'Failed to release escrow', details: (error as Error).message },
      { status: 500 }
    );
  }
}
