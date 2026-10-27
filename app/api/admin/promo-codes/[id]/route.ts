import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PromoCodeStatus } from '@prisma/client';
import { requireAdminPermission } from '@/lib/admin-guard';
import { logAdminAction } from '@/lib/admin-audit';
import { updatePromoRedemptionLimit } from '@/lib/promo-codes/promo-limit-update';

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
  const immutableTerms = ['discountSharePct', 'discountDurationCycles', 'discountValue', 'code', 'appliesTo'];
  if (immutableTerms.some((key) => Object.prototype.hasOwnProperty.call(body, key))) {
    return NextResponse.json(
      { error: 'Discount terms cannot be edited on an existing promotion' },
      { status: 400 },
    );
  }

  const reason = typeof body.reason === 'string' ? body.reason.trim() : undefined;
  const limitRequested = Object.prototype.hasOwnProperty.call(body, 'maxRedemptions');
  const endsRequested = Object.prototype.hasOwnProperty.call(body, 'endsAt');
  if (limitRequested || endsRequested) {
    if (!reason) {
      return NextResponse.json({ error: 'Reason required to edit a promotion limit' }, { status: 400 });
    }
    let nextMax: number | null = null;
    if (limitRequested) {
      if (body.maxRedemptions === null) nextMax = null;
      else if (typeof body.maxRedemptions === 'number') nextMax = body.maxRedemptions;
      else return NextResponse.json({ error: 'maxRedemptions must be a number or null' }, { status: 400 });
    }
    let endsAt: Date | null = null;
    if (endsRequested) {
      if (body.endsAt === null || body.endsAt === '') endsAt = null;
      else {
        const parsed = new Date(body.endsAt);
        if (Number.isNaN(parsed.getTime())) {
          return NextResponse.json({ error: 'endsAt is not a valid date' }, { status: 400 });
        }
        endsAt = parsed;
      }
    }
    const existingForLimit = await prisma.promoCode.findUnique({
      where: { id },
      select: { id: true, maxRedemptions: true, endsAt: true },
    });
    if (!existingForLimit) {
      return NextResponse.json({ error: 'Promo code not found' }, { status: 404 });
    }
    const updatedLimit = await updatePromoRedemptionLimit({
      promoCodeId: id,
      nextMax: limitRequested ? nextMax : existingForLimit.maxRedemptions,
      endsAt,
      endsAtProvided: endsRequested,
    });
    if (!updatedLimit.ok) {
      return NextResponse.json({ error: updatedLimit.error }, { status: updatedLimit.status });
    }
    await logAdminAction(guard.admin.user.id, 'PROMO_LIMIT_UPDATED', {
      targetType: 'promo_code',
      targetId: id,
      oldValue: { maxRedemptions: updatedLimit.previousMax },
      newValue: {
        maxRedemptions: updatedLimit.maxRedemptions,
        endsAt: updatedLimit.endsAt,
        discountSharePct: updatedLimit.discountSharePct,
        discountDurationCycles: updatedLimit.discountDurationCycles,
      },
      reason,
      meta: {
        activeRedemptions: updatedLimit.activeRedemptions,
        remaining: updatedLimit.remaining,
        stripeSync: updatedLimit.stripeSync,
      },
    });
    if (!body.status) {
      return NextResponse.json({ ok: true, promoCode: updatedLimit });
    }
  }

  const status = body.status as PromoCodeStatus;

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
