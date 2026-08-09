/**
 * Canonical public navigation hrefs (listing + profile).
 * Feed/profile UI surfaces should use these helpers — do not hand-roll paths.
 */

import { resolveFeedItemHref } from '@/lib/feed/feed-item-href';
import type { FeedClassifiable } from '@/lib/feed/feed-types';
import type { FeedTaxonomy } from '@/lib/feed/feed-taxonomy';
import { buildListingDetailHref } from '@/lib/seo/listing-routes';
import {
  getPublicProfileHref,
  publicProfileHref,
} from '@/lib/user/public-profile';

export { buildListingDetailHref, resolveFeedItemHref, getPublicProfileHref, publicProfileHref };

/** Canonical listing detail href from listing fields. */
export function getListingHref(input: {
  listingKind?: string | null;
  listingIntent?: string | null;
  title: string;
  place?: string | null;
  id: string;
}): string {
  return buildListingDetailHref(input);
}

/** Canonical listing href from a feed item. */
export function getFeedItemHref(
  item: FeedClassifiable,
  taxonomy?: FeedTaxonomy,
): string {
  return resolveFeedItemHref(item, taxonomy);
}
