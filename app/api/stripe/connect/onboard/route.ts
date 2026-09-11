import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createConnectAccount, stripe, matchesCurrentMode, isTestMode } from '@/lib/stripe';
import {
  connectCtaModelForSnapshot,
  connectCtaModelForStatus,
} from '@/lib/stripe/connect-account-status';
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
import { getCurrentStripeConnectAccount } from '@/lib/stripe/current-connect-account';
import { resolveConnectEntryState } from '@/lib/stripe/connect-entry-state';
import {
  getStripeDashboardType,
  validateConnectAccountShape,
} from '@/lib/stripe/connect-account-shape';

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
        configurationMismatch: false,
        entryState: 'CHOOSE_TRACK',
        classification: 'NOT_STARTED',
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

    const entry = resolveConnectEntryState({
      stripeConnectAccountId: user.stripeConnectAccountId,
      stripeConnectTrack: user.stripeConnectTrack,
      stripeConnectOnboardingCompleted: user.stripeConnectOnboardingCompleted,
      stripeAccount: stripeAccount as any,
    });

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
      entry.recoveryEligible ||
      (isDualTrackConnectEnabled() && migrationIsRecoveryMode(migrationClass));
    const needsTrackSelection =
      entry.needsTrackSelection ||
      (isDualTrackConnectEnabled() &&
        migrationNeedsUserConfirmation(migrationClass) &&
        !track) ||
      entry.configurationMismatch;

    // Prefer entry-state CTA for mismatch / choose; otherwise normalized snapshot.
    let cta =
      entry.entryState === 'RECOVER_MISMATCH' ||
      entry.entryState === 'CHOOSE_TRACK' ||
      entry.entryState === 'MANUAL_REVIEW'
        ? {
            kind:
              entry.ctaLabelNl == null
                ? ('status_only' as const)
                : ('setup' as const),
            showOnboardingCta: Boolean(entry.ctaLabelNl),
            titleNl: entry.titleNl,
            bodyNl: entry.bodyNl,
            ctaLabelNl: entry.ctaLabelNl,
          }
        : connectCtaModelForSnapshot(live);

    if (
      !entry.configurationMismatch &&
      track === 'PARTICULAR' &&
      live.canCreateOnboardingLink &&
      !live.paymentReady &&
      live.hasAccount &&
      (live.uiStatus === 'INCOMPLETE' || live.uiStatus === 'ACTION_REQUIRED')
    ) {
      cta = {
        kind: 'complete',
        showOnboardingCta: true,
        titleNl: 'Je verificatie is nog niet afgerond',
        bodyNl:
          'Stripe heeft nog enkele persoonlijke gegevens of je bankrekening nodig. Deze Stripe-verificatieroute vraagt geen KvK-gegevens.',
        ctaLabelNl: 'Gegevens afronden',
      };
    }

    // Mismatch: never allow Account Link on the bad account
    const canCreateOnboardingLink = entry.configurationMismatch
      ? false
      : live.canCreateOnboardingLink && entry.canCreateOnboardingLink;

    return NextResponse.json({
      hasAccount: live.hasAccount,
      isCompleted: live.paymentReady,
      accountId: live.accountId,
      uiStatus: entry.configurationMismatch
        ? live.uiStatus
        : entry.uiStatus || live.uiStatus,
      paymentReady: live.paymentReady,
      payoutReady: live.payoutReady,
      detailsSubmitted: live.detailsSubmitted,
      chargesEnabled: live.chargesEnabled,
      payoutsEnabled: live.payoutsEnabled,
      transfersCapability: live.transfersCapability,
      currentlyDueCount: live.currentlyDueCount,
      pastDueCount: live.pastDueCount,
      pendingVerificationCount: live.pendingVerificationCount,
      missingCategories: live.missingCategories,
      canCreateOnboardingLink,
      disabledReason: live.disabledReason,
      connectTrack: track,
      dualTrackEnabled: isDualTrackConnectEnabled(),
      needsTrackSelection,
      recoveryEligible,
      configurationMismatch: entry.configurationMismatch,
      mismatchReason: entry.mismatchReason,
      entryState: entry.entryState,
      classification: entry.classification,
      migrationClass,
      businessType: stripeAccount
        ? (stripeAccount as { business_type?: string }).business_type ?? null
        : null,
      dashboardType: stripeAccount
        ? getStripeDashboardType(stripeAccount as any)
        : null,
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
    const current = await getCurrentStripeConnectAccount(user.id);

    // Always fresh-retrieve CURRENT account before creating an Account Link.
    // Do NOT trust stale DB stripeConnectOnboardingCompleted alone.
    if (current.stripeConnectAccountId) {
      const live = await loadConnectAccountStatusForUser({
        userId: user.id,
        stripeConnectAccountId: current.stripeConnectAccountId,
        stripeConnectOnboardingCompleted:
          current.stripeConnectOnboardingCompleted,
        stripeConnectTrack: current.stripeConnectTrack,
        forceLive: true,
      });
      if (live.paymentReady) {
        return NextResponse.json({
          success: true,
          message: 'Stripe Connect already set up',
          accountId: current.stripeConnectAccountId,
          uiStatus: live.uiStatus,
          paymentReady: true,
          payoutReady: true,
          canCreateOnboardingLink: false,
          connectTrack: existingTrack || current.stripeConnectTrack,
          cta: connectCtaModelForSnapshot(live),
        });
      }
      // Pending verification / no actionable requirements → status only, no link.
      if (!live.canCreateOnboardingLink) {
        return NextResponse.json({
          success: true,
          message:
            live.uiStatus === 'PENDING_VERIFICATION'
              ? 'Stripe is verifying your details — no onboarding link needed'
              : 'No actionable Stripe requirements — onboarding link not created',
          accountId: current.stripeConnectAccountId,
          uiStatus: live.uiStatus,
          paymentReady: live.paymentReady,
          payoutReady: live.payoutReady,
          canCreateOnboardingLink: false,
          connectTrack: existingTrack || current.stripeConnectTrack,
          cta: connectCtaModelForSnapshot(live),
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

    // PARTICULAR already linked → reuse ONLY when Stripe shape matches.
    // non_profit/company PARTICULAR must go through replacement (forceReplace).
    if (
      accountId &&
      track === 'PARTICULAR' &&
      existingTrack === 'PARTICULAR' &&
      stripe
    ) {
      try {
        const existingAcct = await stripe.accounts.retrieve(accountId);
        const shape = validateConnectAccountShape(existingAcct, 'PARTICULAR');
        if (!shape.ok) {
          if (!forceReplace) {
            return NextResponse.json(
              {
                error: 'PARTICULAR_ACCOUNT_CONFIGURATION_MISMATCH',
                errorKey: 'stripe.connect.particularConfigMismatch',
                reason: shape.reason,
                recoveryEligible: true,
                needsTrackSelection: true,
                configurationMismatch: true,
                businessType: shape.businessType,
                dashboardType: shape.dashboardType,
                message:
                  'Je betaalaccount is ingesteld als een organisatie, terwijl je HomeCheff gebruikt als particulier. Stel je betaalaccount opnieuw in.',
              },
              { status: 409 },
            );
          }
          // forceReplace confirmed → evaluate replacement for this mismatched account
          const decision = await evaluateConnectAccountReplacement({
            existingAccountId: accountId,
            requestedTrack: 'PARTICULAR',
            existingTrack: 'PARTICULAR',
            userId: user.id,
          });
          if (
            decision.allowed &&
            (decision.reason === 'EMPTY_INCOMPLETE_STUCK_EXPRESS' ||
              decision.reason === 'CONFIGURATION_MISMATCH_REPLACE')
          ) {
            const prior = await findMigrationByOldOrNewAccount(accountId);
            if (
              prior &&
              prior.userId === user.id &&
              prior.newStripeAccountId &&
              prior.oldStripeAccountId === accountId
            ) {
              // Idempotent: reuse prior replacement if already created
              const priorAcct = await stripe.accounts.retrieve(
                prior.newStripeAccountId,
              );
              const priorShape = validateConnectAccountShape(
                priorAcct,
                'PARTICULAR',
              );
              if (priorShape.ok) {
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
            } else {
              replaceOldAccountId = accountId;
              accountId = null;
            }
          } else if (!decision.allowed) {
            return NextResponse.json(
              {
                error: 'CONNECT_REPLACE_BLOCKED',
                errorKey: 'stripe.connect.replaceBlocked',
                reason: decision.reason,
                safetyBlocker:
                  'safetyBlocker' in decision
                    ? decision.safetyBlocker
                    : undefined,
                message:
                  'Je huidige Stripe-profiel kan nu niet veilig worden vervangen. Neem contact op met support.',
              },
              { status: 409 },
            );
          }
        }
        // else shape ok → continue to Account Link with same accountId
      } catch (err) {
        console.error('[stripe-onboard] PARTICULAR shape check failed', err);
        return NextResponse.json(
          {
            error: 'CONNECT_CONFIGURATION_MISMATCH',
            message:
              'Kon je Stripe-account niet valideren. Probeer het later opnieuw.',
          },
          { status: 500 },
        );
      }
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
        (decision.reason === 'EMPTY_INCOMPLETE_STUCK_EXPRESS' ||
          decision.reason === 'CONFIGURATION_MISMATCH_REPLACE')
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

        // Immediate post-create shape validation — STOP if Stripe returns wrong config.
        if (track === 'PARTICULAR' || track === 'BUSINESS') {
          const createdShape = validateConnectAccountShape(
            connectAccount,
            track!,
          );
          if (!createdShape.ok) {
            console.error('[stripe-onboard] CONNECT_CONFIGURATION_MISMATCH after create', {
              accountId: connectAccount.id,
              track,
              businessType: createdShape.businessType,
              dashboardType: createdShape.dashboardType,
            });
            return NextResponse.json(
              {
                error: 'CONNECT_CONFIGURATION_MISMATCH',
                errorKey: 'stripe.connect.configurationMismatch',
                mismatchCode: createdShape.mismatchCode,
                reason: createdShape.reason,
                businessType: createdShape.businessType,
                dashboardType: createdShape.dashboardType,
                accountId: connectAccount.id,
                message:
                  'Stripe-account is niet correct geconfigureerd. Onboarding gestopt. Neem contact op met support.',
              },
              { status: 500 },
            );
          }
        }

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

    // Fresh retrieve + shape validation BEFORE any Account Link.
    // PARTICULAR must be individual + dashboard=none or we STOP.
    try {
      const fresh = await stripe.accounts.retrieve(accountId);
      if (track === 'PARTICULAR' || track === 'BUSINESS') {
        const shape = validateConnectAccountShape(fresh, track);
        if (!shape.ok) {
          console.error('[stripe-onboard] CONNECT_CONFIGURATION_MISMATCH', {
            userId: user.id,
            accountId,
            track,
            businessType: shape.businessType,
            dashboardType: shape.dashboardType,
            reason: shape.reason,
          });
          return NextResponse.json(
            {
              error: 'CONNECT_CONFIGURATION_MISMATCH',
              errorKey: 'stripe.connect.configurationMismatch',
              mismatchCode: shape.mismatchCode,
              reason: shape.reason,
              businessType: shape.businessType,
              dashboardType: shape.dashboardType,
              accountId,
              message:
                track === 'PARTICULAR'
                  ? 'Stripe-accountconfiguratie komt niet overeen met de particuliere route. Onboarding gestopt.'
                  : 'Stripe-accountconfiguratie komt niet overeen met de zakelijke route. Onboarding gestopt.',
            },
            { status: 500 },
          );
        }
      }
    } catch (validateErr) {
      console.error('[stripe-onboard] pre-link validate failed', validateErr);
      return NextResponse.json(
        {
          error: 'CONNECT_CONFIGURATION_MISMATCH',
          message: 'Kon Stripe-account niet valideren vóór onboarding.',
        },
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
      canCreateOnboardingLink: true,
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
