/** Home returns to the ordinary feed. A delivery panel on `/` is not Home. */

export const OPEN_DELIVERY_REQUEST_EVENT = 'hc-open-delivery-request';
export const CLOSE_DELIVERY_REQUEST_EVENT = 'hc-close-delivery-request';
export const FEED_SCROLL_STORAGE_KEY = 'hc-feed-scroll-before-delivery';

export function deliveryRequestSearchOpen(search: string): boolean {
  const withoutHash = search.split('#')[0] ?? '';
  const raw = withoutHash.startsWith('?') ? withoutHash.slice(1) : withoutHash;
  return new URLSearchParams(raw).get('bezorging') === '1';
}

/** First Home click must leave the delivery panel when the path is already `/`. */
export function homeClickShouldLeaveDeliveryView(pathname: string, search: string): boolean {
  return pathname === '/' && deliveryRequestSearchOpen(search);
}

export function rememberFeedScroll(): void {
  if (typeof window === 'undefined') return;
  const desktop = window.matchMedia('(min-width: 1024px)').matches;
  const desktopFeed = document.getElementById('homecheff-feed-desktop');
  const y = desktop && desktopFeed ? desktopFeed.scrollTop : window.scrollY;
  window.sessionStorage.setItem(FEED_SCROLL_STORAGE_KEY, String(y));
}

export function restoreFeedScroll(): void {
  if (typeof window === 'undefined') return;
  const raw = window.sessionStorage.getItem(FEED_SCROLL_STORAGE_KEY);
  if (raw == null) return;
  const y = Number(raw);
  if (!Number.isFinite(y)) return;
  window.requestAnimationFrame(() => {
    const desktop = window.matchMedia('(min-width: 1024px)').matches;
    const desktopFeed = document.getElementById('homecheff-feed-desktop');
    if (desktop && desktopFeed) desktopFeed.scrollTop = y;
    else window.scrollTo(0, y);
  });
}

export function markDeliveryRequestOpen(): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.set('bezorging', '1');
  const hash = url.hash || '#homecheff-feed';
  window.history.replaceState(null, '', `${url.pathname}${url.search}${hash}`);
  window.dispatchEvent(new Event(OPEN_DELIVERY_REQUEST_EVENT));
}

export function markDeliveryRequestClosed(): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.delete('bezorging');
  url.searchParams.delete('request');
  const hash = url.hash || '#homecheff-feed';
  window.history.replaceState(null, '', `${url.pathname}${url.search}${hash}`);
  window.dispatchEvent(new Event(CLOSE_DELIVERY_REQUEST_EVENT));
  restoreFeedScroll();
}
