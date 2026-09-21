'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { MarketplaceCategory } from '@prisma/client';
import { useTranslation } from '@/hooks/useTranslation';
import { TaxonomyLucideIcon } from '@/components/products/marketplace/TaxonomyLucideIcon';
import {
  getEntryFlowItemsForGroup,
  getMarketplaceTaxonomyGroupsByCategory,
  type TaxonomyEntryRole,
} from '@/lib/marketplace/taxonomy-resolve';
import {
  compiledTaxonomyGroupLabel,
  compiledTaxonomyItemLabel,
  taxonomyGroupLabelKey,
  taxonomyLabelKey,
  taxonomyLabelWithFallback,
} from '@/lib/marketplace/taxonomy-i18n';
import { taxonomyToneChipClass } from '@/lib/marketplace/taxonomy-tone';
import type { TaxonomyTone } from '@/lib/marketplace/taxonomy-types';
import {
  accordionGroupNeedsSearch,
  accordionGroupsForSelection,
  filterAccordionGroupItems,
  taxonomyItemRequiresCustomLabel,
} from '@/lib/marketplace/taxonomy-accordion';

type Props = {
  marketplaceCategory: MarketplaceCategory;
  role?: TaxonomyEntryRole;
  value: string[];
  onChange: (ids: string[]) => void;
  otherLabel?: string;
  onOtherLabelChange?: (label: string) => void;
  /** When false (edit with existing selection), groups that contain a selection start open. */
  defaultCollapsed?: boolean;
  /** Override groups (combined service accordion). Defaults to category groups. */
  groups?: import('@/lib/marketplace/taxonomy-types').MarketplaceTaxonomyItem[];
};

export default function TaxonomyGroupAccordion({
  marketplaceCategory,
  role = 'offer',
  value,
  onChange,
  otherLabel = '',
  onOtherLabelChange,
  defaultCollapsed = true,
  groups: groupsProp,
}: Props) {
  const { t, language } = useTranslation();
  const reactId = useId();

  const groups = useMemo(
    () => groupsProp ?? getMarketplaceTaxonomyGroupsByCategory(marketplaceCategory),
    [groupsProp, marketplaceCategory],
  );
  const groupKey = groups.map((group) => group.id).join(',');

  const [openGroupIds, setOpenGroupIds] = useState<string[]>(() =>
    defaultCollapsed ? [] : accordionGroupsForSelection(marketplaceCategory, value, role, groups),
  );
  const [groupQuery, setGroupQuery] = useState<Record<string, string>>({});

  const hydratedOpenRef = useRef(false);
  useEffect(() => {
    hydratedOpenRef.current = false;
    setGroupQuery({});
    if (defaultCollapsed) {
      setOpenGroupIds([]);
    }
  }, [groupKey, defaultCollapsed]);

  useEffect(() => {
    if (defaultCollapsed || hydratedOpenRef.current) return;
    const selectedGroups = accordionGroupsForSelection(
      marketplaceCategory,
      value,
      role,
      groups,
    );
    if (selectedGroups.length === 0) return;
    hydratedOpenRef.current = true;
    setOpenGroupIds(selectedGroups);
  }, [defaultCollapsed, marketplaceCategory, role, value, groups]);

  const groupLabel = (groupId: string) =>
    taxonomyLabelWithFallback(
      t(taxonomyGroupLabelKey(groupId)),
      compiledTaxonomyGroupLabel(groupId),
      language,
    );

  const itemLabel = (taxonomyId: string) =>
    taxonomyLabelWithFallback(
      t(taxonomyLabelKey(taxonomyId)),
      compiledTaxonomyItemLabel(taxonomyId),
      language,
    );

  const toggleGroup = (groupId: string) => {
    setOpenGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId],
    );
  };

  const toggleItem = (taxonomyId: string, groupId: string) => {
    const next = value.includes(taxonomyId)
      ? value.filter((id) => id !== taxonomyId)
      : [...value, taxonomyId];
    onChange(next);
    if (!next.includes(taxonomyId)) return;
    setOpenGroupIds((prev) => (prev.includes(groupId) ? prev : [...prev, groupId]));
  };

  const chipClass = (active: boolean, tone: TaxonomyTone = 'service') =>
    `inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${taxonomyToneChipClass(active, tone)}`;

  const showOtherField = value.some(taxonomyItemRequiresCustomLabel);

  return (
    <div className="min-w-0 space-y-2 overflow-x-hidden" data-testid="taxonomy-group-accordion">
      <div className="space-y-2" role="list">
        {groups.map((group) => {
          const items = getEntryFlowItemsForGroup(group.id, role);
          if (items.length === 0) return null;
          const selectedInGroup = items.filter((item) => value.includes(item.id));
          const expanded = openGroupIds.includes(group.id);
          const panelId = `${reactId}-${group.id}-panel`;
          const headerId = `${reactId}-${group.id}-header`;
          return (
            <div
              key={group.id}
              role="listitem"
              className={`min-w-0 overflow-hidden rounded-xl border transition-colors ${
                expanded || selectedInGroup.length > 0
                  ? 'border-emerald-300 bg-white'
                  : 'border-gray-200 bg-white'
              }`}
              data-testid={`taxonomy-group-${group.id}`}
            >
              <h3 className="m-0">
                <button
                  type="button"
                  id={headerId}
                  className="flex w-full min-w-0 items-center gap-2 px-3 py-3 text-left"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => toggleGroup(group.id)}
                >
                  <TaxonomyLucideIcon
                    name={group.icon}
                    className="h-4 w-4 shrink-0"
                    tone={group.tone}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
                    {groupLabel(group.id)}
                  </span>
                  {selectedInGroup.length > 0 ? (
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                      {selectedInGroup.length}
                    </span>
                  ) : null}
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${
                      expanded ? 'rotate-180' : ''
                    }`}
                    aria-hidden
                  />
                </button>
              </h3>
              {expanded ? (
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={headerId}
                  className="border-t border-gray-100 px-3 pb-3 pt-2"
                >
                  {selectedInGroup.length > 0 ? (
                    <p className="mb-2 truncate text-xs text-emerald-800">
                      {selectedInGroup.map((item) => itemLabel(item.id)).join(' · ')}
                    </p>
                  ) : null}
                  {accordionGroupNeedsSearch(items.length) ? (
                    <input
                      type="search"
                      data-testid={`taxonomy-group-search-${group.id}`}
                      className="mb-2 w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      value={groupQuery[group.id] ?? ''}
                      onChange={(e) =>
                        setGroupQuery((prev) => ({ ...prev, [group.id]: e.target.value }))
                      }
                      placeholder={t('marketplace.entry.groupSearchPlaceholder')}
                      aria-label={t('marketplace.entry.groupSearchPlaceholder')}
                    />
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    {filterAccordionGroupItems(
                      items,
                      groupQuery[group.id] ?? '',
                      value,
                      itemLabel,
                    ).map((item) => {
                      const active = value.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          data-testid={`taxonomy-item-${item.id}`}
                          onClick={() => toggleItem(item.id, group.id)}
                          className={chipClass(active, item.tone)}
                          aria-pressed={active}
                        >
                          <TaxonomyLucideIcon
                            name={item.icon}
                            className="h-3.5 w-3.5"
                            tone={item.tone}
                          />
                          {active ? <span aria-hidden>✓ </span> : null}
                          <span className="truncate">{itemLabel(item.id)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : selectedInGroup.length > 0 ? (
                <p className="truncate px-3 pb-2 text-xs text-emerald-800">
                  {selectedInGroup.map((item) => itemLabel(item.id)).join(' · ')}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      {showOtherField ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-3">
          <label className="block text-sm font-medium text-gray-800" htmlFor={`${reactId}-other`}>
            {t('marketplace.entry.otherOfferLabel')}
          </label>
          <input
            id={`${reactId}-other`}
            data-testid="taxonomy-other-service-input"
            className="mt-1.5 w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={otherLabel}
            onChange={(e) => onOtherLabelChange?.(e.target.value)}
            placeholder={t('marketplace.entry.otherOfferPlaceholder')}
            maxLength={80}
          />
        </div>
      ) : null}
    </div>
  );
}
