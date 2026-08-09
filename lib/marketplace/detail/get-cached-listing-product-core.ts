/**
 * Request-scoped + short cross-request cached product core for listing RSC.
 */

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { resolveProductIdFromParam } from '@/lib/seo/productSlug';
import {
  fetchListingProductCoreUncached,
  listingProductCacheTag,
} from '@/lib/marketplace/detail/listing-product-core';

export { listingProductCacheTag } from '@/lib/marketplace/detail/listing-product-core';
export {
  fetchListingProductCore,
  type ListingProductCore,
} from '@/lib/marketplace/detail/listing-product-core';

/**
 * Dedupes within one request (React.cache) and across requests (unstable_cache 30s).
 */
export const getCachedListingProductCore = cache(async (rawId: string) => {
  const id = resolveProductIdFromParam(rawId);
  if (!id) return null;
  return unstable_cache(
    () => fetchListingProductCoreUncached(id),
    ['listing-product-core', id],
    { revalidate: 30, tags: [listingProductCacheTag(id)] },
  )();
});
