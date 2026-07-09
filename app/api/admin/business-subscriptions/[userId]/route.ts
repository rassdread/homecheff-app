import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { getBusinessVisibilityProfile } from '@/lib/business/visibility-profile';
import { requireAdminPermission } from '@/lib/admin-guard';
import { logAdminAction } from '@/lib/admin-audit';
import { ATTRIBUTION_WINDOW_DAYS } from '@/lib/affiliate-config';

export const dynamic = 'force-dynamic';

function normalizePlanKey(name?: string | null): 'individual' | 'basic' | 'pro' | 'premium' {
  const n = (name || '').trim().toLowerCase();
  if (n === 'basic' || n === 'pro' || n === 'premium') return n;
  return 'individual';
}

/** GET subscription inspection for a business user */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const guard = await requireAdminPermission('canViewPaymentInfo');
  if (!guard.ok) return guard.response;

  const { userId } = await params;

  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId },
    include: {
      Subscription: true,
      User: { select: { id: true, email: true, name: true } },
    },
  });

  const businessSubscription = await prisma.businessSubscription.findUnique({
    where: { businessUserId: userId },
    include: {
      promoCode: { select: { code: true, status: true } },
      attribution: {
        select: { id: true, affiliateId: true, type: true, endsAt: true },
      },
    },
  });

  if (!sellerProfile) {
    return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
  }

  const planKey = normalizePlanKey(sellerProfile.Subscription?.name);
  const dna = getBusinessVisibilityProfile({
    subscriptionId: sellerProfile.subscriptionId,
    subscriptionValidUntil: sellerProfile.subscriptionValidUntil,
    Subscription: sellerProfile.Subscription,
  });

  let stripeState: Record<string, unknown> | null = null;
  if (stripe && sellerProfile.stripeSubscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(sellerProfile.stripeSubscriptionId);
      stripeState = {
        status: sub.status,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        currentPeriodEnd: sub.current_period_end,
      };
    } catch {
      stripeState = { error: 'Unable to fetch Stripe subscription' };
    }
  }

  return NextResponse.json({
    user: sellerProfile.User,
    sellerProfile: {
      subscriptionId: sellerProfile.subscriptionId,
      subscriptionValidUntil: sellerProfile.subscriptionValidUntil,
      stripeSubscriptionId: sellerProfile.stripeSubscriptionId,
      stripeCustomerId: sellerProfile.stripeCustomerId,
      planName: sellerProfile.Subscription?.name ?? null,
      feeBps: sellerProfile.Subscription?.feeBps ?? null,
    },
    businessSubscription,
    businessDna: {
      plan: dna.plan,
      feePercent: dna.feePercent,
      analyticsLevel: dna.analyticsLevel,
      commissionPercent: dna.commissionPercent,
    },
    revenueWindowDays: ATTRIBUTION_WINDOW_DAYS,
    stripeState,
    tracked: { businessSubscriptionRow: Boolean(businessSubscription) },
  });
}

type AdminSubAction =
  | 'cancel_at_period_end'
  | 'reactivate'
  | 'extend_valid_until'
  | 'force_expire';

/** POST admin subscription action */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const guard = await requireAdminPermission('canViewPaymentInfo');
  if (!guard.ok) return guard.response;

  const { userId } = await params;
  const body = await req.json();
  const action = body.action as AdminSubAction;
  const reason = typeof body.reason === 'string' ? body.reason.trim() : undefined;

  if (!action) {
    return NextResponse.json({ error: 'action required' }, { status: 400 });
  }

  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId },
    include: { Subscription: true },
  });

  if (!sellerProfile) {
    return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
  }

  const oldSnapshot = {
    subscriptionValidUntil: sellerProfile.subscriptionValidUntil,
    stripeSubscriptionId: sellerProfile.stripeSubscriptionId,
    subscriptionId: sellerProfile.subscriptionId,
  };

  if (action === 'cancel_at_period_end') {
    if (!stripe || !sellerProfile.stripeSubscriptionId) {
      return NextResponse.json(
        {
          error: 'Stripe subscription not available',
          manualInstruction: 'Cancel via Stripe Dashboard using stripeSubscriptionId',
          stripeSubscriptionId: sellerProfile.stripeSubscriptionId,
        },
        { status: 400 },
      );
    }
    const updated = await stripe.subscriptions.update(sellerProfile.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
    await logAdminAction(guard.admin.user.id, 'SUBSCRIPTION_CANCEL_AT_PERIOD_END', {
      targetType: 'user',
      targetId: userId,
      oldValue: oldSnapshot,
      newValue: { cancelAtPeriodEnd: true },
      reason,
    });
    return NextResponse.json({
      ok: true,
      cancelAtPeriodEnd: updated.cancel_at_period_end,
      currentPeriodEnd: updated.current_period_end,
    });
  }

  if (action === 'reactivate') {
    if (!stripe || !sellerProfile.stripeSubscriptionId) {
      return NextResponse.json({ error: 'Stripe subscription not available' }, { status: 400 });
    }
    const updated = await stripe.subscriptions.update(sellerProfile.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });
    await logAdminAction(guard.admin.user.id, 'SUBSCRIPTION_REACTIVATED', {
      targetType: 'user',
      targetId: userId,
      oldValue: oldSnapshot,
      newValue: { cancelAtPeriodEnd: false },
      reason,
    });
    return NextResponse.json({ ok: true, cancelAtPeriodEnd: updated.cancel_at_period_end });
  }

  if (action === 'extend_valid_until') {
    const days = Number(body.days) || 30;
    const base = sellerProfile.subscriptionValidUntil ?? new Date();
    const extended = new Date(
      Math.max(base.getTime(), Date.now()) + days * 24 * 60 * 60 * 1000,
    );
    await prisma.sellerProfile.update({
      where: { userId },
      data: { subscriptionValidUntil: extended },
    });
    await logAdminAction(guard.admin.user.id, 'SUBSCRIPTION_EXTENDED', {
      targetType: 'user',
      targetId: userId,
      oldValue: oldSnapshot,
      newValue: { subscriptionValidUntil: extended, days },
      reason,
    });
    return NextResponse.json({ ok: true, subscriptionValidUntil: extended });
  }

  if (action === 'force_expire') {
    const now = new Date();
    await prisma.sellerProfile.update({
      where: { userId },
      data: { subscriptionValidUntil: now },
    });
    await logAdminAction(guard.admin.user.id, 'SUBSCRIPTION_FORCE_EXPIRED', {
      targetType: 'user',
      targetId: userId,
      oldValue: oldSnapshot,
      newValue: { subscriptionValidUntil: now },
      reason,
    });
    return NextResponse.json({ ok: true, subscriptionValidUntil: now });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
