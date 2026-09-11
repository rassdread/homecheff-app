import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_CONNECT_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'account.updated':
        await handleAccountUpdated(event.data.object);
        break;
      case 'capability.updated':
        await handleCapabilityUpdated(event.data.object);
        break;
      case 'account.application.deauthorized':
        await handleAccountDeauthorized(event.data.object);
        break;
      default:
        console.log(`Unhandled Stripe Connect event: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Stripe Connect webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleAccountUpdated(account: any) {
  try {
    const accountId = account.id;

    const user = await prisma.user.findFirst({
      where: { stripeConnectAccountId: accountId },
      select: {
        id: true,
        stripeConnectTrack: true,
      },
    });

    if (!user) {
      console.error('User not found for account:', accountId);
      return;
    }

    const { isHomecheffPaymentReady } = await import(
      '@/lib/stripe/connect-account-status'
    );
    const isCompleted = isHomecheffPaymentReady({
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      transfersCapability: account.capabilities?.transfers ?? null,
      disabledReason: account.requirements?.disabled_reason ?? null,
      connectTrack:
        user.stripeConnectTrack === 'PARTICULAR' ||
        user.stripeConnectTrack === 'BUSINESS'
          ? user.stripeConnectTrack
          : null,
      accountType: account.type ?? null,
      dashboardType: account.controller?.stripe_dashboard?.type ?? null,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        stripeConnectOnboardingCompleted: isCompleted,
      },
    });

    try {
      const { syncAffiliateConnectMirrorFromUser } = await import(
        '@/lib/stripe/affiliate-connect-mirror'
      );
      await syncAffiliateConnectMirrorFromUser(user.id);
    } catch (mirrorErr) {
      console.warn('[stripe-connect-webhook] affiliate mirror sync failed', mirrorErr);
    }
  } catch (error) {
    console.error('Error handling account.updated:', error);
  }
}

async function handleCapabilityUpdated(capability: any) {
  try {
    const accountId = capability.account;

    const user = await prisma.user.findFirst({
      where: { stripeConnectAccountId: accountId },
      select: {
        id: true,
        stripeConnectTrack: true,
      },
    });

    if (!user) {
      console.error('User not found for capability account:', accountId);
      return;
    }

    if (!stripe) {
      return;
    }

    const account = await stripe.accounts.retrieve(accountId);
    const { isHomecheffPaymentReady } = await import(
      '@/lib/stripe/connect-account-status'
    );
    const isCompleted = isHomecheffPaymentReady({
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      transfersCapability: account.capabilities?.transfers ?? null,
      disabledReason: account.requirements?.disabled_reason ?? null,
      connectTrack:
        user.stripeConnectTrack === 'PARTICULAR' ||
        user.stripeConnectTrack === 'BUSINESS'
          ? user.stripeConnectTrack
          : null,
      accountType: account.type ?? null,
      dashboardType: (account as any).controller?.stripe_dashboard?.type ?? null,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        stripeConnectOnboardingCompleted: isCompleted,
      },
    });

    try {
      const { syncAffiliateConnectMirrorFromUser } = await import(
        '@/lib/stripe/affiliate-connect-mirror'
      );
      await syncAffiliateConnectMirrorFromUser(user.id);
    } catch (mirrorErr) {
      console.warn('[stripe-connect-webhook] affiliate mirror sync failed', mirrorErr);
    }
  } catch (error) {
    console.error('Error handling capability.updated:', error);
  }
}

async function handleAccountDeauthorized(deauth: any) {
  try {
    const accountId = deauth.id || deauth.account;
    
    console.log(`🔔 Account deauthorized: ${accountId}`);
    
    // Find user with this Stripe Connect account ID
    const user = await prisma.user.findFirst({
      where: { stripeConnectAccountId: accountId }
    });

    if (!user) {
      console.log(`User not found for deauthorized account: ${accountId}`);
      return;
    }

    // Reset Stripe Connect onboarding status
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        stripeConnectOnboardingCompleted: false,
        stripeConnectAccountId: null,
        stripeConnectTrack: null,
      }
    });

    console.log(`✅ Stripe Connect deauthorized for user ${user.id}, onboarding reset`);

    // Optional: Notify user that their Stripe Connect account has been disconnected
    // Could add notification here if needed

  } catch (error) {
    console.error('Error handling account.application.deauthorized:', error);
  }
}