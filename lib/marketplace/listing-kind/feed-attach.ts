import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import {
  buildListingKindInputFromFeedItem,
  deriveListingKind,
} from './derive-listing-kind';

export type FeedListingKindAttachable = {
  listingKind?: ListingKind;
  feedSource?: string | null;
  type?: string | null;
  listingIntent?: string | null;
  marketplaceCategory?: string | null;
  specializations?: string[] | null;
  subcategory?: string | null;
  category?: string | null;
  fulfillmentOptions?: unknown;
  entityType?: string | null;
};

export function attachListingKind<T extends FeedListingKindAttachable>(
  item: T,
): T & { listingKind: ListingKind } {
  if (item.listingKind) {
    return item as T & { listingKind: ListingKind };
  }

  const input = buildListingKindInputFromFeedItem(
    item as Record<string, unknown>,
  );
  const { listingKind } = deriveListingKind(input);
  return { ...item, listingKind };
}

export function attachListingKindToRecord(
  item: Record<string, unknown>,
): ListingKind {
  const attached = attachListingKind(item as FeedListingKindAttachable);
  item.listingKind = attached.listingKind;
  return attached.listingKind;
}
