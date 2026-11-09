import type { HomecheffConnectUiStatus } from '@/lib/stripe/connect-account-status';

export type ConnectPayoutPhase = 'not_started' | 'resume' | 'in_review' | 'ready' | 'waiting';

export type ConnectPayoutPresentation = 'action' | 'payments';

export type ConnectPayoutBannerModel = {
  phase: ConnectPayoutPhase;
  presentation: ConnectPayoutPresentation;
  titleNl: string;
  bodyNl: string;
  actionLabelNl: string | null;
  /** Short line under the Betalingen heading. Empty while an action is still required. */
  paymentsLineNl: string | null;
  askTrack: boolean;
};

const SETUP_TITLE = 'Rond Stripe Connect af om uitbetalingen te ontvangen';

export function connectPayoutBannerModel(input: {
  hasAccount?: boolean;
  uiStatus?: HomecheffConnectUiStatus | null;
  canCreateOnboardingLink?: boolean;
  needsTrackSelection?: boolean;
  paymentReady?: boolean;
  connectTrack?: string | null;
}): ConnectPayoutBannerModel {
  const status = input.uiStatus ?? null;
  const hasAccount = Boolean(input.hasAccount);
  const canAct = input.canCreateOnboardingLink !== false;
  const needsChoice = Boolean(input.needsTrackSelection) || !hasAccount;

  if (input.paymentReady || status === 'PAYMENT_READY') {
    return {
      phase: 'ready',
      presentation: 'payments',
      titleNl: 'Betalingen',
      bodyNl: '',
      actionLabelNl: null,
      paymentsLineNl: '✓ Uitbetalingen ingesteld',
      askTrack: false,
    };
  }

  if (status === 'PENDING_VERIFICATION' && !input.canCreateOnboardingLink) {
    return {
      phase: 'in_review',
      presentation: 'payments',
      titleNl: 'Betalingen',
      bodyNl: '',
      actionLabelNl: null,
      paymentsLineNl: 'Verificatie wordt gecontroleerd',
      askTrack: false,
    };
  }

  if (status === 'RESTRICTED' && !input.canCreateOnboardingLink) {
    return {
      phase: 'waiting',
      presentation: 'payments',
      titleNl: 'Betalingen',
      bodyNl: '',
      actionLabelNl: null,
      paymentsLineNl: 'Stripe heeft je betaalaccount beperkt',
      askTrack: false,
    };
  }

  const started =
    hasAccount &&
    !needsChoice &&
    (status === 'INCOMPLETE' ||
      status === 'ACTION_REQUIRED' ||
      status === 'RESTRICTED' ||
      status === 'PENDING_VERIFICATION');

  if (started && canAct) {
    return {
      phase: 'resume',
      presentation: 'action',
      titleNl: SETUP_TITLE,
      bodyNl: 'Je bent al begonnen. We gaan verder met je bestaande betaalaccount.',
      actionLabelNl: 'Verder met Stripe Connect',
      paymentsLineNl: null,
      askTrack: false,
    };
  }

  return {
    phase: 'not_started',
    presentation: 'action',
    titleNl: SETUP_TITLE,
    bodyNl: 'Kies particulier of bedrijf. Daarna ga je direct naar Stripe.',
    actionLabelNl: 'Instellen',
    paymentsLineNl: null,
    askTrack: true,
  };
}
