/**
 * i18n key helpers for marketplace taxonomy labels.
 * Runtime copy lives in public/i18n/nl.json and public/i18n/en.json.
 */

import {
  TAXONOMY_GROUP_LABELS,
  TAXONOMY_ITEM_LABELS,
  type TaxonomyLabelPair,
} from '@/lib/marketplace/taxonomy-labels.data';

/** Full label key for a taxonomy item id, e.g. create.meal → marketplace.taxonomy.create.meal.label */
export function taxonomyLabelKey(id: string): string {
  if (id.startsWith('blocked.')) {
    const slug = id.slice('blocked.'.length);
    return `marketplace.blocklist.${slug}.label`;
  }
  return `marketplace.taxonomy.${id}.label`;
}

/** Optional short label key for compact badges */
export function taxonomyShortLabelKey(id: string): string {
  return `marketplace.taxonomy.${id}.shortLabel`;
}

/** Group label key, e.g. grp.create.meals → marketplace.taxonomy.groups.create.meals.label */
export function taxonomyGroupLabelKey(groupId: string): string {
  const normalized = groupId.startsWith('grp.') ? groupId.slice(4) : groupId;
  return `marketplace.taxonomy.groups.${normalized}.label`;
}

export function compiledTaxonomyGroupLabel(groupId: string): TaxonomyLabelPair | undefined {
  const normalized = groupId.startsWith('grp.') ? groupId.slice(4) : groupId;
  return TAXONOMY_GROUP_LABELS[normalized];
}

export function compiledTaxonomyItemLabel(id: string): TaxonomyLabelPair | undefined {
  return TAXONOMY_ITEM_LABELS[id];
}

/** Keep chips visible when HTTP/localStorage i18n is a version behind the registry. */
export function taxonomyLabelWithFallback(
  translated: string,
  pair: TaxonomyLabelPair | undefined,
  language: string,
): string {
  if (translated.trim()) return translated;
  if (!pair) return translated;
  return language === 'en' ? pair.en : pair.nl;
}

/** Block reason key for blocked taxonomy entries */
export function taxonomyBlockReasonKey(blockedSlug: string): string {
  return `marketplace.blocklist.${blockedSlug}.reason`;
}

/** Resolve a dot-path label key against nested marketplace i18n object */
export function resolveMarketplaceI18nPath(
  marketplaceRoot: Record<string, unknown> | undefined,
  labelKey: string,
): string | undefined {
  if (!marketplaceRoot || !labelKey.startsWith('marketplace.')) return undefined;
  const parts = labelKey.slice('marketplace.'.length).split('.');
  let node: unknown = marketplaceRoot;
  for (const part of parts) {
    if (node == null || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
}
