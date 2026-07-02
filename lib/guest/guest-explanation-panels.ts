/** Guest explanation panels — hero (sales) + bottom navigation. */
export type GuestSalesPanelId = 'discover' | 'share' | 'cheff' | 'garden' | 'designer';

export type GuestBottomNavPanelId = 'earn' | 'create' | 'messages' | 'profile';

export type GuestExplanationNamespace = 'guestSalesPanels' | 'guestBottomNav';

export function scrollToHomeFeed(behavior: ScrollBehavior = 'smooth') {
  if (typeof document === 'undefined') return;
  document.getElementById('homecheff-feed')?.scrollIntoView({ behavior, block: 'start' });
}
