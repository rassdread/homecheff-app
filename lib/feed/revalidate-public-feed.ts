/**
 * Phase 3F — Targeted public feed cache invalidation.
 * No database access; safe to call after successful mutations.
 */

import { revalidateTag } from 'next/cache';
import { PUBLIC_FEED_CACHE_TAGS } from '@/lib/feed/feed-cache-keys';

let invalidationCount = 0;

export function revalidatePublicFeedCache(reason?: string): void {
  try {
    for (const tag of PUBLIC_FEED_CACHE_TAGS) {
      revalidateTag(tag);
    }
    invalidationCount += 1;
    if (process.env.NODE_ENV === 'development' && reason) {
      console.info('[feed-cache] revalidated public feed', { reason });
    }
  } catch (error) {
    console.error('[feed-cache] revalidatePublicFeedCache failed:', error);
  }
}

/** Test hook — invalidation count since process start. */
export function getPublicFeedInvalidationCount(): number {
  return invalidationCount;
}

export function isPublicFeedVisibleProduct(
  product: { isActive?: boolean | null } | null | undefined,
): boolean {
  return product?.isActive === true;
}

export function isPublicFeedVisibleDish(
  dish: { status?: string | null } | null | undefined,
): boolean {
  return dish?.status === 'PUBLISHED';
}

export function isPublicFeedVisibleListing(
  listing: { status?: string | null } | null | undefined,
): boolean {
  return listing?.status === 'ACTIVE';
}

/** Revalidate when a product was or is feed-visible (publish/unpublish/feed-field edits). */
export function shouldRevalidateAfterProductMutation(
  before: { isActive?: boolean | null } | null | undefined,
  after: { isActive?: boolean | null } | null | undefined,
): boolean {
  return (
    isPublicFeedVisibleProduct(before) || isPublicFeedVisibleProduct(after)
  );
}

export function shouldRevalidateAfterListingMutation(
  before: { status?: string | null } | null | undefined,
  after: { status?: string | null } | null | undefined,
): boolean {
  return (
    isPublicFeedVisibleListing(before) || isPublicFeedVisibleListing(after)
  );
}

export function shouldRevalidateAfterDishMutation(
  before: { status?: string | null } | null | undefined,
  after: { status?: string | null } | null | undefined,
): boolean {
  return isPublicFeedVisibleDish(before) || isPublicFeedVisibleDish(after);
}
