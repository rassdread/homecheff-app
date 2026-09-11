import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createConnectAccount, stripe, matchesCurrentMode, isTestMode } from '@/lib/stripe';
import { connectCtaModelForStatus } from '@/lib/stripe/connect-account-status';
import { loadConnectAccountStatusForUser } from '@/lib/stripe/sync-seller-payment-status';
import {
  isDualTrackConnectEnabled,
  parseConnectTrack,
  type ConnectTrack,
} from '@/lib/stripe/connect-tracks';
import { evaluateConnectAccountReplacement } from '@/lib/stripe/connect-account-replacement';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        stripeConnectAccountId: true,
        stripeConnectOnboardingCompleted: true,
        stripeConnectTrack: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.stripeConnectAccountId && !matchesCurrentMode(user.stripeConnectAccountId)) {
      await prisma.user.update({
        where: { email: session.user.email },
        data: {
          stripeConnectAccountId: null,
          stripeConnectOnboardingCompleted: false,
          stripeConnectTrack: null,
        },
      });
      const cta = connectCtaModelForStatus('NOT_STARTED');
      return NextResponse.json({
        hasAccount: false,
        isCompleted: false,
        accountId: null,
        uiStatus: 'NOT_STARTED',
        paymentReady: false,
        detailsSubmitted: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        connectTrack: null,
        dualTrackEnabled: isDualTrackConnectEnabled(),
        needsTrackSelection: isDualTrackConnectEnabled(),
        cta,
      });
    }

    const live = await loadConnectAccountStatusForUser({
      userId: user.id,
      stripeConnectAccountId: user.stripeConnectAccountId,
      stripeConnectOnboardingCompleted: user.stripeConnectOnboardingCompleted,
      stripeConnectTrack: user.stripeConnectTrack,
      forceLive: true,
    });

    const cta = connectCtaModelForStatus(live.uiStatus);
    const track = parseConnectTrack(user.stripeConnectTrack);

    return NextResponse.json({
      hasAccount: live.hasAccount,
      isCompleted: live.paymentReady,
      accountId: live.accountId,
      uiStatus: live.uiStatus,
      paymentReady: live.paymentReady,
      detailsSubmitted: live.detailsSubmitted,
      chargesEnabled: live.chargesEnabled,
      payoutsEnabled: live.payoutsEnabled,
      currentlyDueCount: live.currentlyDueCount,
      pastDueCount: live.pastDueCount,
      pendingVerificationCount: live.pendingVerificationCount,
      connectTrack: track,
      dualTrackEnabled: isDualTrackConnectEnabled(),
      needsTrackSelection:
        isDualTrackConnectEnabled() && !live.hasAccount && !track,
      recoveryEligible: false, // stuck Express recovery deferred to later phase
      cta,
    });
  } catch (error) {
    console.error('Stripe Connect status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check Stripe Connect status' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { track?: unknown; forceReplace?: unknown } = {};
    try {
      body = (await req.json()) as { track?: unknown; forceReplace?: unknown };
    } catch {
      body = {};
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        stripeConnectAccountId: true,
        stripeConnectOnboardingCompleted: true,
        stripeConnectTrack: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const dualTrack = isDualTrackConnectEnabled();
    const requestedTrack = parseConnectTrack(body.track);
    const existingTrack = parseConnectTrack(user.stripeConnectTrack);
    // forceReplace intentionally ignored this rollout (stuck recovery deferred).
    void body.forceReplace;

    // Already payment-ready → never create another account.
    if (user.stripeConnectOnboardingCompleted && user.stripeConnectAccountId) {
      const live = await loadConnectAccountStatusForUser({
        userId: user.id,
        stripeConnectAccountId: user.stripeConnectAccountId,
        stripeConnectOnboardingCompleted: user.stripeConnectOnboardingCompleted,
        stripeConnectTrack: user.stripeConnectTrack,
        forceLive: true,
      });
      if (live.paymentReady) {
        return NextResponse.json({
          success: true,
          message: 'Stripe Connect already set up',
          accountId: user.stripeConnectAccountId,
          uiStatus: live.uiStatus,
          paymentReady: true,
          connectTrack: existingTrack,
        });
      }
    }

    // Dual-track: require explicit track for new accounts.
    let track: ConnectTrack | null = requestedTrack || existingTrack;
    if (dualTrack) {
      if (!track) {
        return NextResponse.json(
          {
            error: 'TRACK_REQUIRED',
            errorKey: 'stripe.connect.trackRequired',
            message:
              'Kies of je HomeCheff als particulier of als bedrijf gebruikt.',
            needsTrackSelection: true,
          },
          { status: 400 },
        );
      }
    } else {
      track = track || 'BUSINESS';
    }

    let accountId = user.stripeConnectAccountId;
    const isFakeTestAccount = accountId && accountId.startsWith('acct_test_');

    if (isFakeTestAccount) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          stripeConnectAccountId: null,
          stripeConnectOnboardingCompleted: false,
          stripeConnectTrack: null,
        },
      });
      accountId = null;
    }

    // Track switch / stuck Express recovery intentionally DISABLED this rollout.
    // Stuck Express users keep their existing account; recovery is a later phase.
    if (accountId && dualTrack) {
      const decision = await evaluateConnectAccountReplacement({
        existingAccountId: accountId,
        requestedTrack: track!,
        existingTrack,
      });

      if (decision.allowed && decision.reason === 'SAME_TRACK_REUSE') {
        // keep accountId — continue onboarding link
      } else if (decision.reason === 'NO_EXISTING_ACCOUNT') {
        accountId = null;
      } else if (
        decision.allowed &&
        decision.reason === 'EMPTY_INCOMPLETE_STUCK_EXPRESS'
      ) {
        // Do not auto-replace during this controlled rollout.
        return NextResponse.json(
          {
            error: 'CONNECT_REPLACE_BLOCKED',
            errorKey: 'stripe.connect.replaceBlocked',
            reason: 'STUCK_RECOVERY_DISABLED_THIS_ROLLOUT',
            message:
              'Je bestaande Stripe-profiel blijft ongewijzigd. Nieuwe particuliere onboarding is beschikbaar voor accounts zonder bestaand Connect-profiel.',
          },
          { status: 409 },
        );
      } else if (
        !decision.allowed &&
        requestedTrack &&
        requestedTrack !== existingTrack
      ) {
        return NextResponse.json(
          {
            error: 'CONNECT_REPLACE_BLOCKED',
            errorKey: 'stripe.connect.replaceBlocked',
            reason: decision.reason,
            classification:
              'classification' in decision ? decision.classification : undefined,
            message:
              'Je bestaande Stripe-profiel kan niet automatisch worden vervangen. Neem contact op met support of rond het huidige profiel af.',
          },
          { status: 409 },
        );
      }
    }

    if (!accountId) {
      try {
        console.log('🔍 Creating Stripe Connect account', {
          track,
          mode: isTestMode ? 'TEST' : 'LIVE',
        });
        const connectAccount = await createConnectAccount(
          user.email!,
          'NL',
          dualTrack ? track! : 'express',
        );
        accountId = connectAccount.id;

        await prisma.user.update({
          where: { id: user.id },
          data: {
            stripeConnectAccountId: accountId,
            stripeConnectTrack: track,
            stripeConnectOnboardingCompleted: false,
          },
        });

        try {
          const { syncAffiliateConnectMirrorFromUser } = await import(
            '@/lib/stripe/affiliate-connect-mirror'
          );
          await syncAffiliateConnectMirrorFromUser(user.id);
        } catch (mirrorErr) {
          console.warn('[stripe-onboard] affiliate mirror sync failed', mirrorErr);
        }
      } catch (error: any) {
        console.error('❌ Error creating Connect account:', error);
        let errorMessage =
          'Er is een probleem opgetreden bij het verbinden met Stripe. Probeer het later opnieuw.';
        if (
          error.message?.includes('responsibilities') ||
          error.message?.includes('platform-profile') ||
          error.code === 'account_invalid'
        ) {
          errorMessage =
            'Stripe Connect is momenteel niet beschikbaar. Neem contact op met de beheerder om dit op te lossen.';
        } else if (
          error.message?.includes('Invalid API key') ||
          error.code === 'api_key_expired'
        ) {
          errorMessage =
            'Stripe configuratie probleem. Neem contact op met de beheerder.';
        } else if (error.message?.includes('rate_limit') || error.code === 'rate_limit') {
          errorMessage = 'Te veel requests. Wacht even en probeer het opnieuw.';
        }

        if (error.code !== 'account_already_exists') {
          return NextResponse.json(
            {
              error: errorMessage,
              details: error.code || error.type,
              statusCode: error.statusCode,
              stripeErrorCode: error.code,
              stripeErrorType: error.type,
            },
            { status: 500 },
          );
        }
      }
    } else if (track && track !== existingTrack) {
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeConnectTrack: track },
      });
    } else if (track && !existingTrack) {
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeConnectTrack: track },
      });
    }

    if (!accountId) {
      return NextResponse.json(
        {
          error:
            'Stripe Connect is momenteel niet beschikbaar. Neem contact op met de beheerder om dit op te lossen.',
          details: 'No account ID available after account creation attempt',
        },
        { status: 500 },
      );
    }

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured. Please check your Stripe API keys.' },
        { status: 500 },
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXTAUTH_URL ||
      'https://homecheff.eu';

    let accountLink;
    try {
      accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${baseUrl}/seller/stripe/refresh`,
        return_url: `${baseUrl}/seller/stripe/success`,
        type: 'account_onboarding',
      });
    } catch (error: any) {
      console.error('❌ Error creating Stripe account link:', error);
      return NextResponse.json(
        {
          error:
            'Er is een probleem opgetreden bij het verbinden met Stripe. Probeer het later opnieuw.',
          details: error.code || error.type,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      onboardingUrl: accountLink.url,
      accountId,
      connectTrack: track,
    });
  } catch (error) {
    console.error('Stripe Connect onboarding error:', error);
    return NextResponse.json(
      {
        error:
          'Er is een probleem opgetreden bij het verbinden met Stripe. Probeer het later opnieuw.',
      },
      { status: 500 },
    );
  }
}
