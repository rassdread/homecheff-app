import type { MarketplaceCategory, ProductCategory } from '@prisma/client';
import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import { deriveListingKind } from '@/lib/marketplace/listing-kind/derive-listing-kind';
import type { ProposalCategory } from '@prisma/client';
import type { CommunityOrderDTO, ProposalDTO } from '@/lib/proposals/proposal-types';

const CATEGORY_TO_KIND: Record<ProposalCategory, ListingKind> = {
  PRODUCT: 'PRODUCT',
  SERVICE: 'SERVICE',
  TASK: 'TASK',
  REQUEST: 'REQUEST',
};

export type AgreementProductContext = {
  marketplaceCategory: MarketplaceCategory | null;
  listingIntent: string | null;
  specializations: string[];
  subcategory: string | null;
  category: ProductCategory | null;
} | null;

export function resolveAgreementDisplayKind(input: {
  proposal: ProposalDTO;
  product?: AgreementProductContext;
  deliveryRequired?: boolean;
}): ListingKind | 'DELIVERY' {
  if (input.deliveryRequired) return 'DELIVERY';

  if (input.product) {
    const derived = deriveListingKind({
      marketplaceCategory: input.product.marketplaceCategory,
      listingIntent: input.product.listingIntent,
      specializations: input.product.specializations,
      subcategory: input.product.subcategory,
      category: input.product.category,
    });
    return derived.listingKind === 'INSPIRATION'
      ? CATEGORY_TO_KIND[input.proposal.category]
      : derived.listingKind;
  }

  return CATEGORY_TO_KIND[input.proposal.category];
}

export function agreementKindLabelKey(
  kind: ListingKind | 'DELIVERY',
): string {
  return `marketplace.agreements.kind.${kind}`;
}

export function isDeliveryDeal(communityOrder: CommunityOrderDTO): boolean {
  return (
    communityOrder.fulfillmentMode === 'DELIVERY' ||
    communityOrder.deliveryRequested
  );
}
