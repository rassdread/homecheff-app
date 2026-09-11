import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
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
import {
  classifyConnectMigration,
  migrationIsRecoveryMode,
  migrationNeedsUserConfirmation,
  STRIPE_CONNECT_MIGRATE_AUDIT,
  STRIPE_CONNECT_TRACK_CHOICE_AUDIT,
  findMigrationByOldOrNewAccount,
} from '@/lib/stripe/connect-migration';

export async function GET() {
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
        recoveryEligible: false,
        migrationClass: isDualTrackConnectEnabled()
          ? 'NEW_ACCOUNT_CHOICE'
          : 'KEEP_BUSINESS',
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

    let stripeAccount: Parameters<typeof classifyConnectMigration>[0]['stripeAccount'] =
      null;
    if (stripe && user.stripeConnectAccountId) {
      try {
        const acct = await stripe.accounts.retrieve(user.stripeConnectAccountId);
        stripeAccount = acct as any;
      } catch {
        stripeAccount = null;
      }
    }

    const migrationClass = isDualTrackConnectEnabled()
      ? classifyConnectMigration({
          stripeConnectAccountId: user.stripeConnectAccountId,
          stripeConnectTrack: user.stripeConnectTrack,
          paymentReady: live.paymentReady,
          stripeAccount,
        })
      : live.paymentReady
        ? 'KEEP_BUSINESS'
        : 'KEEP_BUSINESS';

    const track = parseConnectTrack(user.stripeConnectTrack);
    const recoveryEligible =
      isDualTrackConnectEnabled() && migrationIsRecoveryMode(migrationClass);
    const needsTrackSelection =
      isDualTrackConnectEnabled() &&
      migrationNeedsUserConfirmation(migrationClass) &&
      !track;

    // PARTICULAR incomplete: still show picker only when confirmation required;
    // otherwise continue onboarding CTA.
    const cta =
      track === 'PARTICULAR' && !live.paymentReady && live.hasAccount
        ? {
            kind: 'complete' as const,
            showOnboardingCta: true,
            titleNl: 'Je particuliere betaalprofiel staat klaar om te worden geverifieerd.',
            bodyNl:
              'Stripe heeft nog enkele persoonlijke gegevens of je bankrekening nodig. Een KvK-inschrijving hoort niet bij deze route.',
            ctaLabelNl: 'Verificatie afronden',
          }
        : connectCtaModelForStatus(live.uiStatus);

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
      needsTrackSelection: needsTrackSelection || recoveryEligible,
      recoveryEligible,
      migrationClass,
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
    const forceReplace = body.forceReplace === true;

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
    let replaceOldAccountId: string | null = null;
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

    // PARTICULAR already linked → always reuse (cancel/return / double-click safe).
    if (
      accountId &&
      track === 'PARTICULAR' &&
      existingTrack === 'PARTICULAR'
    ) {
      // continue to Account Link
    } else if (accountId && dualTrack) {
      const decision = await evaluateConnectAccountReplacement({
        existingAccountId: accountId,
        requestedTrack: track!,
        existingTrack,
        userId: user.id,
      });

      if (decision.allowed && decision.reason === 'SAME_TRACK_REUSE') {
        // keep
      } else if (decision.reason === 'NO_EXISTING_ACCOUNT') {
        accountId = null;
      } else if (
        decision.allowed &&
        decision.reason === 'EMPTY_INCOMPLETE_STUCK_EXPRESS'
      ) {
        if (track === 'PARTICULAR' && forceReplace) {
          // Recovery: if a previous migrate already created a new account for this old id
          const prior = await findMigrationByOldOrNewAccount(accountId);
          if (
            prior &&
            prior.userId === user.id &&
            prior.newStripeAccountId &&
            prior.oldStripeAccountId === accountId
          ) {
            accountId = prior.newStripeAccountId;
            replaceOldAccountId = prior.oldStripeAccountId;
            await prisma.user.update({
              where: { id: user.id },
              data: {
                stripeConnectAccountId: accountId,
                stripeConnectTrack: 'PARTICULAR',
                stripeConnectOnboardingCompleted: false,
              },
            });
          } else {
            replaceOldAccountId = accountId;
            accountId = null;
          }
        } else if (track === 'PARTICULAR' && !forceReplace) {
          return NextResponse.json(
            {
              error: 'CONNECT_REPLACE_NEEDS_CONFIRMATION',
              errorKey: 'stripe.connect.replaceNeedsConfirmation',
              reason: 'FORCE_REPLACE_REQUIRED',
              recoveryEligible: true,
              needsTrackSelection: true,
              message:
                'Bevestig dat je HomeCheff als particulier gebruikt om je betaalprofiel opnieuw in te stellen.',
            },
            { status: 409 },
          );
        }
      } else if (!decision.allowed) {
        if (track === 'BUSINESS' && accountId) {
          // keep Express
        } else if (requestedTrack && requestedTrack !== existingTrack) {
          return NextResponse.json(
            {
              error: 'CONNECT_REPLACE_BLOCKED',
              errorKey: 'stripe.connect.replaceBlocked',
              reason: decision.reason,
              safetyBlocker: decision.safetyBlocker,
              classification:
                'classification' in decision
                  ? decision.classification
                  : undefined,
              message:
                decision.reason === 'HAS_BALANCE' ||
                decision.reason === 'HAS_PENDING_PAYOUTS' ||
                decision.reason === 'HAS_HC_SETTLEMENT_EXPOSURE' ||
                decision.reason === 'HAS_OPEN_DISPUTE'
                  ? 'Je huidige Stripe-profiel kan nu niet veilig worden vervangen. Neem contact op met support.'
                  : 'Je bestaande Stripe-profiel kan niet automatisch worden vervangen. Neem contact op met support of rond het huidige profiel af.',
            },
            { status: 409 },
          );
        }
      }
    }

    if (!accountId) {
      try {
        console.log('🔍 Creating Stripe Connect account', {
          track,
          mode: isTestMode ? 'TEST' : 'LIVE',
          replacing: replaceOldAccountId,
        });
        const idempotencyKey = replaceOldAccountId
          ? `connect-replace-particular:${user.id}:${replaceOldAccountId}`
          : `hc-connect-create-${user.id}-${track}`;
        const connectAccount = await createConnectAccount(
          user.email!,
          'NL',
          dualTrack ? track! : 'express',
          { idempotencyKey },
        );
        accountId = connectAccount.id;

        await prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: user.id },
            data: {
              stripeConnectAccountId: accountId,
              stripeConnectTrack: track,
              stripeConnectOnboardingCompleted: false,
            },
          });
          if (replaceOldAccountId) {
            await tx.auditLog.create({
              data: {
                id: randomUUID(),
                userId: user.id,
                action: STRIPE_CONNECT_MIGRATE_AUDIT,
                meta: {
                  oldStripeAccountId: replaceOldAccountId,
                  newStripeAccountId: accountId,
                  reason: 'USER_CONFIRMED_PARTICULAR_REPLACE',
                  trackBefore: existingTrack,
                  trackAfter: 'PARTICULAR',
                  actor: 'user',
                  status: 'AWAITING_ONBOARDING',
                  timestamp: new Date().toISOString(),
                },
              },
            });
          } else if (requestedTrack) {
            await tx.auditLog.create({
              data: {
                id: randomUUID(),
                userId: user.id,
                action: STRIPE_CONNECT_TRACK_CHOICE_AUDIT,
                meta: {
                  track: requestedTrack,
                  stripeAccountId: accountId,
                  actor: 'user',
                  timestamp: new Date().toISOString(),
                },
              },
            });
          }
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
        } else if (
          error.message?.includes('rate_limit') ||
          error.code === 'rate_limit'
        ) {
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
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: { stripeConnectTrack: track },
        });
        await tx.auditLog.create({
          data: {
            id: randomUUID(),
            userId: user.id,
            action: STRIPE_CONNECT_TRACK_CHOICE_AUDIT,
            meta: {
              trackBefore: existingTrack,
              trackAfter: track,
              stripeAccountId: accountId,
              actor: 'user',
              reusedExistingAccount: true,
              timestamp: new Date().toISOString(),
            },
          },
        });
      });
    } else if (track && !existingTrack) {
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: { stripeConnectTrack: track },
        });
        await tx.auditLog.create({
          data: {
            id: randomUUID(),
            userId: user.id,
            action: STRIPE_CONNECT_TRACK_CHOICE_AUDIT,
            meta: {
              track,
              stripeAccountId: accountId,
              actor: 'user',
              timestamp: new Date().toISOString(),
            },
          },
        });
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
      migratedFrom: replaceOldAccountId,
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
