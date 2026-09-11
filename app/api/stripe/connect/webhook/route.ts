import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { resolveConnectWebhookTarget } from '@/lib/stripe/connect-migration';
import { parseConnectTrack } from '@/lib/stripe/connect-tracks';

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

async function applyCurrentAccountReadiness(params: {
  userId: string;
  stripeConnectTrack: string | null;
  account: {
    charges_enabled?: boolean | null;
    payouts_enabled?: boolean | null;
    type?: string | null;
    capabilities?: { transfers?: string | null } | null;
    requirements?: { disabled_reason?: string | null } | null;
    controller?: { stripe_dashboard?: { type?: string | null } } | null;
  };
}) {
  const { isHomecheffPaymentReady } = await import(
    '@/lib/stripe/connect-account-status'
  );
  const track = parseConnectTrack(params.stripeConnectTrack);
  const isCompleted = isHomecheffPaymentReady({
    chargesEnabled: params.account.charges_enabled,
    payoutsEnabled: params.account.payouts_enabled,
    transfersCapability: params.account.capabilities?.transfers ?? null,
    disabledReason: params.account.requirements?.disabled_reason ?? null,
    connectTrack: track,
    accountType: params.account.type ?? null,
    dashboardType: params.account.controller?.stripe_dashboard?.type ?? null,
  });

  await prisma.user.update({
    where: { id: params.userId },
    data: {
      stripeConnectOnboardingCompleted: isCompleted,
    },
  });

  try {
    const { syncAffiliateConnectMirrorFromUser } = await import(
      '@/lib/stripe/affiliate-connect-mirror'
    );
    await syncAffiliateConnectMirrorFromUser(params.userId);
  } catch (mirrorErr) {
    console.warn('[stripe-connect-webhook] affiliate mirror sync failed', mirrorErr);
  }
}

async function handleAccountUpdated(account: any) {
  try {
    const accountId = account.id as string;
    const target = await resolveConnectWebhookTarget(accountId);

    if (!target) {
      console.warn('[stripe-connect-webhook] no user for account.updated', accountId);
      return;
    }

    if (target.role === 'LEGACY_OLD') {
      // Old Express after relink: audit-only. Never overwrite PARTICULAR readiness/track.
      console.log('[stripe-connect-webhook] ignoring readiness sync for LEGACY_OLD', {
        userId: target.userId,
        old: target.oldStripeAccountId,
        current: target.stripeConnectAccountId,
      });
      return;
    }

    // Only sync when webhook account is the user's current linked account.
    if (
      target.stripeConnectAccountId &&
      target.stripeConnectAccountId !== accountId
    ) {
      console.log(
        '[stripe-connect-webhook] skip account.updated — not current account',
        { accountId, current: target.stripeConnectAccountId },
      );
      return;
    }

    await applyCurrentAccountReadiness({
      userId: target.userId,
      stripeConnectTrack: target.stripeConnectTrack,
      account,
    });
  } catch (error) {
    console.error('Error handling account.updated:', error);
  }
}

async function handleCapabilityUpdated(capability: any) {
  try {
    const accountId = capability.account as string;
    const target = await resolveConnectWebhookTarget(accountId);

    if (!target) {
      console.warn(
        '[stripe-connect-webhook] no user for capability.updated',
        accountId,
      );
      return;
    }

    if (target.role === 'LEGACY_OLD') {
      console.log(
        '[stripe-connect-webhook] ignoring capability.updated for LEGACY_OLD',
        accountId,
      );
      return;
    }

    if (
      target.stripeConnectAccountId &&
      target.stripeConnectAccountId !== accountId
    ) {
      return;
    }

    if (!stripe) return;
    const account = await stripe.accounts.retrieve(accountId);
    await applyCurrentAccountReadiness({
      userId: target.userId,
      stripeConnectTrack: target.stripeConnectTrack,
      account: account as any,
    });
  } catch (error) {
    console.error('Error handling capability.updated:', error);
  }
}

async function handleAccountDeauthorized(deauth: any) {
  try {
    const accountId = deauth.id || deauth.account;
    console.log(`🔔 Account deauthorized: ${accountId}`);

    const target = await resolveConnectWebhookTarget(accountId);
    if (!target) {
      console.log(`User not found for deauthorized account: ${accountId}`);
      return;
    }

    // Never clear the user when an OLD migrated Express is deauthorized.
    if (target.role === 'LEGACY_OLD') {
      console.log(
        '[stripe-connect-webhook] ignore deauth for LEGACY_OLD account',
        accountId,
      );
      return;
    }

    if (
      target.stripeConnectAccountId &&
      target.stripeConnectAccountId !== accountId
    ) {
      return;
    }

    await prisma.user.update({
      where: { id: target.userId },
      data: {
        stripeConnectOnboardingCompleted: false,
        stripeConnectAccountId: null,
        stripeConnectTrack: null,
      },
    });

    console.log(
      `✅ Stripe Connect deauthorized for user ${target.userId}, onboarding reset`,
    );
  } catch (error) {
    console.error('Error handling account.application.deauthorized:', error);
  }
}
