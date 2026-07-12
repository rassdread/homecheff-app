/**
 * Phase 3A — documented feed candidate window.
 *
 * DB caps > enrichment cap > response cap so ranking, discovery dedup,
 * and pagination semantics stay intact without naïve take=10 at SQL layer.
 */

export const FEED_DB_PRODUCT_CAP = 60;
export const FEED_DB_LISTING_CAP = 35;
export const FEED_DB_DISH_CAP = 30;

/** Max marketplace items enriched (stats, trust, discovery attach). */
export const FEED_ENRICHMENT_POOL_CAP = 50;

/** Max items in one API response before pagination slice. */
export const FEED_RESPONSE_ITEM_CAP = 40;

/** Extra marketplace candidates for discovery ranking beyond visible page. */
export const FEED_DISCOVERY_BUFFER = 30;

const FEED_ENRICHMENT_POOL_MIN = 40;

/**
 * Enrichment pool scales with pagination so later pages retain enough candidates.
 * Capped at FEED_ENRICHMENT_POOL_CAP; never below FEED_ENRICHMENT_POOL_MIN on page 1.
 */
export function computeEnrichmentPoolCap(skip: number, take: number): number {
  const needed = skip + take + FEED_DISCOVERY_BUFFER;
  return Math.min(
    FEED_ENRICHMENT_POOL_CAP,
    Math.max(FEED_ENRICHMENT_POOL_MIN, needed),
  );
}

const SOURCE_PRIORITY: Record<string, number> = {
  PRODUCT: 3,
  LISTING: 2,
  DISH: 1,
};

function sourcePriority(feedSource: string | null | undefined): number {
  const key = String(feedSource ?? '').trim().toUpperCase();
  return SOURCE_PRIORITY[key] ?? 0;
}

export type CrossSourceDedupDrop = { id: string; feedSource: string };

export type FeedItemMediaFields = {
  image?: string | null;
  images?: string[] | null;
  videoUrl?: string | null;
  primaryVideoUrl?: string | null;
  videos?: Array<{ url: string; thumbnail?: string | null }> | null;
  Video?: { url: string; thumbnail?: string | null } | null;
};

function isEmptyMediaUrl(value: unknown): boolean {
  return value == null || (typeof value === 'string' && value.trim() === '');
}

function hasUsableImages(images: string[] | null | undefined): boolean {
  return Array.isArray(images) && images.some((u) => !isEmptyMediaUrl(u));
}

/**
 * Fill missing media on linked winner (PRODUCT) from donor (DISH).
 * Title, price, seller and taxonomy on winner stay authoritative.
 */
export function mergeLinkedFeedItemMedia<
  T extends FeedItemMediaFields,
>(winner: T, donor: FeedItemMediaFields): T {
  const merged = { ...winner };
  const donorImages = Array.isArray(donor.images)
    ? donor.images.filter((u) => !isEmptyMediaUrl(u))
    : [];

  if (isEmptyMediaUrl(merged.image) && !isEmptyMediaUrl(donor.image)) {
    merged.image = donor.image ?? null;
  }
  if (!hasUsableImages(merged.images) && donorImages.length > 0) {
    merged.images = donorImages;
    if (isEmptyMediaUrl(merged.image)) {
      merged.image = donorImages[0] ?? null;
    }
  }

  const donorVideo = donor.Video?.url
    ? donor.Video
    : donor.videos?.[0]
      ? { url: donor.videos[0].url, thumbnail: donor.videos[0].thumbnail ?? null }
      : null;

  if (
    isEmptyMediaUrl(merged.videoUrl) &&
    isEmptyMediaUrl(merged.primaryVideoUrl) &&
    !merged.Video?.url &&
    donorVideo?.url
  ) {
    merged.videoUrl = donorVideo.url;
    merged.primaryVideoUrl = donorVideo.url;
    merged.Video = {
      url: donorVideo.url,
      thumbnail: donorVideo.thumbnail ?? null,
    };
    if (!merged.videos?.length) {
      merged.videos = [
        { url: donorVideo.url, thumbnail: donorVideo.thumbnail ?? null },
      ];
    }
  }

  return merged;
}

export type LinkedDishMediaRow = {
  id: string;
  photos: Array<{ url: string }>;
  videos: Array<{ url: string; thumbnail: string | null }>;
};

/** Lightweight linked Dish media for Product rows excluded from full Dish fetch. */
export function linkedDishMediaToFeedFields(
  row: LinkedDishMediaRow,
): FeedItemMediaFields {
  const images = row.photos.map((p) => p.url).filter((u) => !isEmptyMediaUrl(u));
  const video = row.videos[0];
  return {
    image: images[0] ?? null,
    images,
    videoUrl: video?.url ?? null,
    primaryVideoUrl: video?.url ?? null,
    videos: video ? [{ url: video.url, thumbnail: video.thumbnail }] : [],
    Video: video ? { url: video.url, thumbnail: video.thumbnail } : null,
  };
}

/**
 * Linked Product↔Dish dual-write uses the same UUID. Prefer PRODUCT/LISTING
 * over DISH so one offer is not shown twice in the feed.
 */
export function deduplicateCrossSourceFeedItems<
  T extends { id: string; feedSource?: string | null } & FeedItemMediaFields,
>(items: T[]): { items: T[]; dropped: CrossSourceDedupDrop[] } {
  const winnerById = new Map<string, T>();
  const dropped: CrossSourceDedupDrop[] = [];

  for (const item of items) {
    const prev = winnerById.get(item.id);
    if (!prev) {
      winnerById.set(item.id, item);
      continue;
    }
    const prevSrc = String(prev.feedSource ?? '');
    const itemSrc = String(item.feedSource ?? '');
    if (sourcePriority(itemSrc) > sourcePriority(prevSrc)) {
      dropped.push({ id: item.id, feedSource: prevSrc });
      winnerById.set(item.id, mergeLinkedFeedItemMedia(item, prev));
    } else {
      dropped.push({ id: item.id, feedSource: itemSrc });
      winnerById.set(item.id, mergeLinkedFeedItemMedia(prev, item));
    }
  }

  const seen = new Set<string>();
  const ordered: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    ordered.push(winnerById.get(item.id)!);
    seen.add(item.id);
  }

  return { items: ordered, dropped };
}

/** Unique seller user IDs from feed items (stable order). */
export function collectUniqueSellerUserIds(
  items: Array<Record<string, unknown>>,
  extractSellerUserId: (item: Record<string, unknown>) => string | null,
  cap?: number,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const uid = extractSellerUserId(item);
    if (!uid || seen.has(uid)) continue;
    seen.add(uid);
    out.push(uid);
    if (cap != null && out.length >= cap) break;
  }
  return out;
}
