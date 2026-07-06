'use client';

import { useMemo, useState } from 'react';
import type { MarketplaceCategory } from '@prisma/client';
import { useTranslation } from '@/hooks/useTranslation';
import { TaxonomyLucideIcon } from '@/components/products/marketplace/TaxonomyLucideIcon';
import {
  getEntryFlowItemsForGroup,
  getMarketplaceTaxonomyGroupsByCategory,
  getMarketplaceTaxonomyItem,
  type TaxonomyEntryRole,
} from '@/lib/marketplace/taxonomy-resolve';
import {
  taxonomyGroupLabelKey,
  taxonomyLabelKey,
} from '@/lib/marketplace/taxonomy-i18n';
import { MARKETPLACE_ERROR_KEYS } from '@/lib/marketplace/i18n-keys';

type Props = {
  marketplaceCategory: MarketplaceCategory;
  role?: TaxonomyEntryRole;
  value: string[];
  onChange: (ids: string[]) => void;
  className?: string;
};

export default function TaxonomySpecializationPicker({
  marketplaceCategory,
  role = 'offer',
  value,
  onChange,
  className,
}: Props) {
  const { t } = useTranslation();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const groups = useMemo(
    () => getMarketplaceTaxonomyGroupsByCategory(marketplaceCategory),
    [marketplaceCategory],
  );

  const itemsForGroup = useMemo(() => {
    if (!selectedGroupId) return [];
    return getEntryFlowItemsForGroup(selectedGroupId, role);
  }, [selectedGroupId, role]);

  const toggle = (taxonomyId: string) => {
    onChange(
      value.includes(taxonomyId)
        ? value.filter((id) => id !== taxonomyId)
        : [...value, taxonomyId],
    );
    setMessage(null);
  };

  const chipClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
      active
        ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
        : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-300'
    }`;

  return (
    <div className={className ?? 'rounded-xl border border-gray-200 bg-gray-50/60 p-4 space-y-4'}>
      <div>
        <h3 className="text-sm font-semibold text-gray-900">
          {t('marketplace.entry.summarySpecializationsLabel')}
        </h3>
        <p className="mt-1 text-xs text-gray-600">
          {t('marketplace.entry.specializationsHint')}
        </p>
      </div>

      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {value.map((taxonomyId) => (
            <button
              key={taxonomyId}
              type="button"
              onClick={() => toggle(taxonomyId)}
              className={chipClass(true)}
            >
              <TaxonomyLucideIcon
                name={getMarketplaceTaxonomyItem(taxonomyId)?.icon ?? 'Tag'}
                className="h-3.5 w-3.5"
              />
              {t(taxonomyLabelKey(taxonomyId))}
              <span aria-hidden>×</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        {groups.map((group) => (
          <button
            key={group.id}
            type="button"
            onClick={() =>
              setSelectedGroupId(selectedGroupId === group.id ? null : group.id)
            }
            className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm font-medium transition-colors ${
              selectedGroupId === group.id
                ? 'border-emerald-500 bg-emerald-50 text-emerald-950'
                : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-gray-900'
            }`}
          >
            <TaxonomyLucideIcon name={group.icon} className="h-4 w-4 shrink-0" />
            {t(taxonomyGroupLabelKey(group.id))}
          </button>
        ))}
      </div>

      {selectedGroupId ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700">
            {t(taxonomyGroupLabelKey(selectedGroupId))}
          </p>
          <div className="flex flex-wrap gap-2">
            {itemsForGroup.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => toggle(item.id)}
                className={chipClass(value.includes(item.id))}
                aria-pressed={value.includes(item.id)}
              >
                <TaxonomyLucideIcon name={item.icon} className="h-3.5 w-3.5" />
                {value.includes(item.id) ? <span aria-hidden>✓ </span> : null}
                {t(taxonomyLabelKey(item.id))}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {value.length === 0 && message ? (
        <p className="text-sm text-red-600" role="alert">
          {message}
        </p>
      ) : null}

      {value.length === 0 ? (
        <p className="text-xs text-amber-700">
          {t(MARKETPLACE_ERROR_KEYS.specializationsRequired)}
        </p>
      ) : null}
    </div>
  );
}
