import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/admin-guard';
import { logAdminAction } from '@/lib/admin-audit';

export const dynamic = 'force-dynamic';

/** PATCH activate/deactivate courier profile */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> },
) {
  const guard = await requireAdminPermission('canViewDeliveryDetails');
  if (!guard.ok) return guard.response;

  const { profileId } = await params;
  const { isActive } = await request.json();

  if (typeof isActive !== 'boolean') {
    return NextResponse.json({ error: 'isActive boolean required' }, { status: 400 });
  }

  const profile = await prisma.deliveryProfile.findUnique({
    where: { id: profileId },
    select: { id: true, isActive: true, userId: true, isBlocked: true },
  });

  if (!profile) {
    return NextResponse.json({ error: 'Delivery profile not found' }, { status: 404 });
  }

  if (profile.isBlocked && isActive) {
    return NextResponse.json(
      { error: 'Unblock courier before activating' },
      { status: 400 },
    );
  }

  const updated = await prisma.deliveryProfile.update({
    where: { id: profileId },
    data: { isActive },
    select: { id: true, isActive: true, userId: true },
  });

  await logAdminAction(guard.admin.user.id, 'DELIVERY_STATUS_UPDATE', {
    targetType: 'delivery_profile',
    targetId: profileId,
    oldValue: { isActive: profile.isActive },
    newValue: { isActive },
  });

  return NextResponse.json({ ok: true, profile: updated });
}
