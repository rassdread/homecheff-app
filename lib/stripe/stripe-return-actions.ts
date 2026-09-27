/**
 * What the Stripe return screen may do. It never starts onboarding by itself.
 * Resume is an explicit click and uses the Connect account already stored.
 */

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
  const listingContext =
    input.returnPath.startsWith('/sell') || input.returnPath.startsWith('/product/');
  const leavePath =
    input.returnPath.startsWith('/sell') ||
    input.returnPath.startsWith('/product/') ||
    input.returnPath.startsWith('/verkoper') ||
    input.returnPath.startsWith('/profile') ||
    input.returnPath.startsWith('/mijn-homecheff') ||
    input.returnPath.startsWith('/settings')
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
    leaveLabelNl: listingContext ? 'Terug naar je advertentie' : 'Later afronden',
    leaveLabelEn: listingContext ? 'Back to your listing' : 'Finish later',
    resumeLabelNl: 'Gegevens afronden',
    resumeLabelEn: 'Finish your details',
  };
}
