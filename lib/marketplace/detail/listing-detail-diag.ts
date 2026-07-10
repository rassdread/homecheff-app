/**
 * Development-only diagnostics for listing detail fetch (no production UI).
 * Opt-in on staging: localStorage.setItem('hc_listing_detail_diag', '1')
 */

export type ListingDetailDiagPayload = Record<string, unknown>;

function diagEnabled(): boolean {
  if (process.env.NODE_ENV === 'development') return true;
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage?.getItem('hc_listing_detail_diag') === '1';
  } catch {
    return false;
  }
}

export function listingDetailDiag(
  event: string,
  payload?: ListingDetailDiagPayload,
): void {
  if (!diagEnabled()) return;
  if (typeof console === 'undefined') return;
  const line = { event, ...payload };
  if (console.debug) {
    console.debug('[listing-detail]', line);
  } else {
    console.log('[listing-detail]', line);
  }
}
