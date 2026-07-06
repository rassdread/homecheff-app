/**
 * Shared feed item shapes (Fase 5D).
 */

import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import type { FeedTaxonomy } from '@/lib/feed/feed-taxonomy';

export type FeedClassifiable = {
  id: string;
  priceCents: number | null;
  orderMethod?: string | null;
  listingIntent?: string | null;
  priceModel?: string | null;
  feedSource?: string | null;
  type?: string | null;
  isRecipe?: boolean | null;
  isInspiration?: boolean | null;
  ownerId?: string | null;
  category?: string | null;
  title?: string | null;
  place?: string | null;
  marketplaceCategory?: string | null;
  specializations?: string[] | null;
  subcategory?: string | null;
  /** Canonical derived classification (Phase 1 ListingKind). */
  listingKind?: ListingKind;
  taxonomy?: FeedTaxonomy;
};
