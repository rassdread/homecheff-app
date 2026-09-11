/**
 * Shared HomeCheff Stripe Connect status normalizer.
 *
 * Stripe live retrieve is Source of Truth for verification state.
 * HomeCheff DB caches derived readiness only.
 *
 * PAYMENT_READY:
 * - BUSINESS / legacy Express: charges_enabled && payouts_enabled
 * - PARTICULAR (dashboard=none / transfers-only): payouts_enabled && transfers=active
 *   (charges_enabled / card_payments may stay false and must NOT gate)
 *
 * Onboarding CTA ≠ payment ready.
 * pending_verification (incl. disabled_reason=requirements.pending_verification)
 * must NEVER auto-open Account Links.
 */

import type Stripe from 'stripe';
import {
  isHomecheffPaymentReady as isReadyFromTrackFlags,
  type ConnectTrack,
} from '@/lib/stripe/connect-tracks';

export type HomecheffConnectUiStatus =
  | 'NOT_STARTED'
  | 'INCOMPLETE'
  | 'PENDING_VERIFICATION'
  | 'ACTION_REQUIRED'
  | 'PAYMENT_READY'
  | 'RESTRICTED';

export type ConnectMissingCategory =
  | 'identity'
  | 'address'
  | 'bank'
  | 'additional';

export type ConnectAccountStatusSnapshot = {
  uiStatus: HomecheffConnectUiStatus;
  /** Track-aware HomeCheff payment readiness */
  paymentReady: boolean;
  /** Alias for paymentReady (SCT payout destination ready). */
  payoutReady: boolean;
  hasAccount: boolean;
  accountId: string | null;
  connectTrack: ConnectTrack | null;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  transfersCapability: string | null;
  cardPaymentsCapability: string | null;
  currentlyDueCount: number;
  pastDueCount: number;
  pendingVerificationCount: number;
  eventuallyDueCount: number;
  currentlyDue: string[];
  pastDue: string[];
  pendingVerificationKeys: string[];
  disabledReason: string | null;
  missingCategories: ConnectMissingCategory[];
  /** Only true when an Account Link is appropriate. */
  canCreateOnboardingLink: boolean;
  actionRequired: boolean;
  isPendingVerification: boolean;
  /** DB sync: stripeConnectOnboardingCompleted */
  onboardingCompleted: boolean;
};

export type ConnectCtaKind =
  | 'none'
  | 'setup'
  | 'complete'
  | 'action_required'
  | 'status_only';

export type ConnectCtaModel = {
  kind: ConnectCtaKind;
  /** Show start/complete/action Stripe onboard button */
  showOnboardingCta: boolean;
  titleNl: string;
  bodyNl: string;
  ctaLabelNl: string | null;
};

const EMPTY: ConnectAccountStatusSnapshot = {
  uiStatus: 'NOT_STARTED',
  paymentReady: false,
  payoutReady: false,
  hasAccount: false,
  accountId: null,
  connectTrack: null,
  detailsSubmitted: false,
  chargesEnabled: false,
  payoutsEnabled: false,
  transfersCapability: null,
  cardPaymentsCapability: null,
  currentlyDueCount: 0,
  pastDueCount: 0,
  pendingVerificationCount: 0,
  eventuallyDueCount: 0,
  currentlyDue: [],
  pastDue: [],
  pendingVerificationKeys: [],
  disabledReason: null,
  missingCategories: [],
  canCreateOnboardingLink: true,
  actionRequired: false,
  isPendingVerification: false,
  onboardingCompleted: false,
};

const PENDING_DISABLED_REASONS = new Set([
  'requirements.pending_verification',
  'pending_verification',
]);

export function isHomecheffPaymentReady(flags: {
  chargesEnabled?: boolean | null;
  payoutsEnabled?: boolean | null;
  transfersCapability?: string | null;
  disabledReason?: string | null;
  connectTrack?: ConnectTrack | null;
  accountType?: string | null;
  dashboardType?: string | null;
}): boolean {
  return isReadyFromTrackFlags(flags);
}

function isParticularShape(options?: {
  connectTrack?: ConnectTrack | null;
  accountType?: string | null;
  dashboardType?: string | null;
}): boolean {
  return (
    options?.connectTrack === 'PARTICULAR' ||
    options?.dashboardType === 'none' ||
    (options?.accountType === 'custom' && options?.dashboardType !== 'express')
  );
}

/** Map raw Stripe requirement keys → human categories (no raw property names in UI). */
export function categorizeStripeRequirements(
  keys: string[],
): ConnectMissingCategory[] {
  const cats = new Set<ConnectMissingCategory>();
  for (const key of keys) {
    const k = key.toLowerCase();
    if (
      k.includes('external_account') ||
      k.includes('bank_account') ||
      k.includes('externalaccount')
    ) {
      cats.add('bank');
    } else if (
      k.includes('address') ||
      k.includes('postal_code') ||
      k.includes('city') ||
      k.includes('line1')
    ) {
      cats.add('address');
    } else if (
      k.includes('verification') ||
      k.includes('id_number') ||
      k.includes('ssn') ||
      k.includes('document') ||
      k.includes('dob') ||
      k.includes('first_name') ||
      k.includes('last_name') ||
      k.includes('individual') ||
      k.includes('person')
    ) {
      cats.add('identity');
    } else {
      cats.add('additional');
    }
  }
  return Array.from(cats);
}

export function missingCategoriesLabelNl(
  categories: ConnectMissingCategory[],
): string {
  if (categories.length === 0) return '';
  const labels: Record<ConnectMissingCategory, string> = {
    identity: 'identiteit',
    address: 'adres',
    bank: 'bankrekening',
    additional: 'aanvullende Stripe-verificatie',
  };
  return categories.map((c) => labels[c]).join(', ');
}

/**
 * Account Link is allowed only when the user can still take actionable steps.
 * Never when pending verification, ready, or restricted without due items.
 */
export function canCreateConnectOnboardingLink(
  snapshot: Pick<
    ConnectAccountStatusSnapshot,
    | 'uiStatus'
    | 'currentlyDueCount'
    | 'pastDueCount'
    | 'detailsSubmitted'
    | 'hasAccount'
    | 'paymentReady'
  >,
): boolean {
  if (snapshot.paymentReady) return false;
  if (snapshot.uiStatus === 'PENDING_VERIFICATION') return false;
  if (snapshot.uiStatus === 'PAYMENT_READY') return false;
  if (!snapshot.hasAccount) return true;
  if (snapshot.currentlyDueCount > 0 || snapshot.pastDueCount > 0) return true;
  if (!snapshot.detailsSubmitted) return true;
  return false;
}

/**
 * Derive UI status from a live Stripe Account object.
 */
export function deriveConnectAccountStatusFromStripe(
  account: Stripe.Account | null | undefined,
  options?: { connectTrack?: ConnectTrack | null },
): ConnectAccountStatusSnapshot {
  if (!account?.id) {
    return { ...EMPTY };
  }

  const requirements = account.requirements;
  const currentlyDue = [...(requirements?.currently_due ?? [])];
  const pastDue = [...(requirements?.past_due ?? [])];
  const pendingVerificationKeys = [
    ...(requirements?.pending_verification ?? []),
  ];
  const eventuallyDue = [...(requirements?.eventually_due ?? [])];
  const disabledReason = requirements?.disabled_reason ?? null;
  const detailsSubmitted = Boolean(account.details_submitted);
  const chargesEnabled = Boolean(account.charges_enabled);
  const payoutsEnabled = Boolean(account.payouts_enabled);
  const transfersCapability =
    (account.capabilities?.transfers as string | undefined) ?? null;
  const cardPaymentsCapability =
    (account.capabilities?.card_payments as string | undefined) ?? null;
  const dashboardType =
    (account as { controller?: { stripe_dashboard?: { type?: string | null } } })
      .controller?.stripe_dashboard?.type ?? null;
  const connectTrack = options?.connectTrack ?? null;
  const particular = isParticularShape({
    connectTrack,
    accountType: account.type ?? null,
    dashboardType,
  });

  const paymentReady = isHomecheffPaymentReady({
    chargesEnabled,
    payoutsEnabled,
    transfersCapability,
    disabledReason,
    connectTrack,
    accountType: account.type ?? null,
    dashboardType,
  });

  const currentlyDueCount = currentlyDue.length;
  const pastDueCount = pastDue.length;
  const pendingVerificationCount = pendingVerificationKeys.length;
  const disabledIsPendingOnly =
    Boolean(disabledReason) &&
    PENDING_DISABLED_REASONS.has(disabledReason!) &&
    currentlyDueCount === 0 &&
    pastDueCount === 0;

  let uiStatus: HomecheffConnectUiStatus;

  if (paymentReady) {
    uiStatus = 'PAYMENT_READY';
  } else if (currentlyDueCount > 0 || pastDueCount > 0) {
    uiStatus = 'ACTION_REQUIRED';
  } else if (
    detailsSubmitted &&
    (pendingVerificationCount > 0 ||
      disabledIsPendingOnly ||
      (particular
        ? transfersCapability !== 'active' || !payoutsEnabled
        : !chargesEnabled || !payoutsEnabled))
  ) {
    uiStatus = 'PENDING_VERIFICATION';
  } else if (disabledReason && !paymentReady) {
    uiStatus = 'RESTRICTED';
  } else if (!detailsSubmitted) {
    uiStatus = 'INCOMPLETE';
  } else {
    uiStatus = 'INCOMPLETE';
  }

  const missingCategories = categorizeStripeRequirements([
    ...currentlyDue,
    ...pastDue,
  ]);

  const snapshot: ConnectAccountStatusSnapshot = {
    uiStatus,
    paymentReady,
    payoutReady: paymentReady,
    hasAccount: true,
    accountId: account.id,
    connectTrack,
    detailsSubmitted,
    chargesEnabled,
    payoutsEnabled,
    transfersCapability,
    cardPaymentsCapability,
    currentlyDueCount,
    pastDueCount,
    pendingVerificationCount,
    eventuallyDueCount: eventuallyDue.length,
    currentlyDue,
    pastDue,
    pendingVerificationKeys,
    disabledReason,
    missingCategories,
    canCreateOnboardingLink: false,
    actionRequired: uiStatus === 'ACTION_REQUIRED' || uiStatus === 'RESTRICTED',
    isPendingVerification: uiStatus === 'PENDING_VERIFICATION',
    onboardingCompleted: paymentReady,
  };

  snapshot.canCreateOnboardingLink = canCreateConnectOnboardingLink(snapshot);
  return snapshot;
}

/**
 * Canonical normalizer used by onboard, return, refresh, webhooks, checkout.
 */
export function normalizeStripeConnectStatus(
  account: Stripe.Account | null | undefined,
  track?: ConnectTrack | null,
): ConnectAccountStatusSnapshot {
  return deriveConnectAccountStatusFromStripe(account, {
    connectTrack: track ?? null,
  });
}

/**
 * Fallback when only DB flags are available (no live Stripe retrieve).
 * Never invents PENDING without live requirements data.
 */
export function deriveConnectAccountStatusFromDb(flags: {
  stripeConnectAccountId?: string | null;
  stripeConnectOnboardingCompleted?: boolean | null;
  stripeConnectTrack?: ConnectTrack | null;
}): ConnectAccountStatusSnapshot {
  const accountId = flags.stripeConnectAccountId ?? null;
  if (!accountId) {
    return { ...EMPTY, canCreateOnboardingLink: true };
  }
  if (flags.stripeConnectOnboardingCompleted) {
    return {
      ...EMPTY,
      uiStatus: 'PAYMENT_READY',
      paymentReady: true,
      payoutReady: true,
      hasAccount: true,
      accountId,
      connectTrack: flags.stripeConnectTrack ?? null,
      detailsSubmitted: true,
      chargesEnabled: true,
      payoutsEnabled: true,
      onboardingCompleted: true,
      canCreateOnboardingLink: false,
    };
  }
  return {
    ...EMPTY,
    uiStatus: 'INCOMPLETE',
    hasAccount: true,
    accountId,
    connectTrack: flags.stripeConnectTrack ?? null,
    onboardingCompleted: false,
    canCreateOnboardingLink: true,
  };
}

export function connectCtaModelForStatus(
  status: HomecheffConnectUiStatus,
  options?: { missingCategories?: ConnectMissingCategory[] },
): ConnectCtaModel {
  const missing = options?.missingCategories ?? [];
  const missingLabel = missingCategoriesLabelNl(missing);

  switch (status) {
    case 'NOT_STARTED':
      return {
        kind: 'setup',
        showOnboardingCta: true,
        titleNl: 'Betaalaccount instellen',
        bodyNl:
          'Verifieer je identiteit en bankrekening om betalingen via HomeCheff te kunnen ontvangen.',
        ctaLabelNl: 'Betaalaccount instellen',
      };
    case 'INCOMPLETE':
      return {
        kind: 'complete',
        showOnboardingCta: true,
        titleNl: 'Betaalaccount nog niet compleet',
        bodyNl: missingLabel
          ? `Nog nodig: ${missingLabel}. Rond je gegevens af om betalingen te ontvangen.`
          : 'Je bent al begonnen. Rond je betaalaccount af om betalingen te ontvangen.',
        ctaLabelNl: 'Gegevens afronden',
      };
    case 'PENDING_VERIFICATION':
      return {
        kind: 'status_only',
        showOnboardingCta: false,
        titleNl: 'Verificatie wordt gecontroleerd',
        bodyNl:
          'Je gegevens zijn ingestuurd. Stripe controleert ze. Je hoeft ze niet opnieuw in te vullen.',
        ctaLabelNl: null,
      };
    case 'ACTION_REQUIRED':
      return {
        kind: 'action_required',
        showOnboardingCta: true,
        titleNl: 'Betaalaccount nog niet compleet',
        bodyNl: missingLabel
          ? `Stripe heeft nog gegevens nodig (${missingLabel}).`
          : 'Stripe heeft nog extra gegevens nodig. Open je betaalaccount om verder te gaan.',
        ctaLabelNl: 'Gegevens afronden',
      };
    case 'RESTRICTED':
      return {
        kind: 'action_required',
        showOnboardingCta: true,
        titleNl: 'Stripe heeft aanvullende gegevens nodig',
        bodyNl:
          'Je betaalaccount is beperkt. Open Stripe alleen als er acties openstaan; anders wacht op controle.',
        ctaLabelNl: 'Gegevens afronden',
      };
    case 'PAYMENT_READY':
      return {
        kind: 'none',
        showOnboardingCta: false,
        titleNl: 'Betaalaccount gereed',
        bodyNl: 'Je kunt betalingen ontvangen via HomeCheff.',
        ctaLabelNl: null,
      };
    default:
      return {
        kind: 'setup',
        showOnboardingCta: true,
        titleNl: 'Betaalaccount instellen',
        bodyNl:
          'Verifieer je identiteit en bankrekening om betalingen via HomeCheff te kunnen ontvangen.',
        ctaLabelNl: 'Betaalaccount instellen',
      };
  }
}

/** CTA model that respects Account Link eligibility (SOT). */
export function connectCtaModelForSnapshot(
  snapshot: ConnectAccountStatusSnapshot,
): ConnectCtaModel {
  const base = connectCtaModelForStatus(snapshot.uiStatus, {
    missingCategories: snapshot.missingCategories,
  });
  if (!snapshot.canCreateOnboardingLink) {
    if (snapshot.uiStatus === 'PENDING_VERIFICATION') {
      return connectCtaModelForStatus('PENDING_VERIFICATION');
    }
    if (snapshot.uiStatus === 'PAYMENT_READY') {
      return connectCtaModelForStatus('PAYMENT_READY');
    }
    return {
      kind: 'status_only',
      showOnboardingCta: false,
      titleNl: base.titleNl,
      bodyNl:
        snapshot.uiStatus === 'RESTRICTED'
          ? 'Stripe heeft je account beperkt. Er staan nu geen invulbare stappen open. Vernieuw later of neem contact op met support.'
          : base.bodyNl,
      ctaLabelNl: null,
    };
  }
  return base;
}

/** True when sidebar/action-center should emit an onboard action item. */
export function shouldEmitStripeOnboardAction(
  status: HomecheffConnectUiStatus,
): boolean {
  return (
    status === 'NOT_STARTED' ||
    status === 'INCOMPLETE' ||
    status === 'ACTION_REQUIRED'
  );
}

export function shouldEmitStripeOnboardActionFromSnapshot(
  snapshot: ConnectAccountStatusSnapshot,
): boolean {
  return snapshot.canCreateOnboardingLink;
}
