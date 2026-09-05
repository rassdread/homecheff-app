/**
 * Bottom tab bar reserve — keep scrollable content above fixed `BottomNavigation`.
 *
 * Runtime SSOT lives in `app/globals.css`:
 *   --hc-bottom-nav-height
 *   --hc-bottom-nav-offset (= height + safe-area)
 *
 * These Tailwind strings mirror that math for components that cannot use the
 * CSS variable in an arbitrary property (keep values aligned).
 */

export const HC_BOTTOM_NAV_SCROLL_PADDING =
  'max-xl:pb-[var(--hc-bottom-nav-offset)]' as const;

/** Fixed nav bar height (matches BottomNavigation + safe-area) — mobile/tablet only. */
export const HC_BOTTOM_NAV_OFFSET_CSS = 'var(--hc-bottom-nav-offset)' as const;

export const HC_BOTTOM_NAV_OFFSET_CSS_SM = 'var(--hc-bottom-nav-offset)' as const;

/** Tailwind arbitrary bottom for mobile chat panels above the tab bar. */
export const HC_MOBILE_CHAT_ABOVE_NAV_BOTTOM =
  'max-xl:bottom-[var(--hc-bottom-nav-offset)]' as const;

/** Sticky form footers — extra pad for bottom nav on max-xl only. */
export const HC_STICKY_FORM_FOOTER_PAD =
  'max-xl:pb-[var(--hc-bottom-nav-offset)] xl:pb-4' as const;

/** Page bottom pad when nav visible (sell/new, inspiratie detail, mijn-hcp). */
export const HC_PAGE_BOTTOM_NAV_PAD =
  'max-xl:pb-[var(--hc-bottom-nav-offset)]' as const;

export const HC_MIJN_HCP_BOTTOM_PAD =
  'max-xl:pb-[max(1.5rem,calc(var(--hc-bottom-nav-offset)+0.25rem))] xl:pb-6' as const;
