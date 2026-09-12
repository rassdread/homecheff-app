/**
 * Canonical account readiness facade (SoT aggregator).
 *
 * Does NOT invent Stripe or delivery rules — delegates to:
 * - Stripe: connectUiStatus / loadConnectAccountStatusForUser
 * - Delivery: evaluateDeliveryProfileCompletion
 * - Account: getAccountRequirements
 *
 * Stripe readiness and delivery readiness are independent.
 */

import type { HomecheffConnectUiStatus } from '@/lib/stripe/connect-account-status';
import {
  connectCtaModelForStatus,
  shouldEmitStripeOnboardAction,
} from '@/lib/stripe/connect-account-status';
import type { ConnectAccountStatusSnapshot } from '@/lib/stripe/connect-account-status';
import {
  evaluateDeliveryProfileCompletion,
  type DeliveryProfileCompletionInput,
} from '@/lib/delivery/delivery-profile-completion';
import {
  getAccountRequirements,
  type AccountRequirementsUserInput,
} from '@/lib/account-requirements';

export type AccountReadinessLaneState =
  | 'READY'
  | 'ACTION_REQUIRED'
  | 'WAITING_FOR_STRIPE'
  | 'CHOICE_REQUIRED'
  | 'CONFIGURATION_MISMATCH'
  | 'NOT_APPLICABLE'
  | 'LEGACY';

export type AccountReadinessLane = {
  state: AccountReadinessLaneState;
  titleNl: string | null;
  bodyNl: string | null;
  ctaLabelNl: string | null;
  ctaHref: string | null;
  /** True when UI may show an action-required warning for this lane. */
  showActionWarning: boolean;
};

export type AccountReadinessResult = {
  account: AccountReadinessLane;
  stripe: AccountReadinessLane;
  delivery: AccountReadinessLane;
  /** Aggregate: true when no lane needs user action (waiting OK). */
  healthy: boolean;
};

const SETTINGS_PAYMENTS = '/settings?tab=payments';
const DELIVERY_SETTINGS = '/delivery/settings';
const PROFILE = '/profile';

export function mapStripeSnapshotToLane(
  snapshot: Pick<
    ConnectAccountStatusSnapshot,
    | 'uiStatus'
    | 'paymentReady'
    | 'hasAccount'
    | 'canCreateOnboardingLink'
    | 'missingCategories'
  > | null,
  options?: { configurationMismatch?: boolean; choiceRequired?: boolean },
): AccountReadinessLane {
  if (options?.configurationMismatch) {
    return {
      state: 'CONFIGURATION_MISMATCH',
      titleNl: 'Betaalaccount-configuratie klopt niet',
      bodyNl:
        'Je betaalaccount staat op een andere route. Kies opnieuw Particulier of Bedrijf.',
      ctaLabelNl: 'Keuze herstellen',
      ctaHref: SETTINGS_PAYMENTS,
      showActionWarning: true,
    };
  }

  if (options?.choiceRequired || !snapshot?.hasAccount) {
    return {
      state: 'CHOICE_REQUIRED',
      titleNl: 'Betaalaccount instellen',
      bodyNl:
        'Kies Particulier of Bedrijf om betalingen via HomeCheff te ontvangen.',
      ctaLabelNl: 'Betaalaccount instellen',
      ctaHref: SETTINGS_PAYMENTS,
      showActionWarning: true,
    };
  }

  if (snapshot.paymentReady || snapshot.uiStatus === 'PAYMENT_READY') {
    return {
      state: 'READY',
      titleNl: null,
      bodyNl: null,
      ctaLabelNl: null,
      ctaHref: null,
      showActionWarning: false,
    };
  }

  if (snapshot.uiStatus === 'PENDING_VERIFICATION') {
    const model = connectCtaModelForStatus('PENDING_VERIFICATION');
    return {
      state: 'WAITING_FOR_STRIPE',
      titleNl: model.titleNl,
      bodyNl: model.bodyNl,
      ctaLabelNl: null, // never "Gegevens afronden"
      ctaHref: SETTINGS_PAYMENTS,
      showActionWarning: false,
    };
  }

  const model = connectCtaModelForStatus(snapshot.uiStatus, {
    missingCategories: snapshot.missingCategories,
  });
  const needsAction =
    shouldEmitStripeOnboardAction(snapshot.uiStatus) &&
    snapshot.canCreateOnboardingLink;

  return {
    state: 'ACTION_REQUIRED',
    titleNl: model.titleNl,
    bodyNl: model.bodyNl,
    ctaLabelNl: needsAction ? model.ctaLabelNl : null,
    ctaHref: SETTINGS_PAYMENTS,
    showActionWarning: needsAction,
  };
}

export function mapDeliveryProfileToLane(
  profile: DeliveryProfileCompletionInput | null | undefined,
): AccountReadinessLane {
  if (!profile) {
    return {
      state: 'NOT_APPLICABLE',
      titleNl: null,
      bodyNl: null,
      ctaLabelNl: null,
      ctaHref: null,
      showActionWarning: false,
    };
  }

  const completion = evaluateDeliveryProfileCompletion(profile);
  if (completion.isComplete) {
    return {
      state: 'READY',
      titleNl: null,
      bodyNl: null,
      ctaLabelNl: null,
      ctaHref: null,
      showActionWarning: false,
    };
  }

  const missing = completion.ok ? [] : completion.missing;
  let titleNl = 'Je bezorgprofiel is nog niet compleet.';
  let bodyNl = completion.ok
    ? 'Vul werkgebied en tarieven in.'
    : completion.message;
  let ctaLabelNl = 'Bezorgprofiel afronden';

  if (missing.length === 1 && missing[0] === 'pricing') {
    titleNl = 'Bezorgtarief nog niet actief';
    bodyNl =
      profile.pricingEnabled === false
        ? 'Zet “Prijzen actief” aan en vul je bezorgtarief in.'
        : 'Activeer en vul je bezorgtarief in.';
    ctaLabelNl = 'Bezorgtarief instellen';
  } else if (missing.length === 1 && missing[0] === 'serviceArea') {
    titleNl = 'Werkgebied ontbreekt';
    bodyNl = 'Stel je werkgebied in (locatie + straal).';
    ctaLabelNl = 'Werkgebied instellen';
  } else if (missing.includes('companyDisplayName')) {
    titleNl = 'Bedrijfsnaam ontbreekt';
    bodyNl = 'Vul een bedrijfsnaam in voor je bezorgprofiel.';
    ctaLabelNl = 'Profiel afronden';
  }

  return {
    state: 'ACTION_REQUIRED',
    titleNl,
    bodyNl,
    ctaLabelNl,
    ctaHref: DELIVERY_SETTINGS,
    showActionWarning: true,
  };
}

export function mapAccountBasicsToLane(
  user: AccountRequirementsUserInput,
): AccountReadinessLane {
  const req = getAccountRequirements(user);
  if (req.missing.length === 0) {
    return {
      state: 'READY',
      titleNl: null,
      bodyNl: null,
      ctaLabelNl: null,
      ctaHref: null,
      showActionWarning: false,
    };
  }
  return {
    state: 'ACTION_REQUIRED',
    titleNl: 'Je account is nog niet compleet.',
    bodyNl: 'Voltooi je account om HomeCheff volledig te gebruiken.',
    ctaLabelNl: 'Account afronden',
    ctaHref: req.missing[0]?.actionHref ?? PROFILE,
    showActionWarning: true,
  };
}

/**
 * Compose lanes. Pass stripeSnapshot from live load when available.
 * Pass deliveryProfile only when the user has a DeliveryProfile row.
 */
export function resolveAccountReadiness(input: {
  user: AccountRequirementsUserInput;
  stripeSnapshot?: ConnectAccountStatusSnapshot | null;
  deliveryProfile?: DeliveryProfileCompletionInput | null;
  hasDeliveryProfile?: boolean;
  configurationMismatch?: boolean;
  choiceRequired?: boolean;
}): AccountReadinessResult {
  const account = mapAccountBasicsToLane(input.user);
  const stripe = mapStripeSnapshotToLane(input.stripeSnapshot ?? null, {
    configurationMismatch: input.configurationMismatch,
    choiceRequired:
      input.choiceRequired ||
      (!input.stripeSnapshot?.hasAccount &&
        input.stripeSnapshot?.uiStatus === 'NOT_STARTED'),
  });

  const delivery =
    input.hasDeliveryProfile === false
      ? mapDeliveryProfileToLane(null)
      : mapDeliveryProfileToLane(input.deliveryProfile ?? null);

  const healthy =
    !account.showActionWarning &&
    !stripe.showActionWarning &&
    !delivery.showActionWarning;

  return { account, stripe, delivery, healthy };
}

export function stripeUiStatusNeedsOnboardCta(
  uiStatus: HomecheffConnectUiStatus,
): boolean {
  return shouldEmitStripeOnboardAction(uiStatus);
}
