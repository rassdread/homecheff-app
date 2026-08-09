import { cache } from 'react';
import { loadListingDetail } from '@/lib/marketplace/detail/load-listing-detail';

/** Dedupes listing loads within a single RSC request. */
export const loadListingDetailCached = cache(loadListingDetail);
