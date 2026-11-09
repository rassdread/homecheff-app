/**
 * What the Stripe return screen may do. It never starts onboarding by itself.
 * Resume is an explicit click and uses the Connect account already stored.
 */
import { isAllowedStripeReturnPath } from '@/lib/stripe/stripe-connect-return-path';

export type StripeReturnKind = 'listing' | 'delivery' | 'seller' | 'other';

export function stripeReturnDestination(returnPath: string): {
  path: string;
  kind: StripeReturnKind;
  labelNl: string;
  labelEn: string;
} {
  const path = isAllowedStripeReturnPath(returnPath) ? returnPath : '/mijn-homecheff';
  if (path === '/sell' || path.startsWith('/sell/') || path.startsWith('/sell?') || path.startsWith('/product/')) {
    return {
      path,
      kind: 'listing',
      labelNl: 'Terug naar je advertentie',
      labelEn: 'Back to your listing',
    };
  }
  if (path === '/delivery' || path.startsWith('/delivery/') || path.startsWith('/delivery?')) {
    return {
      path,
      kind: 'delivery',
      labelNl: 'Terug naar je bezorgdashboard',
      labelEn: 'Back to your delivery dashboard',
    };
  }
  if (path === '/verkoper' || path.startsWith('/verkoper/') || path.startsWith('/verkoper?')) {
    return {
      path,
      kind: 'seller',
      labelNl: 'Terug naar je verkopersdashboard',
      labelEn: 'Back to your seller dashboard',
    };
  }
  return {
    path,
    kind: 'other',
    labelNl: 'Ga naar Mijn HomeCheff',
    labelEn: 'Go to My HomeCheff',
  };
}

export type StripeReturnUiStatus =
  | 'NOT_STARTED'
  | 'INCOMPLETE'
  | 'PENDING_VERIFICATION'
  | 'ACTION_REQUIRED'
  | 'PAYMENT_READY'
  | 'RESTRICTED';

export function stripeIncompleteReturn(input: {
  uiStatus: StripeReturnUiStatus | 'error' | 'loading';
  canCreateLink: boolean;
  returnPath: string;
}): {
  autoLaunch: false;
  showResume: boolean;
  leavePath: string;
  listingContext: boolean;
  leaveLabelNl: string;
  leaveLabelEn: string;
  resumeLabelNl: string;
  resumeLabelEn: string;
} {
  const destination = stripeReturnDestination(input.returnPath);
  const listingContext = destination.kind === 'listing';
  const leavePath = isAllowedStripeReturnPath(input.returnPath)
    ? input.returnPath
    : '/settings?tab=payments';
  const incomplete =
    input.canCreateLink &&
    (input.uiStatus === 'INCOMPLETE' ||
      input.uiStatus === 'ACTION_REQUIRED' ||
      input.uiStatus === 'NOT_STARTED' ||
      input.uiStatus === 'RESTRICTED');
  return {
    autoLaunch: false,
    showResume: incomplete,
    leavePath,
    listingContext,
    leaveLabelNl: destination.kind === 'other' ? 'Later afronden' : destination.labelNl,
    leaveLabelEn: destination.kind === 'other' ? 'Finish later' : destination.labelEn,
    resumeLabelNl: 'Gegevens afronden',
    resumeLabelEn: 'Finish your details',
  };
}
