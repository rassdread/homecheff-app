import type { BarterOpenness } from '@prisma/client';
import type { ProfileV2AanbodFilter } from '@/lib/profile/profile-v2/types';
import {
  dbCategoryToFormCategory,
  profileSlugToDbCategory,
  type OfferingProfileSlug,
} from '@/lib/create/offering-vertical';
import { deriveListingKind } from './derive-listing-kind';
import type { DeriveListingKindInput } from './types';

export type ProfileListingFilterInput = DeriveListingKindInput & {
  barterOpenness?: BarterOpenness | string | null;
  /** Legacy Product.category for vertical filters. */
  category?: string | null;
};

function isTradeListing(input: ProfileListingFilterInput): boolean {
  const openness = String(input.barterOpenness ?? '').trim().toUpperCase();
  return openness === 'BARTER_ONLY' || openness === 'MONEY_AND_BARTER';
}

function matchesVerticalFilter(
  input: ProfileListingFilterInput,
  slug: OfferingProfileSlug,
): boolean {
  const dbCategory = profileSlugToDbCategory(slug);
  const productCategory = String(input.category ?? '').trim().toUpperCase();
  return productCategory === dbCategory;
}

/**
 * Profile Aanbod filter — vertical (chef/garden/designer) or ListingKind-based.
 * Does not affect sort order; filter only.
 */
export function matchesProfileAanbodFilter(
  input: ProfileListingFilterInput,
  filter: ProfileV2AanbodFilter,
): boolean {
  if (filter === 'all') return true;

  if (filter === 'chef' || filter === 'garden' || filter === 'designer') {
    return matchesVerticalFilter(input, filter);
  }

  if (filter === 'trade') {
    return isTradeListing(input);
  }

  const { listingKind } = deriveListingKind(input);

  switch (filter) {
    case 'products':
      return listingKind === 'PRODUCT';
    case 'services':
      return listingKind === 'SERVICE';
    case 'tasks':
      return listingKind === 'TASK';
    case 'workshops':
      return listingKind === 'WORKSHOP';
    case 'coaching':
      return listingKind === 'COACHING';
    case 'help':
      return listingKind === 'REQUEST';
    default:
      return true;
  }
}

/** Map legacy form category to vertical slug for combined filters. */
export function legacyCategoryToProfileSlug(
  category: string | null | undefined,
): OfferingProfileSlug | null {
  const form = dbCategoryToFormCategory(category);
  if (!form) return null;
  if (form === 'CHEFF') return 'chef';
  if (form === 'GARDEN') return 'garden';
  return 'designer';
}
