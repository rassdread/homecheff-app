/** Guest explanation panels — hero (sales) + bottom navigation. */
export type GuestSalesPanelId = 'discover' | 'share' | 'cheff' | 'garden' | 'designer';

export type GuestBottomNavPanelId = 'earn' | 'create' | 'messages' | 'profile' | 'reputation';

export type GuestExplanationNamespace = 'guestSalesPanels' | 'guestBottomNav';

export function scrollToHomeFeed(behavior: ScrollBehavior = 'smooth') {
  if (typeof document === 'undefined') return;
  const isDesktop =
    typeof window !== 'undefined' &&
    window.matchMedia('(min-width: 1024px)').matches;
  const shell = document.querySelector('.hc-home-desktop-shell');
  const desktopFeed = document.getElementById('homecheff-feed-desktop');
  const mobileFeed = document.getElementById('homecheff-feed');

  if (isDesktop && shell) {
    shell.scrollIntoView({ behavior, block: 'start' });
    if (desktopFeed) desktopFeed.scrollTop = 0;
    return;
  }

  (desktopFeed ?? mobileFeed)?.scrollIntoView({ behavior, block: 'start' });
}
