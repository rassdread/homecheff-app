/**
 * Shared HomeCheff Stripe Connect UI status.
 * Source of truth: live Stripe Connect account for the authenticated user's
 * stored stripeConnectAccountId — never client redirect flags alone.
 *
 * PAYMENT_READY rule (unchanged for soft gates / payouts):
 *   charges_enabled === true && payouts_enabled === true
 */

import type Stripe from 'stripe';

export type HomecheffConnectUiStatus =
  | 'NOT_STARTED'
  | 'INCOMPLETE'
  | 'PENDING_VERIFICATION'
  | 'ACTION_REQUIRED'
  | 'PAYMENT_READY'
  | 'RESTRICTED';

export type ConnectAccountStatusSnapshot = {
  uiStatus: HomecheffConnectUiStatus;
  /** True only when charges_enabled && payouts_enabled */
  paymentReady: boolean;
  hasAccount: boolean;
  accountId: string | null;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  currentlyDueCount: number;
  pastDueCount: number;
  pendingVerificationCount: number;
  eventuallyDueCount: number;
  disabledReason: string | null;
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
  hasAccount: false,
  accountId: null,
  detailsSubmitted: false,
  chargesEnabled: false,
  payoutsEnabled: false,
  currentlyDueCount: 0,
  pastDueCount: 0,
  pendingVerificationCount: 0,
  eventuallyDueCount: 0,
  disabledReason: null,
  onboardingCompleted: false,
};

export function isHomecheffPaymentReady(flags: {
  chargesEnabled?: boolean | null;
  payoutsEnabled?: boolean | null;
}): boolean {
  return Boolean(flags.chargesEnabled) && Boolean(flags.payoutsEnabled);
}

/**
 * Derive UI status from a live Stripe Account object.
 */
export function deriveConnectAccountStatusFromStripe(
  account: Stripe.Account | null | undefined,
): ConnectAccountStatusSnapshot {
  if (!account?.id) {
    return { ...EMPTY };
  }

  const requirements = account.requirements;
  const currentlyDue = requirements?.currently_due?.length ?? 0;
  const pastDue = requirements?.past_due?.length ?? 0;
  const pendingVerification = requirements?.pending_verification?.length ?? 0;
  const eventuallyDue = requirements?.eventually_due?.length ?? 0;
  const disabledReason = requirements?.disabled_reason ?? null;
  const detailsSubmitted = Boolean(account.details_submitted);
  const chargesEnabled = Boolean(account.charges_enabled);
  const payoutsEnabled = Boolean(account.payouts_enabled);
  const paymentReady = isHomecheffPaymentReady({ chargesEnabled, payoutsEnabled });

  let uiStatus: HomecheffConnectUiStatus;

  if (disabledReason && !paymentReady) {
    uiStatus = 'RESTRICTED';
  } else if (paymentReady) {
    uiStatus = 'PAYMENT_READY';
  } else if (currentlyDue > 0 || pastDue > 0) {
    uiStatus = 'ACTION_REQUIRED';
  } else if (
    detailsSubmitted &&
    currentlyDue === 0 &&
    pastDue === 0 &&
    (pendingVerification > 0 || !chargesEnabled || !payoutsEnabled)
  ) {
    // Form finished; Stripe still verifying or enabling capabilities.
    uiStatus = 'PENDING_VERIFICATION';
  } else if (!detailsSubmitted) {
    uiStatus = 'INCOMPLETE';
  } else {
    uiStatus = 'INCOMPLETE';
  }

  return {
    uiStatus,
    paymentReady,
    hasAccount: true,
    accountId: account.id,
    detailsSubmitted,
    chargesEnabled,
    payoutsEnabled,
    currentlyDueCount: currentlyDue,
    pastDueCount: pastDue,
    pendingVerificationCount: pendingVerification,
    eventuallyDueCount: eventuallyDue,
    disabledReason,
    onboardingCompleted: paymentReady,
  };
}

/**
 * Fallback when only DB flags are available (no live Stripe retrieve).
 * Never invents PENDING without live requirements data.
 */
export function deriveConnectAccountStatusFromDb(flags: {
  stripeConnectAccountId?: string | null;
  stripeConnectOnboardingCompleted?: boolean | null;
}): ConnectAccountStatusSnapshot {
  const accountId = flags.stripeConnectAccountId ?? null;
  if (!accountId) {
    return { ...EMPTY };
  }
  if (flags.stripeConnectOnboardingCompleted) {
    return {
      ...EMPTY,
      uiStatus: 'PAYMENT_READY',
      paymentReady: true,
      hasAccount: true,
      accountId,
      detailsSubmitted: true,
      chargesEnabled: true,
      payoutsEnabled: true,
      onboardingCompleted: true,
    };
  }
  return {
    ...EMPTY,
    uiStatus: 'INCOMPLETE',
    hasAccount: true,
    accountId,
    onboardingCompleted: false,
  };
}

export function connectCtaModelForStatus(
  status: HomecheffConnectUiStatus,
): ConnectCtaModel {
  switch (status) {
    case 'NOT_STARTED':
      return {
        kind: 'setup',
        showOnboardingCta: true,
        titleNl: 'Betaalaccount instellen',
        bodyNl:
          'Koppel je betaalaccount om via HomeCheff betalingen te kunnen ontvangen.',
        ctaLabelNl: 'Betaalaccount instellen',
      };
    case 'INCOMPLETE':
      return {
        kind: 'complete',
        showOnboardingCta: true,
        titleNl: 'Betaalaccount afronden',
        bodyNl: 'Je bent al begonnen. Rond je betaalaccount af om betalingen te ontvangen.',
        ctaLabelNl: 'Betaalaccount afronden',
      };
    case 'PENDING_VERIFICATION':
      return {
        kind: 'status_only',
        showOnboardingCta: false,
        titleNl: 'Verificatie loopt',
        bodyNl:
          'Je gegevens zijn ontvangen. Stripe controleert je betaalaccount. Je hoeft nu niets opnieuw in te vullen.',
        ctaLabelNl: null,
      };
    case 'ACTION_REQUIRED':
      return {
        kind: 'action_required',
        showOnboardingCta: true,
        titleNl: 'Actie nodig voor je betaalaccount',
        bodyNl:
          'Stripe heeft nog extra gegevens nodig. Open je betaalaccount om verder te gaan.',
        ctaLabelNl: 'Actie nodig voor je betaalaccount',
      };
    case 'RESTRICTED':
      return {
        kind: 'action_required',
        showOnboardingCta: true,
        titleNl: 'Betaalaccount beperkt',
        bodyNl:
          'Je betaalaccount is beperkt. Open Stripe om te zien welke actie nodig is.',
        ctaLabelNl: 'Betaalaccount herstellen',
      };
    case 'PAYMENT_READY':
      return {
        kind: 'none',
        showOnboardingCta: false,
        titleNl: 'Betaalaccount actief',
        bodyNl: 'Je kunt betalingen via HomeCheff ontvangen.',
        ctaLabelNl: null,
      };
    default:
      return {
        kind: 'setup',
        showOnboardingCta: true,
        titleNl: 'Betaalaccount instellen',
        bodyNl:
          'Koppel je betaalaccount om via HomeCheff betalingen te kunnen ontvangen.',
        ctaLabelNl: 'Betaalaccount instellen',
      };
  }
}

/** True when sidebar/action-center should emit an onboard action item. */
export function shouldEmitStripeOnboardAction(
  status: HomecheffConnectUiStatus,
): boolean {
  return (
    status === 'NOT_STARTED' ||
    status === 'INCOMPLETE' ||
    status === 'ACTION_REQUIRED' ||
    status === 'RESTRICTED'
  );
}
