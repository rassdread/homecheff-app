import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { releasePendingBookingForCourierSwitch } from '@/lib/delivery/booking-request-service';

export const dynamic = 'force-dynamic';

/**
 * Stop the active courier request so the buyer can choose another.
 * Does not release the product hold and does not start a new deadline.
 */
export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await Promise.resolve(ctx.params);
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const result = await releasePendingBookingForCourierSwitch(prisma, {
      requestId: id,
      buyerId: user.id,
    });
    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          code: result.code,
          active: 'active' in result ? result.active : true,
          bookingRequestId: 'bookingRequestId' in result ? result.bookingRequestId : undefined,
        },
        { status: result.status },
      );
    }
    const fresh = await prisma.deliveryBookingRequest.findUnique({
      where: { id },
      select: { status: true },
    });
    const status = fresh?.status ?? result.status;
    const active = status === 'PENDING' || status === 'ACCEPTED' || status === 'AUTO_CONFIRMED';
    if (active) {
      return NextResponse.json(
        {
          error: 'Het vorige bezorgverzoek is nog actief.',
          code: 'STILL_ACTIVE',
          active: true,
          status,
        },
        { status: 409 },
      );
    }
    return NextResponse.json({
      success: true,
      active: false,
      status,
      bookingRequestId: id,
    });
  } catch (error) {
    console.error('switch courier booking', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
