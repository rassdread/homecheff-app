import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { matchesCurrentMode } from '@/lib/stripe';
import { connectCtaModelForStatus } from '@/lib/stripe/connect-account-status';
import { loadConnectAccountStatusForUser } from '@/lib/stripe/sync-seller-payment-status';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        stripeConnectAccountId: true,
        stripeConnectOnboardingCompleted: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.stripeConnectAccountId) {
      const cta = connectCtaModelForStatus('NOT_STARTED');
      return NextResponse.json({
        connected: false,
        accountId: null,
        details: null,
        payoutsEnabled: false,
        uiStatus: 'NOT_STARTED',
        paymentReady: false,
        cta,
      });
    }

    if (!matchesCurrentMode(user.stripeConnectAccountId)) {
      await prisma.user.update({
        where: { email: userEmail },
        data: {
          stripeConnectAccountId: null,
          stripeConnectOnboardingCompleted: false,
        },
      });
      const cta = connectCtaModelForStatus('NOT_STARTED');
      return NextResponse.json({
        connected: false,
        accountId: null,
        details: null,
        payoutsEnabled: false,
        uiStatus: 'NOT_STARTED',
        paymentReady: false,
        cta,
        error: 'Account from different Stripe mode. Please reconnect.',
      });
    }

    const live = await loadConnectAccountStatusForUser({
      userId: user.id,
      stripeConnectAccountId: user.stripeConnectAccountId,
      stripeConnectOnboardingCompleted: user.stripeConnectOnboardingCompleted,
      forceLive: true,
    });

    const cta = connectCtaModelForStatus(live.uiStatus);

    return NextResponse.json({
      connected: live.paymentReady,
      accountId: live.accountId,
      details: {
        payoutsEnabled: live.payoutsEnabled,
        chargesEnabled: live.chargesEnabled,
        detailsSubmitted: live.detailsSubmitted,
      },
      payoutsEnabled: live.payoutsEnabled,
      uiStatus: live.uiStatus,
      paymentReady: live.paymentReady,
      cta,
    });
  } catch (error) {
    console.error('Error fetching Stripe status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Stripe status' },
      { status: 500 }
    );
  }
}
