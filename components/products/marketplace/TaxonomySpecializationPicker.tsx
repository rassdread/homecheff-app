'use client';

import { useMemo, useState } from 'react';
import type { MarketplaceCategory } from '@prisma/client';
import { useTranslation } from '@/hooks/useTranslation';
import TaxonomyGroupAccordion from '@/components/products/marketplace/TaxonomyGroupAccordion';
import { TaxonomyLucideIcon } from '@/components/products/marketplace/TaxonomyLucideIcon';
import {
  getMarketplaceTaxonomyItem,
  type TaxonomyEntryRole,
} from '@/lib/marketplace/taxonomy-resolve';
import {
  compiledTaxonomyItemLabel,
  taxonomyLabelKey,
  taxonomyLabelWithFallback,
} from '@/lib/marketplace/taxonomy-i18n';
import { taxonomyToneChipClass } from '@/lib/marketplace/taxonomy-tone';
import { MARKETPLACE_ERROR_KEYS } from '@/lib/marketplace/i18n-keys';
import {
  constrainSpecializationsToOneCategory,
  getOfferAccordionGroups,
} from '@/lib/marketplace/taxonomy-accordion';

type Props = {
  marketplaceCategory: MarketplaceCategory;
  role?: TaxonomyEntryRole;
  value: string[];
  onChange: (ids: string[]) => void;
  otherLabel?: string;
  onOtherLabelChange?: (label: string) => void;
  className?: string;
};

export default function TaxonomySpecializationPicker({
  marketplaceCategory,
  role = 'offer',
  value,
  onChange,
  otherLabel,
  onOtherLabelChange,
  className,
}: Props) {
  const { t, language } = useTranslation();
  const [message, setMessage] = useState<string | null>(null);
  const accordionGroups = useMemo(
    () => getOfferAccordionGroups(marketplaceCategory),
    [marketplaceCategory],
  );

  const itemLabel = (taxonomyId: string) =>
    taxonomyLabelWithFallback(
      t(taxonomyLabelKey(taxonomyId)),
      compiledTaxonomyItemLabel(taxonomyId),
      language,
    );

  const toggle = (taxonomyId: string) => {
    onChange(
      value.includes(taxonomyId)
        ? value.filter((id) => id !== taxonomyId)
        : [...value, taxonomyId],
    );
    setMessage(null);
  };

  return (
    <div className={className ?? 'min-w-0 space-y-4 overflow-x-hidden rounded-xl border border-gray-200 bg-gray-50/60 p-4'}>
      <div>
        <h3 className="text-sm font-semibold text-gray-900">
          {t('marketplace.entry.summarySpecializationsLabel')}
        </h3>
        <p className="mt-1 text-xs text-gray-600">
          {t('marketplace.entry.accordionHint')}
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
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium ${taxonomyToneChipClass(true, tone)}`}
              >
                <TaxonomyLucideIcon
                  name={item?.icon ?? 'Tag'}
                  className="h-3.5 w-3.5"
                  tone={item.tone}
                />
                {itemLabel(taxonomyId)}
                <span aria-hidden>×</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <TaxonomyGroupAccordion
        marketplaceCategory={marketplaceCategory}
        role={role}
        value={value}
        onChange={(ids) => {
          onChange(constrainSpecializationsToOneCategory(ids));
          setMessage(null);
        }}
        otherLabel={otherLabel}
        onOtherLabelChange={onOtherLabelChange}
        defaultCollapsed={value.length === 0}
        groups={accordionGroups}
      />

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
