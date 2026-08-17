/**
 * PX.4A.4 — same-tab HomeCheff listing draft snapshot.
 * Survives a round-trip to studio.homecheff.eu in this tab.
 * Does not contain composition, music, or video-only extras.
 */

export const PX4A_ITEM_FORM_DRAFT_KEY = 'hc-px4a-item-form:v1';
export const PX4A_ITEM_FORM_DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

export type Px4aItemFormDraft = {
  v: 1;
  savedAt: number;
  listingIntent: string;
  marketplaceCategory: string;
  specializations: string[];
  acceptedSpecializations: string[];
  barterOpenness: string;
  title: string;
  description: string;
  price: string;
  priceModel: string;
  acceptHomeCheffPayment: boolean;
  acceptDirectContact: boolean;
  fulfillment: unknown;
  sellerCanDeliver: boolean;
  deliveryRadiusKm: string;
  useProfileLocation: boolean;
  placeName: string;
  pickupAddress: string;
  pickupLat: number | null;
  pickupLng: number | null;
  coordsSource: string;
  stock: string;
  maxStock: string;
  isActive: boolean;
  images: { url: string }[];
  video: { url: string; thumbnail?: string | null; duration?: number | null } | null;
  allergens: string[];
  allergensConfirmed: boolean;
  sellerContributionTypes: string[];
  sellerContributionNote: string;
  madeToConsumerSpecifications: boolean;
  rapidlyPerishable: boolean;
};

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function writePx4aItemFormDraft(draft: Omit<Px4aItemFormDraft, 'v' | 'savedAt'>): boolean {
  if (!isBrowser()) return false;
  try {
    const payload: Px4aItemFormDraft = {
      ...draft,
      v: 1,
      savedAt: Date.now(),
      images: draft.images
        .map((image) => ({ url: String(image.url ?? '').trim() }))
        .filter((image) => image.url.startsWith('https://')),
    };
    window.sessionStorage.setItem(PX4A_ITEM_FORM_DRAFT_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function readPx4aItemFormDraft(now = Date.now()): Px4aItemFormDraft | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.sessionStorage.getItem(PX4A_ITEM_FORM_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Px4aItemFormDraft;
    if (!parsed || parsed.v !== 1 || !Number.isFinite(parsed.savedAt)) return null;
    if (now - parsed.savedAt > PX4A_ITEM_FORM_DRAFT_TTL_MS) {
      clearPx4aItemFormDraft();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPx4aItemFormDraft(): void {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.removeItem(PX4A_ITEM_FORM_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}
