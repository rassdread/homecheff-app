import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

/** Self-service cancel — ends subscription at period end via Stripe Billing. */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    if (!stripe) {
      return NextResponse.json({ error: 'Stripe is niet geconfigureerd' }, { status: 500 });
    }

    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: session.user.id },
      select: { stripeSubscriptionId: true },
    });

    if (!sellerProfile?.stripeSubscriptionId) {
      return NextResponse.json({ error: 'Geen actief abonnement' }, { status: 404 });
    }

    const updated = await stripe.subscriptions.update(sellerProfile.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    return NextResponse.json({
      ok: true,
      cancelAtPeriodEnd: updated.cancel_at_period_end,
      currentPeriodEnd: updated.current_period_end,
    });
  } catch (error: any) {
    console.error('[subscribe/cancel]', error);
    return NextResponse.json(
      { error: error?.message || 'Annuleren mislukt' },
      { status: 500 },
    );
  }
}
