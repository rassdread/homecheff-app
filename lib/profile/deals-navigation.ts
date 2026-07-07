/**
 * Unified agreements hub — CE-2A "Mijn Afspraken".
 *
 * The hub lives at /profile/deals (the strongest existing base). /agreements is a
 * thin redirect alias only (CE-2A.7, Option A) — no parallel second hub.
 */

export const DEALS_PROFILE_PATH = '/profile/deals' as const;

/** @deprecated Legacy alias — /agreements redirects to DEALS_PROFILE_PATH. */
export const AGREEMENTS_HUB_PATH = '/agreements' as const;

export type DealsNavItem = {
  labelKey: 'community.agreements.navLabel';
  href: typeof DEALS_PROFILE_PATH;
  enabled: boolean;
};

export const PROFILE_DEALS_NAV: DealsNavItem = {
  labelKey: 'community.agreements.navLabel',
  href: DEALS_PROFILE_PATH,
  enabled: true,
};

export const USER_DEALS_QUERY_KEY = ['agreements', 'hub'] as const;
