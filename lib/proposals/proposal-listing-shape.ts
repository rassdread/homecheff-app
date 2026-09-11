/**
 * Product vs service shape for proposal forms — drives which fields matter.
 */
import { isServiceListingKind } from '@/lib/feed/marketplace-sale';

const SERVICE_MARKETPLACE_CATEGORIES = new Set([
  'ARTISTIC_SERVICE',
  'PRACTICAL_SERVICE',
]);

export type ProposalListingShape = 'PRODUCT' | 'SERVICE';

export function resolveProposalListingShape(input: {
  marketplaceCategory?: string | null;
  listingKind?: string | null;
  priceModel?: string | null;
  category?: string | null;
}): ProposalListingShape {
  if (isServiceListingKind(input.listingKind)) return 'SERVICE';
  const cat = String(input.marketplaceCategory ?? '').trim().toUpperCase();
  if (SERVICE_MARKETPLACE_CATEGORIES.has(cat)) return 'SERVICE';
  const proposalCat = String(input.category ?? '').trim().toUpperCase();
  if (proposalCat === 'SERVICE') return 'SERVICE';
  const priceModel = String(input.priceModel ?? '').trim().toUpperCase();
  if (
    priceModel === 'HOURLY' ||
    priceModel === 'SESSION' ||
    priceModel === 'PER_SESSION'
  ) {
    return 'SERVICE';
  }
  return 'PRODUCT';
}

export function proposalShowsQuantityField(shape: ProposalListingShape): boolean {
  return shape === 'PRODUCT';
}

export function proposalShowsFulfillmentField(
  shape: ProposalListingShape,
  fulfillmentOptionsCount: number,
): boolean {
  if (shape === 'SERVICE') {
    // Services only show pickup/delivery when the listing actually offers them.
    return fulfillmentOptionsCount > 0;
  }
  return fulfillmentOptionsCount > 0;
}
