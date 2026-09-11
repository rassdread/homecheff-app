/**
 * Canonical Connect entry-state machine.
 * All CTAs / onboard GET should resolve through this — no ad-hoc track guessing.
 */

import type Stripe from 'stripe';
import {
  deriveConnectAccountStatusFromStripe,
  type ConnectAccountStatusSnapshot,
  type HomecheffConnectUiStatus,
} from '@/lib/stripe/connect-account-status';
import {
  parseConnectTrack,
  type ConnectTrack,
} from '@/lib/stripe/connect-tracks';
import {
  isParticularAccountShape,
  isBusinessAccountShape,
  validateConnectAccountShape,
} from '@/lib/stripe/connect-account-shape';

export type ConnectUserClassification =
  | 'CORRECT_PARTICULAR'
  | 'CORRECT_BUSINESS'
  | 'CORRECT_LEGACY'
  | 'INCOMPLETE_CORRECT_TRACK'
  | 'CHOICE_REQUIRED'
  | 'CONFIGURATION_MISMATCH'
  | 'ABANDONED_ONBOARDING'
  | 'MULTIPLE_ACCOUNT_AMBIGUITY'
  | 'MANUAL_REVIEW'
  | 'PENDING_VERIFICATION'
  | 'PAYMENT_READY'
  | 'NOT_STARTED';

export type ConnectEntryState =
  | 'CHOOSE_TRACK'
  | 'RECOVER_MISMATCH'
  | 'RESUME_PARTICULAR'
  | 'RESUME_BUSINESS'
  | 'PENDING_VERIFICATION'
  | 'READY'
  | 'MANUAL_REVIEW'
  | 'ACTION_REQUIRED'
  | 'NOT_STARTED';

export type ConnectEntryResolution = {
  entryState: ConnectEntryState;
  classification: ConnectUserClassification;
  connectTrack: ConnectTrack | null;
  accountId: string | null;
  uiStatus: HomecheffConnectUiStatus;
  paymentReady: boolean;
  canCreateOnboardingLink: boolean;
  needsTrackSelection: boolean;
  recoveryEligible: boolean;
  configurationMismatch: boolean;
  mismatchReason: string | null;
  snapshot: ConnectAccountStatusSnapshot | null;
  /** Human NL copy for UI surfaces */
  titleNl: string;
  bodyNl: string;
  ctaLabelNl: string | null;
};

function copyForEntry(state: ConnectEntryState): {
  titleNl: string;
  bodyNl: string;
  ctaLabelNl: string | null;
} {
  switch (state) {
    case 'NOT_STARTED':
    case 'CHOOSE_TRACK':
      return {
        titleNl: 'Stel je betaalaccount in',
        bodyNl:
          'Kies of je HomeCheff als particulier of als bedrijf gebruikt. Dit bepaalt welke Stripe-verificatie nodig is.',
        ctaLabelNl: 'Betaalaccount instellen',
      };
    case 'RECOVER_MISMATCH':
      return {
        titleNl: 'Je betaalaccount moet opnieuw worden ingesteld',
        bodyNl:
          'Je betaalaccount is ingesteld als een organisatie, terwijl je HomeCheff gebruikt als particulier. Om de juiste verificatie te gebruiken moet je betaalaccount opnieuw worden ingesteld.',
        ctaLabelNl: 'Opnieuw instellen als particulier',
      };
    case 'RESUME_PARTICULAR':
    case 'RESUME_BUSINESS':
    case 'ACTION_REQUIRED':
      return {
        titleNl: 'Je verificatie is nog niet afgerond',
        bodyNl:
          'Rond je Stripe-gegevens af om betalingen via HomeCheff te kunnen ontvangen.',
        ctaLabelNl: 'Gegevens afronden',
      };
    case 'PENDING_VERIFICATION':
      return {
        titleNl: 'Stripe controleert je gegevens',
        bodyNl:
          'Je gegevens zijn ingestuurd. Stripe controleert ze. Je hoeft ze niet opnieuw in te vullen.',
        ctaLabelNl: null,
      };
    case 'READY':
      return {
        titleNl: 'Betaalaccount gereed',
        bodyNl:
          'Je betaalaccount is gereed om betalingen via HomeCheff te ontvangen.',
        ctaLabelNl: null,
      };
    case 'MANUAL_REVIEW':
      return {
        titleNl: 'Je betaalaccount wordt gecontroleerd',
        bodyNl:
          'Er is een handmatige controle nodig. Neem contact op met support als dit aanhoudt.',
        ctaLabelNl: null,
      };
    default:
      return {
        titleNl: 'Stel je betaalaccount in',
        bodyNl: 'Koppel je betaalaccount om via HomeCheff betalingen te ontvangen.',
        ctaLabelNl: 'Betaalaccount instellen',
      };
  }
}

export function resolveConnectEntryState(params: {
  stripeConnectAccountId?: string | null;
  stripeConnectTrack?: string | null;
  stripeConnectOnboardingCompleted?: boolean | null;
  stripeAccount?: Stripe.Account | null;
  /** True when migrate audit shows ambiguous current pointer */
  multipleAccountAmbiguity?: boolean;
}): ConnectEntryResolution {
  const track = parseConnectTrack(params.stripeConnectTrack);
  const accountId = params.stripeConnectAccountId ?? null;
  const account = params.stripeAccount ?? null;

  if (params.multipleAccountAmbiguity) {
    const copy = copyForEntry('MANUAL_REVIEW');
    return {
      entryState: 'MANUAL_REVIEW',
      classification: 'MULTIPLE_ACCOUNT_AMBIGUITY',
      connectTrack: track,
      accountId,
      uiStatus: 'RESTRICTED',
      paymentReady: false,
      canCreateOnboardingLink: false,
      needsTrackSelection: false,
      recoveryEligible: false,
      configurationMismatch: false,
      mismatchReason: 'Multiple Connect accounts with ambiguous current pointer',
      snapshot: null,
      ...copy,
    };
  }

  if (!accountId) {
    const entryState = 'CHOOSE_TRACK';
    const copy = copyForEntry(entryState);
    return {
      entryState,
      classification: 'NOT_STARTED',
      connectTrack: track,
      accountId: null,
      uiStatus: 'NOT_STARTED',
      paymentReady: false,
      canCreateOnboardingLink: true,
      needsTrackSelection: true,
      recoveryEligible: false,
      configurationMismatch: false,
      mismatchReason: null,
      snapshot: null,
      ...copy,
    };
  }

  const snapshot = account
    ? deriveConnectAccountStatusFromStripe(account, { connectTrack: track })
    : null;

  if (!account) {
    // No live retrieve — fall back carefully
    if (params.stripeConnectOnboardingCompleted) {
      const copy = copyForEntry('READY');
      return {
        entryState: 'READY',
        classification: track === 'PARTICULAR' ? 'CORRECT_PARTICULAR' : track === 'BUSINESS' ? 'CORRECT_BUSINESS' : 'CORRECT_LEGACY',
        connectTrack: track,
        accountId,
        uiStatus: 'PAYMENT_READY',
        paymentReady: true,
        canCreateOnboardingLink: false,
        needsTrackSelection: false,
        recoveryEligible: false,
        configurationMismatch: false,
        mismatchReason: null,
        snapshot: null,
        ...copy,
      };
    }
    const copy = copyForEntry(track ? 'ACTION_REQUIRED' : 'CHOOSE_TRACK');
    return {
      entryState: track ? (track === 'PARTICULAR' ? 'RESUME_PARTICULAR' : 'RESUME_BUSINESS') : 'CHOOSE_TRACK',
      classification: track ? 'INCOMPLETE_CORRECT_TRACK' : 'CHOICE_REQUIRED',
      connectTrack: track,
      accountId,
      uiStatus: snapshot?.uiStatus ?? 'INCOMPLETE',
      paymentReady: false,
      canCreateOnboardingLink: Boolean(track),
      needsTrackSelection: !track,
      recoveryEligible: false,
      configurationMismatch: false,
      mismatchReason: null,
      snapshot,
      ...copy,
    };
  }

  // Track known + shape mismatch
  if (track === 'PARTICULAR') {
    const shape = validateConnectAccountShape(account, 'PARTICULAR');
    if (!shape.ok) {
      const copy = copyForEntry('RECOVER_MISMATCH');
      // Prefer mismatch messaging when non_profit/company
      return {
        entryState: 'RECOVER_MISMATCH',
        classification: 'CONFIGURATION_MISMATCH',
        connectTrack: track,
        accountId,
        uiStatus: snapshot?.uiStatus ?? 'RESTRICTED',
        paymentReady: false,
        canCreateOnboardingLink: false,
        needsTrackSelection: true,
        recoveryEligible: true,
        configurationMismatch: true,
        mismatchReason: shape.reason,
        snapshot,
        ...copy,
      };
    }
  }

  if (track === 'BUSINESS') {
    const shape = validateConnectAccountShape(account, 'BUSINESS');
    if (!shape.ok) {
      const copy = copyForEntry('RECOVER_MISMATCH');
      return {
        entryState: 'RECOVER_MISMATCH',
        classification: 'CONFIGURATION_MISMATCH',
        connectTrack: track,
        accountId,
        uiStatus: snapshot?.uiStatus ?? 'RESTRICTED',
        paymentReady: false,
        canCreateOnboardingLink: false,
        needsTrackSelection: true,
        recoveryEligible: true,
        configurationMismatch: true,
        mismatchReason: shape.reason,
        snapshot,
        ...copy,
      };
    }
  }

  // No track — classify legacy / abandoned / choice required
  if (!track) {
    if (snapshot?.paymentReady) {
      const copy = copyForEntry('READY');
      return {
        entryState: 'READY',
        classification: 'CORRECT_LEGACY',
        connectTrack: null,
        accountId,
        uiStatus: 'PAYMENT_READY',
        paymentReady: true,
        canCreateOnboardingLink: false,
        needsTrackSelection: false,
        recoveryEligible: false,
        configurationMismatch: false,
        mismatchReason: null,
        snapshot,
        ...copy,
      };
    }
    if (!account.details_submitted) {
      const copy = copyForEntry('CHOOSE_TRACK');
      return {
        entryState: 'CHOOSE_TRACK',
        classification: 'ABANDONED_ONBOARDING',
        connectTrack: null,
        accountId,
        uiStatus: snapshot?.uiStatus ?? 'INCOMPLETE',
        paymentReady: false,
        canCreateOnboardingLink: false,
        needsTrackSelection: true,
        recoveryEligible: true,
        configurationMismatch: false,
        mismatchReason: null,
        snapshot,
        ...copy,
      };
    }
    const copy = copyForEntry('CHOOSE_TRACK');
    return {
      entryState: 'CHOOSE_TRACK',
      classification: 'CHOICE_REQUIRED',
      connectTrack: null,
      accountId,
      uiStatus: snapshot?.uiStatus ?? 'INCOMPLETE',
      paymentReady: false,
      canCreateOnboardingLink: false,
      needsTrackSelection: true,
      recoveryEligible: false,
      configurationMismatch: false,
      mismatchReason: null,
      snapshot,
      ...copy,
    };
  }

  // Correct track + shape
  if (snapshot?.paymentReady) {
    const copy = copyForEntry('READY');
    return {
      entryState: 'READY',
      classification:
        track === 'PARTICULAR' ? 'CORRECT_PARTICULAR' : 'CORRECT_BUSINESS',
      connectTrack: track,
      accountId,
      uiStatus: 'PAYMENT_READY',
      paymentReady: true,
      canCreateOnboardingLink: false,
      needsTrackSelection: false,
      recoveryEligible: false,
      configurationMismatch: false,
      mismatchReason: null,
      snapshot,
      ...copy,
    };
  }

  if (snapshot?.uiStatus === 'PENDING_VERIFICATION') {
    const copy = copyForEntry('PENDING_VERIFICATION');
    return {
      entryState: 'PENDING_VERIFICATION',
      classification: 'PENDING_VERIFICATION',
      connectTrack: track,
      accountId,
      uiStatus: 'PENDING_VERIFICATION',
      paymentReady: false,
      canCreateOnboardingLink: false,
      needsTrackSelection: false,
      recoveryEligible: false,
      configurationMismatch: false,
      mismatchReason: null,
      snapshot,
      ...copy,
    };
  }

  const resumeState =
    track === 'PARTICULAR' ? 'RESUME_PARTICULAR' : 'RESUME_BUSINESS';
  const copy = copyForEntry(resumeState);
  return {
    entryState: resumeState,
    classification: 'INCOMPLETE_CORRECT_TRACK',
    connectTrack: track,
    accountId,
    uiStatus: snapshot?.uiStatus ?? 'INCOMPLETE',
    paymentReady: false,
    canCreateOnboardingLink: snapshot?.canCreateOnboardingLink ?? true,
    needsTrackSelection: false,
    recoveryEligible: false,
    configurationMismatch: false,
    mismatchReason: null,
    snapshot,
    ...copy,
  };
}

export function classifyConnectUserForAudit(params: {
  stripeConnectTrack?: string | null;
  stripeAccount?: Stripe.Account | null;
  paymentReady?: boolean;
}): ConnectUserClassification {
  const track = parseConnectTrack(params.stripeConnectTrack);
  const account = params.stripeAccount;
  if (!account) return 'CHOICE_REQUIRED';
  if (track === 'PARTICULAR') {
    if (isParticularAccountShape(account)) {
      return params.paymentReady ? 'CORRECT_PARTICULAR' : 'INCOMPLETE_CORRECT_TRACK';
    }
    return 'CONFIGURATION_MISMATCH';
  }
  if (track === 'BUSINESS') {
    if (isBusinessAccountShape(account)) {
      return params.paymentReady ? 'CORRECT_BUSINESS' : 'INCOMPLETE_CORRECT_TRACK';
    }
    return 'CONFIGURATION_MISMATCH';
  }
  if (params.paymentReady) return 'CORRECT_LEGACY';
  if (!account.details_submitted) return 'ABANDONED_ONBOARDING';
  return 'CHOICE_REQUIRED';
}
