import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { acceptDeliveryBookingRequest } from '@/lib/delivery/booking-request-service';

export const dynamic = 'force-dynamic';

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> | { id: string } }
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

    const result = await acceptDeliveryBookingRequest(prisma, {
      requestId: id,
      deliveryProfileUserId: user.id,
    });
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, code: 'code' in result ? result.code : undefined },
        { status: result.status }
      );
    }
    return NextResponse.json({ success: true, request: result.request });
  } catch (error) {
    console.error('accept booking', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
