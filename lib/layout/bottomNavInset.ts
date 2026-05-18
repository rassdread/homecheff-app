/**
 * Bottom tab bar reserve — keep scrollable content above fixed `BottomNavigation`
 * and in sync with `AppPageChrome` padding (`pb-[calc(5.75rem+…)]`).
 */
export const HC_BOTTOM_NAV_SCROLL_PADDING =
  'pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] sm:pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))]' as const;

/** Fixed nav bar height (matches BottomNavigation + safe-area). */
export const HC_BOTTOM_NAV_OFFSET_CSS =
  'calc(5.5rem + env(safe-area-inset-bottom, 0px))' as const;

export const HC_BOTTOM_NAV_OFFSET_CSS_SM =
  'calc(5rem + env(safe-area-inset-bottom, 0px))' as const;

/** Tailwind arbitrary bottom for mobile chat panels above the tab bar. */
export const HC_MOBILE_CHAT_ABOVE_NAV_BOTTOM =
  'bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:bottom-[calc(5rem+env(safe-area-inset-bottom,0px))]' as const;
