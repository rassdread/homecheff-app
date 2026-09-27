/**
 * View model for the settings account-completion checklist.
 * Eligibility stays on the server. This only decides which existing
 * requirements are shown, and which controls are valid for that state.
 */

export type AccountAgeMode =
  | 'LEGACY_ADULT'
  | 'DOB_REQUIRED'
  | 'BLOCKED_UNDER_13'
  | 'ADULT'
  | 'MINOR';

export type AccountStripeUiStatus =
  | 'NOT_STARTED'
  | 'INCOMPLETE'
  | 'PENDING_VERIFICATION'
  | 'ACTION_REQUIRED'
  | 'PAYMENT_READY'
  | 'RESTRICTED';

export type AccountConnectTrack = 'PARTICULAR' | 'BUSINESS';

export type AccountCompletionInput = {
  emailVerified: boolean;
  ageMode: AccountAgeMode | null;
  consentRequired: boolean;
  hasStripeAccount: boolean;
  stripeUiStatus: AccountStripeUiStatus | null;
  connectTrack: AccountConnectTrack | null;
  canCreateOnboardingLink: boolean;
  configurationMismatch: boolean;
  selectedTrack: AccountConnectTrack | null;
};

export type AccountCompletionStepId =
  | 'email'
  | 'dob'
  | 'accountType'
  | 'payments'
  | 'consent';

export type AccountPaymentCta = 'setup' | 'finish' | 'update' | 'view' | 'pending' | 'none';

export type AccountCompletionModel = {
  showChecklist: boolean;
  steps: AccountCompletionStepId[];
  emailComplete: boolean;
  dobComplete: boolean;
  dobRequired: boolean;
  accountTypeComplete: boolean;
  showAccountType: boolean;
  particularSelectable: boolean;
  businessSelectable: boolean;
  minorBusinessBlocked: boolean;
  effectiveTrack: AccountConnectTrack | null;
  paymentsComplete: boolean;
  paymentsBlocked: boolean;
  paymentCta: AccountPaymentCta;
  consentComplete: boolean;
  showConsent: boolean;
  under13: boolean;
};

export function accountCompletionModel(
  input: AccountCompletionInput,
): AccountCompletionModel {
  const minor = input.ageMode === 'MINOR';
  const under13 = input.ageMode === 'BLOCKED_UNDER_13';
  const legacy = input.ageMode === 'LEGACY_ADULT';
  const adult = input.ageMode === 'ADULT' || legacy;
  const dobRequired = input.ageMode === 'DOB_REQUIRED';
  const dobKnown = input.ageMode != null && !dobRequired;
  const showDob = input.ageMode != null && !legacy;
  const dobComplete = showDob && dobKnown;

  const lockedType = input.hasStripeAccount || input.configurationMismatch;
  const showAccountType = dobKnown && !under13 && (adult || minor);
  const particularSelectable = showAccountType && !lockedType;
  const businessSelectable = showAccountType && adult && !lockedType && !minor;
  const effectiveTrack: AccountConnectTrack | null = minor
    ? 'PARTICULAR'
    : lockedType
      ? input.connectTrack
      : input.selectedTrack;

  const accountTypeComplete =
    showAccountType &&
    (minor || lockedType || input.selectedTrack != null || input.connectTrack != null);

  const showConsent = minor;
  const consentComplete = minor && !input.consentRequired;

  const paymentsComplete =
    input.stripeUiStatus === 'PAYMENT_READY' && !input.configurationMismatch;

  const paymentsBlocked =
    under13 ||
    dobRequired ||
    input.ageMode == null ||
    (minor && input.consentRequired) ||
    (!lockedType && !minor && input.selectedTrack == null && input.connectTrack == null);

  let paymentCta: AccountPaymentCta = 'none';
  if (under13 || input.configurationMismatch) {
    paymentCta = 'none';
  } else if (paymentsComplete) {
    paymentCta = 'view';
  } else if (input.stripeUiStatus === 'PENDING_VERIFICATION' && !input.canCreateOnboardingLink) {
    paymentCta = 'pending';
  } else if (!input.hasStripeAccount) {
    paymentCta = 'setup';
  } else if (
    input.stripeUiStatus === 'ACTION_REQUIRED' ||
    input.stripeUiStatus === 'RESTRICTED'
  ) {
    paymentCta = input.canCreateOnboardingLink ? 'update' : 'pending';
  } else if (input.canCreateOnboardingLink) {
    paymentCta = 'finish';
  } else {
    paymentCta = 'pending';
  }

  const steps: AccountCompletionStepId[] = [];
  steps.push('email');
  if (showDob) steps.push('dob');
  if (showAccountType) steps.push('accountType');
  if (!under13 && input.ageMode != null) steps.push('payments');
  if (showConsent) steps.push('consent');

  const showChecklist =
    !input.emailVerified ||
    dobRequired ||
    under13 ||
    (showConsent && !consentComplete) ||
    !paymentsComplete ||
    (showAccountType && !accountTypeComplete);

  return {
    showChecklist,
    steps,
    emailComplete: input.emailVerified,
    dobComplete,
    dobRequired,
    accountTypeComplete,
    showAccountType,
    particularSelectable,
    businessSelectable,
    minorBusinessBlocked: minor,
    effectiveTrack,
    paymentsComplete,
    paymentsBlocked,
    paymentCta,
    consentComplete,
    showConsent,
    under13,
  };
}

/** Steps that can be completed inside a listing form. Hidden until they are possible. */
export function listingCompletionSteps(
  model: AccountCompletionModel,
): AccountCompletionStepId[] {
  const order: AccountCompletionStepId[] = ['dob', 'accountType', 'consent', 'payments'];
  return order.filter((step) => {
    if (!model.steps.includes(step)) return false;
    if (step === 'payments' && model.paymentsBlocked && !model.paymentsComplete) return false;
    return true;
  });
}
