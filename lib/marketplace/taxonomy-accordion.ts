/**
 * Helpers for the service-category accordion picker.
 * Groups stay collapsed until opened; selected groups may remain open.
 */

import type { MarketplaceCategory } from '@prisma/client';
import {
  getEntryFlowItemsForGroup,
  getMarketplaceTaxonomyGroupsByCategory,
  getMarketplaceTaxonomyItem,
  type TaxonomyEntryRole,
} from './taxonomy-resolve';
import type { MarketplaceTaxonomyItem } from './taxonomy-types';

export const SERVICE_MARKETPLACE_CATEGORIES: readonly MarketplaceCategory[] = [
  'DESIGN',
  'ARTISTIC_SERVICE',
  'PRACTICAL_SERVICE',
  'KNOWLEDGE',
];

/** Display order for the combined service accordion (create flow). */
export const SERVICE_ACCORDION_GROUP_ORDER = [
  'grp.artistic.music',
  'grp.design.media',
  'grp.design.web',
  'grp.design.brand',
  'grp.knowledge.all',
  'grp.artistic.body',
  'grp.artistic.visual',
  'grp.practical.household',
  'grp.practical.all',
] as const;

export const STUDIO_SESSION_TAXONOMY_ID = 'artistic.studio_session';

export function isServiceMarketplaceCategory(
  category: MarketplaceCategory | null | undefined,
): boolean {
  return !!category && SERVICE_MARKETPLACE_CATEGORIES.includes(category);
}

export function isStudioSessionTaxonomyId(id: string): boolean {
  return id === STUDIO_SESSION_TAXONOMY_ID;
}

export function selectionIncludesStudioSession(ids: string[]): boolean {
  return ids.includes(STUDIO_SESSION_TAXONOMY_ID);
}

export function taxonomyItemRequiresCustomLabel(id: string): boolean {
  return getMarketplaceTaxonomyItem(id)?.requiresCustomLabel === true;
}

export function selectionRequiresCustomLabel(ids: string[]): boolean {
  return ids.some(taxonomyItemRequiresCustomLabel);
}

export function preferredPriceModelForSpecializations(
  ids: string[],
): 'HOURLY' | null {
  if (selectionIncludesStudioSession(ids)) return 'HOURLY';
  return null;
}

/** Group ids that contain any of the selected item ids — used to keep selection visible. */
export function accordionGroupsForSelection(
  category: MarketplaceCategory,
  selectedIds: string[],
  role: TaxonomyEntryRole = 'offer',
  groups?: MarketplaceTaxonomyItem[],
): string[] {
  if (selectedIds.length === 0) return [];
  const selected = new Set(selectedIds);
  const source = groups ?? getMarketplaceTaxonomyGroupsByCategory(category);
  const open: string[] = [];
  for (const group of source) {
    const items = getEntryFlowItemsForGroup(group.id, role);
    if (items.some((item) => selected.has(item.id))) {
      open.push(group.id);
    }
  }
  return open;
}

export function accordionGroupIdForTaxonomyId(id: string): string | null {
  const item = getMarketplaceTaxonomyItem(id);
  return item?.parentId ?? null;
}

export function getServiceAccordionGroups(): MarketplaceTaxonomyItem[] {
  return SERVICE_ACCORDION_GROUP_ORDER.map((id) => getMarketplaceTaxonomyItem(id)).filter(
    (entry): entry is MarketplaceTaxonomyItem => !!entry && entry.level === 'group',
  );
}

/** Groups shown after the user picks an offer type — services share one accordion. */
export function getOfferAccordionGroups(
  category: MarketplaceCategory,
): MarketplaceTaxonomyItem[] {
  if (isServiceMarketplaceCategory(category)) {
    return getServiceAccordionGroups();
  }
  return getMarketplaceTaxonomyGroupsByCategory(category);
}

/** Show in-group search only when an opened group would still be a long chip wall. */
export const ACCORDION_GROUP_SEARCH_MIN_ITEMS = 10;

export function accordionGroupNeedsSearch(itemCount: number): boolean {
  return itemCount >= ACCORDION_GROUP_SEARCH_MIN_ITEMS;
}

export function filterAccordionGroupItems<T extends { id: string; searchTerms?: string[] }>(
  items: T[],
  query: string,
  selectedIds: string[],
  labelFor: (id: string) => string,
): T[] {
  const term = query.trim().toLowerCase();
  if (!term) return items;
  return items.filter((item) => {
    if (selectedIds.includes(item.id)) return true;
    const blob = [item.id, labelFor(item.id), ...(item.searchTerms ?? [])]
      .join(' ')
      .toLowerCase();
    return blob.includes(term);
  });
}

export function marketplaceCategoryFromSpecializations(
  ids: string[],
  fallback: MarketplaceCategory,
): MarketplaceCategory {
  for (let i = ids.length - 1; i >= 0; i -= 1) {
    const category = getMarketplaceTaxonomyItem(ids[i])?.category;
    if (category) return category;
  }
  return fallback;
}

/** Keep specializations within one MarketplaceCategory (API constraint). */
export function constrainSpecializationsToOneCategory(ids: string[]): string[] {
  if (ids.length <= 1) return ids;
  const last = ids[ids.length - 1];
  const category = getMarketplaceTaxonomyItem(last)?.category;
  if (!category) return ids;
  return ids.filter((id) => getMarketplaceTaxonomyItem(id)?.category === category);
}
