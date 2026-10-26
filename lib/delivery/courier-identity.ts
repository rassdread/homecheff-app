/**
 * Stripe Connect identity evidence HomeCheff can read without storing documents.
 *
 * VERIFIED means account.individual.verification.status is exactly "verified".
 * It does not mean HomeCheff saw a passport or identity card.
 * payouts_enabled, charges_enabled, details_submitted, and an empty
 * requirements list are not identity verification.
 */

export type CourierVerificationState =
  | 'NOT_STARTED'
  | 'PENDING'
  | 'VERIFIED'
  | 'RESTRICTED'
  | 'FAILED'
  | 'UNKNOWN';

export type CourierStripeAccount = {
  id?: string | null;
  business_type?: string | null;
  charges_enabled?: boolean | null;
  payouts_enabled?: boolean | null;
  details_submitted?: boolean | null;
  requirements?: {
    disabled_reason?: string | null;
    currently_due?: string[] | null;
  } | null;
  future_requirements?: {
    disabled_reason?: string | null;
  } | null;
  individual?: {
    verification?: {
      status?: string | null;
      details_code?: string | null;
    } | null;
  } | null;
};

export type CourierIdentityClassification = {
  state: CourierVerificationState;
  reason: string;
  paidDeliveryAllowed: boolean;
  stripeReportsIdentityVerified: boolean;
  explicitDocumentVerified: false;
  governmentDocumentStoredByHomeCheff: false;
};

const FAILURE_CODE = /^(failed_|document_|scan_)/;

export function classifyCourierStripeIdentity(
  account: CourierStripeAccount | null | undefined,
): CourierIdentityClassification {
  const base = {
    explicitDocumentVerified: false as const,
    governmentDocumentStoredByHomeCheff: false as const,
    paidDeliveryAllowed: false,
    stripeReportsIdentityVerified: false,
  };
  if (!account?.id) {
    return { ...base, state: 'NOT_STARTED', reason: 'NO_CONNECT_ACCOUNT' };
  }
  const disabled =
    account.requirements?.disabled_reason || account.future_requirements?.disabled_reason || null;
  if (disabled) {
    return { ...base, state: 'RESTRICTED', reason: 'STRIPE_ACCOUNT_RESTRICTED' };
  }
  const verification = account.individual?.verification;
  if (!verification) {
    const reason =
      account.business_type === 'company'
        ? 'COMPANY_VERIFICATION_NOT_ON_ACCOUNT'
        : 'VERIFICATION_NOT_EXPOSED';
    return { ...base, state: 'UNKNOWN', reason };
  }
  const status = verification.status ?? null;
  if (status === 'verified') {
    return {
      ...base,
      state: 'VERIFIED',
      reason: 'STRIPE_INDIVIDUAL_VERIFICATION_VERIFIED',
      paidDeliveryAllowed: true,
      stripeReportsIdentityVerified: true,
    };
  }
  if (status === 'pending') {
    return { ...base, state: 'PENDING', reason: 'STRIPE_VERIFICATION_PENDING' };
  }
  if (verification.details_code && FAILURE_CODE.test(verification.details_code)) {
    return { ...base, state: 'FAILED', reason: 'STRIPE_VERIFICATION_FAILED' };
  }
  if (status === 'unverified') {
    return { ...base, state: 'NOT_STARTED', reason: 'STRIPE_VERIFICATION_UNVERIFIED' };
  }
  return { ...base, state: 'UNKNOWN', reason: 'VERIFICATION_STATUS_UNRECOGNIZED' };
}

export function courierIdentityMessage(state: string | null | undefined): {
  nl: string;
  en: string;
} {
  switch (state) {
    case 'VERIFIED':
      return {
        nl: 'Stripe meldt dat de identiteitscontrole is afgerond. HomeCheff bewaart geen identiteitsdocument. Betaalde bezorging kan worden geaccepteerd zolang Stripe deze status houdt.',
        en: 'Stripe reports that its identity check is complete. HomeCheff does not store an identity document. Paid delivery can be accepted while Stripe keeps this status.',
      };
    case 'PENDING':
      return {
        nl: 'Stripe controleert je gegevens nog. Je kunt je profiel en beschikbaarheid instellen. Betaalde bezorging blijft gesloten tot Stripe de controle afrondt.',
        en: 'Stripe is still checking your details. You can set your profile and availability. Paid delivery stays closed until Stripe finishes the check.',
      };
    case 'RESTRICTED':
      return {
        nl: 'Stripe heeft dit account beperkt. Betaalde bezorging is gepauzeerd. Open Stripe-onboarding als Stripe om meer informatie vraagt.',
        en: 'Stripe has restricted this account. Paid delivery is paused. Open Stripe onboarding if Stripe asks for more information.',
      };
    case 'FAILED':
      return {
        nl: 'Stripe kon de identiteitscontrole niet afronden. Betaalde bezorging blijft gesloten. Open Stripe-onboarding om het te herstellen.',
        en: 'Stripe could not finish the identity check. Paid delivery stays closed. Open Stripe onboarding to resolve it.',
      };
    case 'NOT_STARTED':
      return {
        nl: 'Stripe-onboarding is nog nodig. Betaalde bezorging wacht op de identiteitsstatus van Stripe, niet alleen op een uitbetaling die aanstaat.',
        en: 'Stripe onboarding is still required. Paid delivery waits for Stripe identity status, not only for payouts to be enabled.',
      };
    default:
      return {
        nl: 'HomeCheff heeft geen bruikbare identiteitsstatus van Stripe. Ontbrekende informatie telt niet als gecontroleerd. Betaalde bezorging blijft gesloten.',
        en: 'HomeCheff does not have a usable identity status from Stripe. Missing information is not treated as verified. Paid delivery stays closed.',
      };
  }
}
