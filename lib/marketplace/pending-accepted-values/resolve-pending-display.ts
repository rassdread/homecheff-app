import type { MarketplaceCategory } from '@prisma/client';
import { MARKETPLACE_ENTRY_CATEGORY_KEY } from '@/lib/marketplace/i18n-keys';
import {
  getMarketplaceTaxonomyItem,
  isMarketplaceTaxonomyItemAllowedAsAcceptedValue,
} from '@/lib/marketplace/taxonomy-resolve';
import type { TaxonomyTone } from '@/lib/marketplace/taxonomy-types';
import {
  isPendingAcceptedValueId,
  parsePendingAcceptedValueDbId,
} from './constants';
import type { PendingAcceptedValueRecord } from './types';

const CATEGORY_ICON: Record<MarketplaceCategory, { icon: string; tone: TaxonomyTone }> = {
  CREATE: { icon: 'UtensilsCrossed', tone: 'food' },
  GROW: { icon: 'Sprout', tone: 'garden' },
  DESIGN: { icon: 'PenTool', tone: 'creative' },
  ARTISTIC_SERVICE: { icon: 'Sparkles', tone: 'artistic' },
  PRACTICAL_SERVICE: { icon: 'Wrench', tone: 'service' },
  KNOWLEDGE: { icon: 'GraduationCap', tone: 'knowledge' },
};

export type ResolvedPendingAcceptedValue = {
  kind: 'pending';
  id: string;
  dbId: string;
  label: string;
  category: MarketplaceCategory;
  categoryLabelKey: string;
  icon: string;
  tone: TaxonomyTone;
};

export type ResolvedOfficialAcceptedValue = {
  kind: 'official';
  id: string;
  labelKey: string;
  icon: string;
  tone: TaxonomyTone;
};

export type ResolvedAcceptedValueEntry =
  | ResolvedOfficialAcceptedValue
  | ResolvedPendingAcceptedValue;

export function resolvePendingAcceptedValueDisplay(
  taxonomyId: string,
  registry: ReadonlyMap<string, PendingAcceptedValueRecord> | null | undefined,
): ResolvedPendingAcceptedValue | null {
  if (!isPendingAcceptedValueId(taxonomyId)) return null;
  const dbId = parsePendingAcceptedValueDbId(taxonomyId);
  if (!dbId) return null;
  const record = registry?.get(taxonomyId);
  if (!record) {
    return {
      kind: 'pending',
      id: taxonomyId,
      dbId,
      label: dbId,
      category: 'PRACTICAL_SERVICE',
      categoryLabelKey: MARKETPLACE_ENTRY_CATEGORY_KEY.PRACTICAL_SERVICE,
      icon: 'Tag',
      tone: 'service',
    };
  }
  const meta = CATEGORY_ICON[record.category];
  return {
    kind: 'pending',
    id: taxonomyId,
    dbId: record.id,
    label: record.label,
    category: record.category,
    categoryLabelKey: MARKETPLACE_ENTRY_CATEGORY_KEY[record.category],
    icon: meta.icon,
    tone: meta.tone,
  };
}

export function resolveAcceptedValueEntry(
  id: string,
  registry?: ReadonlyMap<string, PendingAcceptedValueRecord> | null,
): ResolvedAcceptedValueEntry | null {
  if (isPendingAcceptedValueId(id)) {
    return resolvePendingAcceptedValueDisplay(id, registry);
  }
  if (!isMarketplaceTaxonomyItemAllowedAsAcceptedValue(id)) return null;
  const item = getMarketplaceTaxonomyItem(id);
  if (!item) return null;
  return {
    kind: 'official',
    id: item.id,
    labelKey: item.labelKey,
    icon: item.icon,
    tone: item.tone,
  };
}

export function acceptedValueIdAllowed(id: string): boolean {
  if (isPendingAcceptedValueId(id)) return true;
  return isMarketplaceTaxonomyItemAllowedAsAcceptedValue(id);
}
