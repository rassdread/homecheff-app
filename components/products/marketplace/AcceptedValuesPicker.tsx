'use client';

import type { MarketplaceCategory } from '@prisma/client';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { TaxonomyLucideIcon } from '@/components/products/marketplace/TaxonomyLucideIcon';
import { MARKETPLACE_ENTRY_CATEGORY_KEY } from '@/lib/marketplace/i18n-keys';
import { MARKETPLACE_CATEGORIES } from '@/lib/marketplace/listing-taxonomy';
import {
  getAcceptedValueTaxonomyItems,
  getMarketplaceTaxonomyGroupsByCategory,
  getMarketplaceTaxonomyItemsByParent,
} from '@/lib/marketplace/taxonomy-resolve';
import {
  taxonomyGroupLabelKey,
  taxonomyLabelKey,
} from '@/lib/marketplace/taxonomy-i18n';

type Props = {
  value: string[];
  onChange: (ids: string[]) => void;
};

export default function AcceptedValuesPicker({ value, onChange }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<
    MarketplaceCategory | 'ALL'
  >('ALL');

  const allItems = useMemo(() => getAcceptedValueTaxonomyItems(), []);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allItems.filter((item) => {
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
        return false;
      }
      if (!q) return true;
      const label = t(taxonomyLabelKey(item.id)).toLowerCase();
      const terms = (item.searchTerms ?? []).map((term) => term.toLowerCase());
      return label.includes(q) || terms.some((term) => term.includes(q));
    });
  }, [allItems, categoryFilter, query, t]);

  const grouped = useMemo(() => {
    const categories =
      categoryFilter === 'ALL'
        ? MARKETPLACE_CATEGORIES
        : [categoryFilter as MarketplaceCategory];
    const sections: Array<{
      category: MarketplaceCategory;
      groupId: string;
      itemIds: string[];
    }> = [];

    for (const category of categories) {
      const groups = getMarketplaceTaxonomyGroupsByCategory(category);
      if (groups.length > 0) {
        for (const group of groups) {
          const itemIds = getMarketplaceTaxonomyItemsByParent(group.id)
            .map((item) => item.id)
            .filter((id) => filteredItems.some((item) => item.id === id));
          if (itemIds.length > 0) {
            sections.push({ category, groupId: group.id, itemIds });
          }
        }
      } else {
        const itemIds = filteredItems
          .filter((item) => item.category === category)
          .map((item) => item.id);
        if (itemIds.length > 0) {
          sections.push({ category, groupId: `flat.${category}`, itemIds });
        }
      }
    }
    return sections;
  }, [categoryFilter, filteredItems]);

  const toggle = (id: string) => {
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id],
    );
  };

  const chipClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
      active
        ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
        : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-300'
    }`;

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">
          {t('marketplace.acceptedValues.heading')}
        </h3>
        <p className="mt-1 text-xs text-gray-600">
          {t('marketplace.acceptedValues.description')}
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('marketplace.acceptedValues.searchPlaceholder')}
          className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategoryFilter('ALL')}
          className={chipClass(categoryFilter === 'ALL')}
        >
          {t('marketplace.acceptedValues.filterAll')}
        </button>
        {MARKETPLACE_CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setCategoryFilter(category)}
            className={chipClass(categoryFilter === category)}
          >
            {t(MARKETPLACE_ENTRY_CATEGORY_KEY[category])}
          </button>
        ))}
      </div>

      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {value.map((id) => {
            const item = allItems.find((entry) => entry.id === id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggle(id)}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-300 px-3 py-1 text-sm text-emerald-900"
              >
                {item ? (
                  <TaxonomyLucideIcon name={item.icon} className="h-3.5 w-3.5" />
                ) : null}
                {t(taxonomyLabelKey(id))}
                <span aria-hidden>×</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="max-h-72 overflow-y-auto space-y-4 pr-1">
        {grouped.length === 0 ? (
          <p className="text-sm text-gray-500">
            {t('marketplace.acceptedValues.emptySearch')}
          </p>
        ) : (
          grouped.map((section) => (
            <div key={`${section.category}-${section.groupId}`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                {section.groupId.startsWith('flat.')
                  ? t(MARKETPLACE_ENTRY_CATEGORY_KEY[section.category])
                  : t(taxonomyGroupLabelKey(section.groupId))}
              </p>
              <div className="flex flex-wrap gap-2">
                {section.itemIds.map((id) => {
                  const item = allItems.find((entry) => entry.id === id);
                  if (!item) return null;
                  const active = value.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggle(id)}
                      className={chipClass(active)}
                    >
                      <TaxonomyLucideIcon name={item.icon} className="h-3.5 w-3.5" />
                      {t(taxonomyLabelKey(id))}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
