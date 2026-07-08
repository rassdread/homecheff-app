/**
 * Desktop homepage sidebar IA — Phase 7F.
 * Static navigation targets only; reuses existing routes and i18n keys.
 */

/** Mijn omgeving — personal workspace links (logged-in). */
export const HOME_DESKTOP_ENVIRONMENT_LINKS = [
  { id: 'offers', href: '/profile?tab=aanbod', labelKey: 'home.desktop.myOffers' },
  { id: 'deals', href: '/profile/deals', labelKey: 'agreements.myAgreements' },
  { id: 'orders', href: '/verkoper/orders', labelKey: 'roleQuickLinks.orders' },
  { id: 'messages', href: '/messages', labelKey: 'navbar.messages' },
  { id: 'favorites', href: '/favorites', labelKey: 'navbar.favorites' },
  { id: 'profile', href: '/profile?tab=overview', labelKey: 'navbar.myProfile' },
] as const;

/** Marketplace quick navigation — canonical view/category deep links. */
export const HOME_DESKTOP_MARKETPLACE_LINKS = [
  {
    id: 'food',
    href: '/?chip=sale&vertical=cheff#homecheff-feed',
    labelKey: 'marketplace.canonical.category.food',
  },
  {
    id: 'garden',
    href: '/?chip=sale&vertical=garden#homecheff-feed',
    labelKey: 'marketplace.canonical.category.garden',
  },
  {
    id: 'creations',
    href: '/?chip=sale&vertical=designer#homecheff-feed',
    labelKey: 'marketplace.canonical.category.creations',
  },
  {
    id: 'services',
    href: '/?chip=sale&vertical=services#homecheff-feed',
    labelKey: 'marketplace.canonical.category.services',
  },
  {
    id: 'inspiration',
    href: '/?chip=inspiration#homecheff-feed',
    labelKey: 'marketplace.canonical.view.inspiration',
  },
  {
    id: 'wanted',
    href: '/?chip=gezocht#homecheff-feed',
    labelKey: 'marketplace.canonical.view.wanted',
  },
] as const;
