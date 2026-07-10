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
import { taxonomyToneChipClass } from '@/lib/marketplace/taxonomy-tone';
import type { TaxonomyTone } from '@/lib/marketplace/taxonomy-types';
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

  const chipClass = (active: boolean, tone: TaxonomyTone = 'service') =>
    `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${taxonomyToneChipClass(active, tone)}`;

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
          {value.map((taxonomyId) => {
            const item = getMarketplaceTaxonomyItem(taxonomyId);
            const tone = item?.tone ?? 'service';
            return (
            <button
              key={taxonomyId}
              type="button"
              onClick={() => toggle(taxonomyId)}
              className={chipClass(true, tone)}
            >
              <TaxonomyLucideIcon
                name={item?.icon ?? 'Tag'}
                className="h-3.5 w-3.5"
                tone={tone}
              />
              {t(taxonomyLabelKey(taxonomyId))}
              <span aria-hidden>×</span>
            </button>
          );
          })}
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
                ? `border ${taxonomyToneChipClass(true, group.tone)}`
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-900'
            }`}
          >
            <TaxonomyLucideIcon name={group.icon} className="h-4 w-4 shrink-0" tone={group.tone} />
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
                className={chipClass(value.includes(item.id), item.tone)}
                aria-pressed={value.includes(item.id)}
              >
                <TaxonomyLucideIcon name={item.icon} className="h-3.5 w-3.5" tone={item.tone} />
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
