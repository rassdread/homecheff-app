import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  expireStaleBookingRequests,
} from '@/lib/delivery/booking-request-service';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await Promise.resolve(ctx.params);
    await expireStaleBookingRequests(prisma, [id]);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const request = await prisma.deliveryBookingRequest.findUnique({
      where: { id },
      include: {
        deliveryProfile: {
          select: {
            id: true,
            acceptanceMode: true,
            user: { select: { name: true } },
          },
        },
      },
    });
    if (!request) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (request.buyerId !== user.id) {
      const profile = await prisma.deliveryProfile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!profile || profile.id !== request.deliveryProfileId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json({
      id: request.id,
      status: request.status,
      acceptanceMode: request.acceptanceModeSnapshot,
      expiresAt: request.expiresAt,
      quotedFeeCents: request.quotedFeeCents,
      providerName: request.deliveryProfile.user?.name,
      deliveryProfileId: request.deliveryProfileId,
    });
  } catch (error) {
    console.error('get booking request', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
