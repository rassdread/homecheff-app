import type { MarketplaceCategory, PendingAcceptedValueStatus } from '@prisma/client';

export type PendingAcceptedValueRecord = {
  id: string;
  taxonomyId: string;
  label: string;
  category: MarketplaceCategory;
  language: string;
  listingCount: number;
  userCount: number;
  firstUsedAt: string;
  lastUsedAt: string;
  status: PendingAcceptedValueStatus;
  approvedTaxonomyId: string | null;
};
