import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/admin-guard';
import { logAdminAction } from '@/lib/admin-audit';

export const dynamic = 'force-dynamic';

/** PATCH block/unblock courier — body: { blocked: boolean, reason?: string } */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> },
) {
  const guard = await requireAdminPermission('canViewDeliveryDetails');
  if (!guard.ok) return guard.response;

  const { profileId } = await params;
  const body = await request.json();
  const blocked = Boolean(body.blocked);
  const reason = typeof body.reason === 'string' ? body.reason.trim() : undefined;

  if (blocked && !reason) {
    return NextResponse.json({ error: 'Reason required to block courier' }, { status: 400 });
  }

  const profile = await prisma.deliveryProfile.findUnique({
    where: { id: profileId },
    select: { id: true, isBlocked: true, isActive: true, blockReason: true },
  });

  if (!profile) {
    return NextResponse.json({ error: 'Delivery profile not found' }, { status: 404 });
  }

  const now = new Date();
  const updated = await prisma.deliveryProfile.update({
    where: { id: profileId },
    data: blocked
      ? {
          isBlocked: true,
          blockedAt: now,
          blockedById: guard.admin.user.id,
          blockReason: reason,
          isActive: false,
        }
      : {
          isBlocked: false,
          blockedAt: null,
          blockedById: null,
          blockReason: null,
        },
    select: {
      id: true,
      isBlocked: true,
      isActive: true,
      blockReason: true,
      blockedAt: true,
    },
  });

  await logAdminAction(
    guard.admin.user.id,
    blocked ? 'DELIVERY_BLOCKED' : 'DELIVERY_UNBLOCKED',
    {
      targetType: 'delivery_profile',
      targetId: profileId,
      oldValue: {
        isBlocked: profile.isBlocked,
        reason: profile.blockReason,
      },
      newValue: { isBlocked: blocked, reason },
      reason,
    },
  );

  return NextResponse.json({ ok: true, profile: updated });
}
