/** Sticky offset when mobile header is still visible (matches --hc-navbar-height). */
export const MOBILE_FEED_FILTER_STICKY_BELOW_NAV =
  'top-[calc(var(--hc-navbar-height,4rem)+env(safe-area-inset-top,0px))]';

/** Sticky offset when header has scrolled away. */
export const MOBILE_FEED_FILTER_STICKY_TOP = 'top-0';
