/**
 * Phase 13N — instant back-navigation to listing detail (sessionStorage).
 * Mirrors home-feed-return-cache philosophy: show last-known content immediately.
 */

const PREFIX = 'hc_listing_detail_return:';
const TTL_MS = 5 * 60 * 1000;

export type ListingDetailReturnSnapshot = {
  product: unknown;
  stats: unknown;
  reviews: unknown[];
  sellerBadges: unknown[];
  discoveryTrust: unknown;
  dishInfo: unknown;
  linkedInspiration: unknown;
  publicContactChannels: unknown[];
  checkoutAvailable: boolean;
  paymentStatus: unknown;
  isBusiness: boolean;
  companyName: string | null;
  savedAt: number;
};

function storageKey(listingId: string): string {
  return `${PREFIX}${listingId}`;
}

export function saveListingDetailReturnCache(
  listingId: string,
  snapshot: Omit<ListingDetailReturnSnapshot, 'savedAt'>,
): void {
  if (typeof sessionStorage === 'undefined' || !listingId) return;
  try {
    sessionStorage.setItem(
      storageKey(listingId),
      JSON.stringify({ ...snapshot, savedAt: Date.now() }),
    );
  } catch {
    /* quota */
  }
}

export function readListingDetailReturnCache(
  listingId: string,
): ListingDetailReturnSnapshot | null {
  if (typeof sessionStorage === 'undefined' || !listingId) return null;
  try {
    const raw = sessionStorage.getItem(storageKey(listingId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ListingDetailReturnSnapshot;
    if (Date.now() - parsed.savedAt > TTL_MS) {
      sessionStorage.removeItem(storageKey(listingId));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
