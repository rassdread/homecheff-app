import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/admin-guard';

export const dynamic = 'force-dynamic';

/** List affiliate promo codes for admin override */
export async function GET() {
  const guard = await requireAdminPermission('canViewPaymentInfo');
  if (!guard.ok) return guard.response;

  const promoCodes = await prisma.promoCode.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      affiliate: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      _count: { select: { businessSubscriptions: true } },
    },
  });

  return NextResponse.json({
    promoCodes: promoCodes.map((p) => ({
      id: p.id,
      code: p.code,
      status: p.status,
      discountSharePct: p.discountSharePct,
      startsAt: p.startsAt,
      endsAt: p.endsAt,
      maxRedemptions: p.maxRedemptions,
      redemptionCount: p.redemptionCount,
      appliesTo: p.appliesTo,
      affiliate: {
        id: p.affiliateId,
        name: p.affiliate.user.name,
        email: p.affiliate.user.email,
      },
      businessSubscriptionCount: p._count.businessSubscriptions,
    })),
  });
}
