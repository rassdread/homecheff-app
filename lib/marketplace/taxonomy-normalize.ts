/**
 * Normalize specialization / taxonomy id lists to canonical registry ids.
 */

import type { MarketplaceCategory } from '@prisma/client';
import {
  legacySpecializationToTaxonomyId,
  legacySpecializationsToTaxonomyIds,
} from './taxonomy-migrate';
import { legacyDutchSubcategoryToTaxonomyId } from './legacy-subcategory-map';
import {
  getMarketplaceTaxonomyItem,
  getMarketplaceTaxonomyRegistryMap,
  isMarketplaceTaxonomyItemAllowedAsAcceptedValue,
} from './taxonomy-resolve';

function parseRawSpecializationList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((v): v is string => typeof v === 'string');
  }
  if (typeof raw === 'string' && raw.trim()) {
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

/** Map legacy slug or canonical id → validated taxonomy item id */
export function toCanonicalTaxonomyId(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.includes('.')) {
    const item = getMarketplaceTaxonomyItem(trimmed);
    return item && item.level === 'item' && !item.blocked && !item.futureOnly
      ? item.id
      : null;
  }
  const dariDutch = legacyDutchSubcategoryToTaxonomyId(trimmed);
  if (dariDutch) return dariDutch;
  return legacySpecializationToTaxonomyId(trimmed);
}

/**
 * Normalize mixed legacy/canonical specialization values to canonical taxonomy ids.
 * Drops unknown, blocked, and futureOnly entries.
 */
export function normalizeTaxonomyIds(
  raw: unknown,
  category?: MarketplaceCategory | null,
): string[] {
  const parsed = parseRawSpecializationList(raw);
  const ids = parsed
    .map(toCanonicalTaxonomyId)
    .filter((id): id is string => id != null);

  const unique = [...new Set(ids.length > 0 ? ids : legacySpecializationsToTaxonomyIds(parsed))];

  if (!category) return unique;

  return unique.filter((id) => {
    const item = getMarketplaceTaxonomyRegistryMap().get(id);
    return item?.category === category && item.level === 'item';
  });
}

/** @deprecated Alias — use normalizeTaxonomyIds */
export function normalizeSpecializations(
  raw: unknown,
  category?: MarketplaceCategory | null,
): string[] {
  return normalizeTaxonomyIds(raw, category);
}

export function primarySpecialization(specializations: string[]): string | null {
  return specializations[0] ?? null;
}

export function normalizeSpecializationSlug(slug: string): string {
  const canonical = toCanonicalTaxonomyId(slug);
  return canonical ?? slug.trim().toLowerCase();
}

/** Normalize accepted-value taxonomy ids (allowedAsAcceptedValue only). */
export function normalizeAcceptedTaxonomyIds(raw: unknown): string[] {
  const ids = normalizeTaxonomyIds(raw, null);
  return ids.filter((id) => isMarketplaceTaxonomyItemAllowedAsAcceptedValue(id));
}
