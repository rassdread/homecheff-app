/**
 * Bottom tab bar reserve — keep scrollable content above fixed `BottomNavigation`
 * on mobile/tablet/narrow desktop (< xl). Desktop web (xl+) has no bottom nav bar.
 */

export const HC_BOTTOM_NAV_SCROLL_PADDING =
  'max-xl:pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] max-xl:sm:pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))]' as const;

/** Fixed nav bar height (matches BottomNavigation + safe-area) — mobile/tablet only. */
export const HC_BOTTOM_NAV_OFFSET_CSS =
  'calc(5.5rem + env(safe-area-inset-bottom, 0px))' as const;

export const HC_BOTTOM_NAV_OFFSET_CSS_SM =
  'calc(5rem + env(safe-area-inset-bottom, 0px))' as const;

/** Tailwind arbitrary bottom for mobile chat panels above the tab bar. */
export const HC_MOBILE_CHAT_ABOVE_NAV_BOTTOM =
  'max-xl:bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] max-xl:sm:bottom-[calc(5rem+env(safe-area-inset-bottom,0px))]' as const;

/** Sticky form footers — extra pad for bottom nav on max-xl only. */
export const HC_STICKY_FORM_FOOTER_PAD =
  'max-xl:pb-[calc(env(safe-area-inset-bottom,0px)+5.75rem)] xl:pb-4' as const;

/** Page bottom pad when nav visible (sell/new, inspiratie detail, mijn-hcp). */
export const HC_PAGE_BOTTOM_NAV_PAD =
  'max-xl:pb-[calc(env(safe-area-inset-bottom,0px)+5.75rem)]' as const;

export const HC_MIJN_HCP_BOTTOM_PAD =
  'max-xl:pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+6rem))] xl:pb-6' as const;
