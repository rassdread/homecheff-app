import { sanitizeFeedImageList } from '@/lib/feed/sanitize-feed-response-media';

/** Movement below this is still a tap, not a swipe axis. */
export const FEED_PHOTO_SWIPE_LOCK_PX = 8;
/** Horizontal travel that changes the photo. Vertical travel never does. */
export const FEED_PHOTO_SWIPE_COMMIT_PX = 48;

export function collectFeedPhotoUrls(raw: Record<string, unknown>): string[] {
  const listingUrls = Array.isArray(raw.ListingMedia)
    ? raw.ListingMedia.map((row) =>
        row && typeof row === 'object' && 'url' in row
          ? (row as { url?: unknown }).url
          : null,
      )
    : [];
  const images = Array.isArray(raw.images) ? raw.images : [];
  return sanitizeFeedImageList([
    ...images,
    ...listingUrls,
    raw.photo,
    raw.image,
  ]);
}

export function classifyFeedPhotoGesture(
  dx: number,
  dy: number,
): 'horizontal' | 'vertical' | 'none' {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (ax < FEED_PHOTO_SWIPE_LOCK_PX && ay < FEED_PHOTO_SWIPE_LOCK_PX) {
    return 'none';
  }
  return ax > ay ? 'horizontal' : 'vertical';
}

/** Swipe left advances. A vertical move stays on the same photo. */
export function feedPhotoStepFromSwipe(dx: number, dy: number): -1 | 0 | 1 {
  if (classifyFeedPhotoGesture(dx, dy) !== 'horizontal') return 0;
  if (Math.abs(dx) < FEED_PHOTO_SWIPE_COMMIT_PX) return 0;
  return dx < 0 ? 1 : -1;
}

export function feedPhotoIndexAfterMove(
  index: number,
  count: number,
  delta: -1 | 1,
): number {
  if (count <= 1) return 0;
  const current = Math.min(Math.max(index, 0), count - 1);
  return Math.min(Math.max(current + delta, 0), count - 1);
}
