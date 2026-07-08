/**
 * Group accepted-value taxonomy ids by taxonomy group — Phase 8B.
 * Shared by detail, preview, and discovery filter UI.
 */

import { MARKETPLACE_ENTRY_CATEGORY_KEY } from '@/lib/marketplace/i18n-keys';
import type { MarketplaceCategory } from '@prisma/client';
import { taxonomyGroupLabelKey } from '@/lib/marketplace/taxonomy-i18n';
import { isPendingAcceptedValueId } from '@/lib/marketplace/pending-accepted-values/constants';
import { getMarketplaceTaxonomyItem } from '@/lib/marketplace/taxonomy-resolve';

export type AcceptedValueTaxonomyGroup = {
  groupId: string;
  groupLabelKey: string;
  itemIds: string[];
};

export function groupAcceptedTaxonomyIds(
  ids: string[],
  pendingCategories?: ReadonlyMap<string, import('@prisma/client').MarketplaceCategory>,
): AcceptedValueTaxonomyGroup[] {
  const byGroup = new Map<string, string[]>();

  for (const id of ids) {
    if (isPendingAcceptedValueId(id)) {
      const category = pendingCategories?.get(id) ?? 'PRACTICAL_SERVICE';
      const groupKey = `flat.${category}`;
      const list = byGroup.get(groupKey) ?? [];
      list.push(id);
      byGroup.set(groupKey, list);
      continue;
    }
    const item = getMarketplaceTaxonomyItem(id);
    if (!item?.allowedAsAcceptedValue) continue;
    const groupKey = item.parentId ?? `flat.${item.category}`;
    const list = byGroup.get(groupKey) ?? [];
    list.push(id);
    byGroup.set(groupKey, list);
  }

  return Array.from(byGroup.entries()).map(([groupId, itemIds]) => {
    if (groupId.startsWith('flat.')) {
      const category = groupId.slice(5) as MarketplaceCategory;
      return {
        groupId,
        groupLabelKey: MARKETPLACE_ENTRY_CATEGORY_KEY[category],
        itemIds,
      };
    }
    return {
      groupId,
      groupLabelKey: taxonomyGroupLabelKey(groupId),
      itemIds,
    };
  });
}
