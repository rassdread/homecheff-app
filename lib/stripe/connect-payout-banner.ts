import type { HomecheffConnectUiStatus } from '@/lib/stripe/connect-account-status';

export type ConnectPayoutPhase = 'not_started' | 'resume' | 'in_review' | 'ready' | 'waiting';

export type ConnectPayoutBannerModel = {
  phase: ConnectPayoutPhase;
  titleNl: string;
  bodyNl: string;
  actionLabelNl: string | null;
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
      titleNl: 'Betaalaccount gereed',
      bodyNl: 'Je kunt uitbetalingen ontvangen via HomeCheff.',
      actionLabelNl: null,
      askTrack: false,
    };
  }

  if (status === 'PENDING_VERIFICATION' && !input.canCreateOnboardingLink) {
    return {
      phase: 'in_review',
      titleNl: 'Verificatie wordt gecontroleerd',
      bodyNl:
        'Je gegevens zijn ingestuurd. Stripe controleert ze. Je hoeft ze niet opnieuw in te vullen.',
      actionLabelNl: null,
      askTrack: false,
    };
  }

  if (status === 'RESTRICTED' && !input.canCreateOnboardingLink) {
    return {
      phase: 'waiting',
      titleNl: 'Stripe heeft je betaalaccount beperkt',
      bodyNl:
        'Er staan nu geen invulbare stappen open. Vernieuw later of neem contact op met support.',
      actionLabelNl: null,
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
      titleNl: SETUP_TITLE,
      bodyNl: 'Je bent al begonnen. We gaan verder met je bestaande betaalaccount.',
      actionLabelNl: 'Verder met Stripe Connect',
      askTrack: false,
    };
  }

  return {
    phase: 'not_started',
    titleNl: SETUP_TITLE,
    bodyNl: 'Kies particulier of bedrijf. Daarna ga je direct naar Stripe.',
    actionLabelNl: 'Stripe Connect instellen',
    askTrack: true,
  };
}
