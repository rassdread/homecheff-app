/**
 * Bottom tab bar reserve — keep scrollable content above fixed `BottomNavigation`
 * and in sync with `AppPageChrome` padding (`pb-[calc(5.75rem+…)]`).
 */
export const HC_BOTTOM_NAV_SCROLL_PADDING =
  'pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] sm:pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))]' as const;
