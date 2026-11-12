import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { acceptDeliveryBookingRequest } from '@/lib/delivery/booking-request-service';
import { deliveryDisabledBody } from '@/lib/delivery/delivery-deployment-gate';
import { publicDeliveryIsClosed } from '@/lib/delivery/delivery-pilot-access';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    if (publicDeliveryIsClosed()) {
      return NextResponse.json(deliveryDisabledBody(), { status: 403 });
    }
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

    const body = await req.json().catch(() => ({}));
    const confirmation = body && typeof body === 'object' && 'confirmation' in body
      ? (body as { confirmation?: { loadMinutes?: unknown; unloadMinutes?: unknown; acceptEstimatedDrive?: unknown; acknowledgeUnknownConnections?: unknown } }).confirmation
      : null;
    const minutesOrNull = (value: unknown) =>
      typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
    const result = await acceptDeliveryBookingRequest(prisma, {
      requestId: id,
      deliveryProfileUserId: user.id,
      confirmation: confirmation
        ? {
            loadMinutes: minutesOrNull(confirmation.loadMinutes),
            unloadMinutes: minutesOrNull(confirmation.unloadMinutes),
            acceptEstimatedDrive: confirmation.acceptEstimatedDrive === true,
            acknowledgeUnknownConnections: confirmation.acknowledgeUnknownConnections === true,
          }
        : null,
    });
    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          code: 'code' in result ? result.code : undefined,
          schedule: 'schedule' in result ? result.schedule : undefined,
          conflicts: 'conflicts' in result ? result.conflicts : undefined,
        },
        { status: result.status }
      );
    }
    return NextResponse.json({ success: true, request: result.request });
  } catch (error) {
    console.error('accept booking', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
