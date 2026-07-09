import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PromoCodeStatus } from '@prisma/client';
import { requireAdminPermission } from '@/lib/admin-guard';
import { logAdminAction } from '@/lib/admin-audit';

export const dynamic = 'force-dynamic';

/** PATCH disable or restore promo code — body: { status: 'ACTIVE' | 'DISABLED', reason?: string } */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdminPermission('canViewPaymentInfo');
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const body = await request.json();
  const status = body.status as PromoCodeStatus;
  const reason = typeof body.reason === 'string' ? body.reason.trim() : undefined;

  if (status !== 'ACTIVE' && status !== 'DISABLED') {
    return NextResponse.json({ error: 'status must be ACTIVE or DISABLED' }, { status: 400 });
  }

  if (status === 'DISABLED' && !reason) {
    return NextResponse.json({ error: 'Reason required to disable promo' }, { status: 400 });
  }

  const existing = await prisma.promoCode.findUnique({
    where: { id },
    select: { id: true, code: true, status: true, affiliateId: true },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Promo code not found' }, { status: 404 });
  }

  const updated = await prisma.promoCode.update({
    where: { id },
    data: { status },
    select: { id: true, code: true, status: true, redemptionCount: true },
  });

  await logAdminAction(
    guard.admin.user.id,
    status === 'DISABLED' ? 'PROMO_CODE_DISABLED' : 'PROMO_CODE_RESTORED',
    {
      targetType: 'promo_code',
      targetId: id,
      oldValue: { status: existing.status },
      newValue: { status },
      reason,
      meta: { code: existing.code, affiliateId: existing.affiliateId },
    },
  );

  return NextResponse.json({ ok: true, promoCode: updated });
}
