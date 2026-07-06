import type { MarketplaceCategory } from '@prisma/client';
import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';

export type ListingKindEntityType =
  | 'product'
  | 'dish'
  | 'listing'
  | 'workspace';

export type DeriveListingKindInput = {
  /** Source entity — dishes always resolve to INSPIRATION. */
  entityType?: ListingKindEntityType | null;
  listingIntent?: string | null;
  marketplaceCategory?: MarketplaceCategory | string | null;
  specializations?: string[] | null;
  /** Legacy subcategory / single taxonomy id. */
  subcategory?: string | null;
  /** Legacy Product.category (CHEFF | GROWN | DESIGNER). */
  category?: string | null;
  fulfillmentOptions?: unknown;
  /** Feed/API source hint (PRODUCT | LISTING | DISH). */
  feedSource?: string | null;
  type?: string | null;
};

export type DeriveListingKindResult = {
  listingKind: ListingKind;
  /** Human-readable derivation path for audits. */
  derivationPath: string;
};
