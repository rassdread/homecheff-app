'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { TaxonomyLucideIcon } from '@/components/products/marketplace/TaxonomyLucideIcon';
import AcceptedValueChip from '@/components/marketplace/AcceptedValueChip';
import PendingAcceptedValueProposalForm from '@/components/marketplace/PendingAcceptedValueProposalForm';
import { MARKETPLACE_ENTRY_CATEGORY_KEY } from '@/lib/marketplace/i18n-keys';
import {
  getAcceptedValueTaxonomyItems,
  getMarketplaceTaxonomyGroupsByCategory,
  getMarketplaceTaxonomyItemsByParent,
} from '@/lib/marketplace/taxonomy-resolve';
import { MARKETPLACE_CATEGORIES } from '@/lib/marketplace/listing-taxonomy';
import {
  taxonomyGroupLabelKey,
  taxonomyLabelKey,
} from '@/lib/marketplace/taxonomy-i18n';
import { taxonomyToneChipClass } from '@/lib/marketplace/taxonomy-tone';
import { isPendingAcceptedValueId } from '@/lib/marketplace/pending-accepted-values/constants';
import { resolveAcceptedValueEntry } from '@/lib/marketplace/pending-accepted-values/resolve-pending-display';
import { usePendingAcceptedValueRegistry } from '@/hooks/usePendingAcceptedValueRegistry';
import { cn } from '@/lib/utils';

type Props = {
  value: string[];
  onChange: (ids: string[]) => void;
  compact?: boolean;
  className?: string;
  /** Phase 8C — first-class “I can offer” mode copy. */
  offerMode?: boolean;
};

const chipClass = (active: boolean, compact: boolean, tone = 'service' as const) =>
  cn(
    'inline-flex items-center gap-1.5 rounded-full border font-medium transition-all touch-manipulation',
    compact ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-sm',
    taxonomyToneChipClass(active, tone),
  );

/**
 * Discovery filter — accepted counter-values (official taxonomy + pending proposals).
 */
export default function AcceptedValuesDiscoveryFilter({
  value,
  onChange,
  compact = false,
  className,
  offerMode = false,
}: Props) {
  const { t } = useTranslation();
  const { registry } = usePendingAcceptedValueRegistry();
  const [query, setQuery] = useState('');

  const allItems = useMemo(() => getAcceptedValueTaxonomyItems(), []);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter((item) => {
      const label = t(taxonomyLabelKey(item.id)).toLowerCase();
      const terms = (item.searchTerms ?? []).map((term) => term.toLowerCase());
      return label.includes(q) || terms.some((term) => term.includes(q));
    });
  }, [allItems, query, t]);

  const grouped = useMemo(() => {
    const sections: Array<{ groupId: string; groupLabelKey: string; itemIds: string[] }> =
      [];

    for (const category of MARKETPLACE_CATEGORIES) {
      const groups = getMarketplaceTaxonomyGroupsByCategory(category);
      if (groups.length > 0) {
        for (const group of groups) {
          const itemIds = getMarketplaceTaxonomyItemsByParent(group.id)
            .map((item) => item.id)
            .filter((id) => filteredItems.some((item) => item.id === id));
          if (itemIds.length > 0) {
            sections.push({
              groupId: group.id,
              groupLabelKey: taxonomyGroupLabelKey(group.id),
              itemIds,
            });
          }
        }
      } else {
        const itemIds = filteredItems
          .filter((item) => item.category === category)
          .map((item) => item.id);
        if (itemIds.length > 0) {
          sections.push({
            groupId: `flat.${category}`,
            groupLabelKey: MARKETPLACE_ENTRY_CATEGORY_KEY[category],
            itemIds,
          });
        }
      }
    }
    return sections;
  }, [filteredItems]);

  const toggle = (id: string) => {
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id],
    );
  };

  const headingKey = offerMode
    ? 'marketplace.discovery.acceptedValuesFilter.offerHeading'
    : 'marketplace.discovery.acceptedValuesFilter.heading';
  const descriptionKey = offerMode
    ? 'marketplace.discovery.acceptedValuesFilter.offerDescription'
    : 'marketplace.discovery.acceptedValuesFilter.description';

  return (
    <div className={cn('space-y-3', className)} data-discovery-filter="accepted-values">
      <div>
        <h3
          className={cn(
            'font-semibold text-gray-900',
            compact ? 'text-xs' : 'text-sm',
          )}
        >
          {t(headingKey)}
        </h3>
        <p
          className={cn(
            'mt-0.5 text-gray-600 leading-snug',
            compact ? 'text-[10px]' : 'text-xs',
          )}
        >
          {t(descriptionKey)}
        </p>
        {offerMode ? (
          <p
            className={cn(
              'mt-1.5 text-gray-500 leading-snug',
              compact ? 'text-[10px]' : 'text-xs',
            )}
          >
            {t('marketplace.discovery.acceptedValuesFilter.offerExamples')}
          </p>
        ) : null}
      </div>

      <div className="relative">
        <Search
          className={cn(
            'absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400',
            compact ? 'h-3.5 w-3.5' : 'h-4 w-4',
          )}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('marketplace.acceptedValues.searchPlaceholder')}
          className={cn(
            'w-full rounded-lg border border-gray-200 bg-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100',
            compact ? 'py-1.5 pl-8 pr-2 text-xs' : 'py-2 pl-9 pr-3 text-sm',
          )}
        />
      </div>

      {value.length > 0 ? (
        <div className="space-y-1.5">
          {offerMode ? (
            <p className={cn('font-medium text-emerald-800', compact ? 'text-[10px]' : 'text-xs')}>
              {t('marketplace.discovery.acceptedValuesFilter.shoppingWithPrefix')}
            </p>
          ) : null}
          <div
            className="flex flex-wrap gap-1.5"
            role="list"
            aria-label={t('marketplace.discovery.acceptedValuesFilter.activeShoppingLabel')}
          >
            {value.map((id) => (
              <AcceptedValueChip
                key={id}
                id={id}
                compact={compact}
                onRemove={() => toggle(id)}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          'overflow-y-auto pr-1 space-y-3',
          compact ? 'max-h-48' : 'max-h-64',
        )}
      >
        {grouped.length === 0 ? (
          <p className={compact ? 'text-[11px] text-gray-500' : 'text-sm text-gray-500'}>
            {t('marketplace.acceptedValues.emptySearch')}
          </p>
        ) : (
          grouped.map((section) => (
            <div key={section.groupId}>
              <p
                className={cn(
                  'font-semibold uppercase tracking-wide text-gray-500 mb-1.5',
                  compact ? 'text-[9px]' : 'text-[10px]',
                )}
              >
                {section.groupId.startsWith('flat.')
                  ? t('marketplace.discovery.acceptedValuesFilter.itemsLabel')
                  : t(section.groupLabelKey)}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {section.itemIds.map((id) => {
                  const item = allItems.find((entry) => entry.id === id);
                  if (!item) return null;
                  const active = value.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggle(id)}
                      className={chipClass(active, compact, item.tone)}
                      aria-pressed={active}
                    >
                      <TaxonomyLucideIcon
                        name={item.icon}
                        className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'}
                        tone={item.tone}
                      />
                      {t(taxonomyLabelKey(id))}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {value.some(isPendingAcceptedValueId) ? (
        <div className="flex flex-wrap gap-1.5">
          {value
            .filter(isPendingAcceptedValueId)
            .filter((id) => !allItems.some((item) => item.id === id))
            .map((id) => {
              const entry = resolveAcceptedValueEntry(id, registry);
              if (!entry || entry.kind !== 'pending') return null;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggle(id)}
                  className={chipClass(true, compact, entry.tone)}
                >
                  <TaxonomyLucideIcon
                    name={entry.icon}
                    className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'}
                    tone={entry.tone}
                  />
                  {entry.label}
                  <span aria-hidden>×</span>
                </button>
              );
            })}
        </div>
      ) : null}

      <PendingAcceptedValueProposalForm
        compact={compact}
        onCreated={(taxonomyId) => {
          if (!value.includes(taxonomyId)) {
            onChange([...value, taxonomyId]);
          }
        }}
      />
    </div>
  );
}
