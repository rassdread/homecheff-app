/**
 * Uitbetaling van het huidige Stripe Connect-saldo naar de bank.
 * Gebruikers hoeven niet op Stripe in te loggen – alles via de website.
 */
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

const MIN_PAYOUT_CENTS = 1000;

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, stripeConnectAccountId: true, stripeConnectOnboardingCompleted: true },
    });

    if (!user?.stripeConnectAccountId || !user.stripeConnectOnboardingCompleted || !stripe) {
      return NextResponse.json(
        { error: 'Stripe Connect is niet ingesteld.' },
        { status: 400 }
      );
    }

    const balance = await stripe.balance.retrieve(
      {},
      { stripeAccount: user.stripeConnectAccountId }
    );
    const eurAvailable = balance.available?.find((b: { currency: string }) => b.currency === 'eur');
    const availableCents = eurAvailable?.amount ?? 0;

    if (availableCents < MIN_PAYOUT_CENTS) {
      return NextResponse.json(
        {
          error: `Minimaal €${(MIN_PAYOUT_CENTS / 100).toFixed(2)} beschikbaar op je account. Je hebt €${(availableCents / 100).toFixed(2)}.`,
        },
        { status: 400 }
      );
    }

    const payout = await stripe.payouts.create(
      {
        amount: availableCents,
        currency: 'eur',
        metadata: { userId: user.id, type: 'payout_from_website' },
      },
      { stripeAccount: user.stripeConnectAccountId }
    );

    return NextResponse.json({
      success: true,
      message: `Uitbetaling van €${(availableCents / 100).toFixed(2)} (volledig saldo, inclusief fondsen uit het verleden) is onderweg naar je bankrekening (meestal binnen 2–5 werkdagen).`,
      payoutId: payout.id,
      amountCents: availableCents,
    });
  } catch (error: any) {
    console.error('Request bank payout error:', error);
    return NextResponse.json(
      { error: error?.message || 'Uitbetaling mislukt.' },
      { status: 500 }
    );
  }
}
