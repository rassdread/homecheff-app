/**
 * Future "Mijn afspraken" profile section — navigation hooks only (UX Slice 1 prep).
 * Full deal history UI is out of scope; wire profile nav when the page ships.
 */

export const DEALS_PROFILE_PATH = '/profile/deals' as const;

export type DealsNavItem = {
  /** i18n key for menu label */
  labelKey: 'profile.deals.navLabel';
  href: typeof DEALS_PROFILE_PATH;
  /** Gate full navigation until the deals page exists */
  enabled: boolean;
};

/** Profile sidebar / settings entry — disabled until deals history page ships */
export const PROFILE_DEALS_NAV: DealsNavItem = {
  labelKey: 'profile.deals.navLabel',
  href: DEALS_PROFILE_PATH,
  enabled: true,
};

/** Query key for a future React Query / SWR hook listing user deals */
export const USER_DEALS_QUERY_KEY = ['profile', 'deals'] as const;
