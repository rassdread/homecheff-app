/**
 * PX.4A.4 — same-tab HomeCheff listing draft snapshot.
 * Survives a round-trip to studio.homecheff.eu in this tab.
 * Does not contain composition, music, or video-only extras.
 *
 * Clear sites (only):
 * - successful listing publish
 * - TTL expiry (24h)
 * - corrupt / unreadable snapshot
 * - confirmed logout (authenticated → unauthenticated)
 *
 * Must NOT be cleared on Studio departure, return, cancel, Video gebruiken,
 * browser Back, chooser remount, or ordinary refresh while recoverable.
 */

import type { MarketplaceCategory } from '@prisma/client';
import type { ListingIntentValue } from '@/lib/marketplace/listing-taxonomy';
import { parseMarketplaceCategoryParam } from '@/lib/marketplace/listing-taxonomy';

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

export type Px4aItemFormDraftInput = Omit<Px4aItemFormDraft, 'v' | 'savedAt'>;

export type Px4aItemEntryResume = {
  listingIntent: ListingIntentValue;
  marketplaceCategory: MarketplaceCategory;
  specializations: string[];
};

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function httpsListingImageUrls(images: { url?: string }[] | undefined): { url: string }[] {
  if (!Array.isArray(images)) return [];
  const urls: { url: string }[] = [];
  const seen = new Set<string>();
  for (const image of images) {
    const url = String(image?.url ?? '').trim();
    if (!url.startsWith('https://') || seen.has(url)) continue;
    seen.add(url);
    urls.push({ url });
  }
  return urls;
}

export function serializableListingVideo(
  video: Px4aItemFormDraft['video'] | { url?: string; thumbnail?: string | null; duration?: number | null } | null | undefined,
): Px4aItemFormDraft['video'] {
  const url = String(video?.url ?? '').trim();
  if (!url.startsWith('https://')) return null;
  return {
    url,
    thumbnail: video?.thumbnail ? String(video.thumbnail) : null,
    duration: typeof video?.duration === 'number' && Number.isFinite(video.duration) ? video.duration : null,
  };
}

export function isPx4aItemFormDraftPopulated(draft: Pick<Px4aItemFormDraft, 'title' | 'description' | 'images' | 'video'>): boolean {
  return (
    Boolean(String(draft.title ?? '').trim()) ||
    Boolean(String(draft.description ?? '').trim()) ||
    httpsListingImageUrls(draft.images).length > 0 ||
    Boolean(serializableListingVideo(draft.video)?.url)
  );
}

export function entryResultFromPx4aItemFormDraft(
  draft: Pick<Px4aItemFormDraft, 'listingIntent' | 'marketplaceCategory' | 'specializations'> | null,
): Px4aItemEntryResume | null {
  if (!draft) return null;
  const listingIntent: ListingIntentValue | null =
    draft.listingIntent === 'REQUEST' ? 'REQUEST' : draft.listingIntent === 'OFFER' ? 'OFFER' : null;
  const marketplaceCategory = parseMarketplaceCategoryParam(draft.marketplaceCategory);
  const specializations = Array.isArray(draft.specializations)
    ? draft.specializations.map(String).filter(Boolean)
    : [];
  if (!listingIntent || !marketplaceCategory || specializations.length === 0) return null;
  return { listingIntent, marketplaceCategory, specializations };
}

function normalizeDraft(draft: Px4aItemFormDraftInput, savedAt = Date.now()): Px4aItemFormDraft {
  return {
    ...draft,
    v: 1,
    savedAt,
    images: httpsListingImageUrls(draft.images),
    video: serializableListingVideo(draft.video),
  };
}

export function writePx4aItemFormDraft(draft: Px4aItemFormDraftInput): boolean {
  if (!isBrowser()) return false;
  const payload = normalizeDraft(draft);
  if (!isPx4aItemFormDraftPopulated(payload)) {
    return false;
  }
  try {
    window.sessionStorage.setItem(PX4A_ITEM_FORM_DRAFT_KEY, JSON.stringify(payload));
    const roundTrip = readPx4aItemFormDraft();
    return Boolean(roundTrip && roundTrip.savedAt === payload.savedAt);
  } catch {
    return false;
  }
}

/**
 * Browser Back from Studio reloads /sell/new without ?px4a=.
 * SessionStorage is the source of truth; the query string only distinguishes
 * cancel vs ready. Restore whenever a valid same-tab snapshot exists.
 */
export function shouldRestorePx4aItemFormDraft(now = Date.now()): boolean {
  return readPx4aItemFormDraft(now) != null;
}

export function readPx4aItemFormDraft(now = Date.now()): Px4aItemFormDraft | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.sessionStorage.getItem(PX4A_ITEM_FORM_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Px4aItemFormDraft;
    if (!parsed || parsed.v !== 1 || !Number.isFinite(parsed.savedAt)) {
      clearPx4aItemFormDraft();
      return null;
    }
    if (now - parsed.savedAt > PX4A_ITEM_FORM_DRAFT_TTL_MS) {
      clearPx4aItemFormDraft();
      return null;
    }
    return {
      ...parsed,
      images: httpsListingImageUrls(parsed.images),
      video: serializableListingVideo(parsed.video),
    };
  } catch {
    clearPx4aItemFormDraft();
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
