/**
 * Advanced feed filter registry skeleton (Fase 5D).
 * No runtime filter application yet — prevents hardcoded filter sprawl.
 * @see docs/HOMECHEFF_FEED_TAXONOMY.md
 */

import type { FeedCategory, FeedDirection } from '@/lib/feed/feed-taxonomy';

export type FilterFieldType =
  | 'multi'
  | 'enum'
  | 'boolean'
  | 'range'
  | 'dateRange'
  | 'text';

export type FilterFieldDefinition = {
  key: string;
  type: FilterFieldType;
  /** i18n key under filters.advanced.* */
  labelKey: string;
  /** API subfilter token when wired (future). */
  subfilterToken?: string;
};

export type FilterRegistryEntry = {
  direction: FeedDirection | 'ANY';
  category: FeedCategory | 'ANY';
  fields: FilterFieldDefinition[];
};

/**
 * Declarative advanced filters per direction × category.
 * Values are not enforced until subfilters API + DB fields exist.
 */
export const FEED_FILTER_REGISTRY: FilterRegistryEntry[] = [
  {
    direction: 'OFFER',
    category: 'FOOD',
    fields: [
      { key: 'diet', type: 'multi', labelKey: 'diet', subfilterToken: 'diet' },
      {
        key: 'allergens',
        type: 'multi',
        labelKey: 'allergens',
        subfilterToken: 'allergens',
      },
      {
        key: 'deliveryMode',
        type: 'enum',
        labelKey: 'delivery',
        subfilterToken: 'delivery',
      },
      { key: 'priceMax', type: 'range', labelKey: 'price' },
    ],
  },
  {
    direction: 'OFFER',
    category: 'GARDEN',
    fields: [
      {
        key: 'harvestType',
        type: 'multi',
        labelKey: 'harvestType',
        subfilterToken: 'harvest',
      },
      {
        key: 'organic',
        type: 'boolean',
        labelKey: 'organic',
        subfilterToken: 'organic',
      },
      { key: 'season', type: 'multi', labelKey: 'season', subfilterToken: 'season' },
    ],
  },
  {
    direction: 'OFFER',
    category: 'CREATIVE',
    fields: [
      {
        key: 'material',
        type: 'multi',
        labelKey: 'material',
        subfilterToken: 'material',
      },
      { key: 'style', type: 'multi', labelKey: 'style', subfilterToken: 'style' },
    ],
  },
  {
    direction: 'ANY',
    category: 'HELP',
    fields: [
      {
        key: 'taskType',
        type: 'multi',
        labelKey: 'taskType',
        subfilterToken: 'taskType',
      },
      {
        key: 'urgency',
        type: 'enum',
        labelKey: 'urgency',
        subfilterToken: 'urgency',
      },
      {
        key: 'availability',
        type: 'dateRange',
        labelKey: 'availability',
        subfilterToken: 'availability',
      },
      {
        key: 'locationRadius',
        type: 'range',
        labelKey: 'distance',
        subfilterToken: 'radius',
      },
    ],
  },
  {
    direction: 'REQUEST',
    category: 'ANY',
    fields: [
      { key: 'seeks', type: 'text', labelKey: 'seeks', subfilterToken: 'seeks' },
      { key: 'offers', type: 'text', labelKey: 'offers', subfilterToken: 'offers' },
      {
        key: 'reciprocity',
        type: 'boolean',
        labelKey: 'reciprocity',
        subfilterToken: 'reciprocity',
      },
    ],
  },
];

export function getFilterFieldsForContext(
  direction: FeedDirection | 'ANY',
  category: FeedCategory
): FilterFieldDefinition[] {
  const out: FilterFieldDefinition[] = [];
  const seen = new Set<string>();
  for (const entry of FEED_FILTER_REGISTRY) {
    const dirOk = entry.direction === 'ANY' || entry.direction === direction;
    const catOk = entry.category === 'ANY' || entry.category === category;
    if (!dirOk || !catOk) continue;
    for (const field of entry.fields) {
      if (seen.has(field.key)) continue;
      seen.add(field.key);
      out.push(field);
    }
  }
  return out;
}
