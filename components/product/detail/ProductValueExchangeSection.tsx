'use client';

import { useMemo } from 'react';
import type { MarketplaceCategory } from '@prisma/client';
import { useTranslation } from '@/hooks/useTranslation';
import {
  buildDetailValueExchangeBlock,
  valueExchangeSectionTitleKey,
} from '@/lib/marketplace/detail/detail-value-exchange-block';
import { deriveListingKind } from '@/lib/marketplace/listing-kind/derive-listing-kind';
import { TaxonomyLucideIcon } from '@/components/products/marketplace/TaxonomyLucideIcon';
import { getMarketplaceTaxonomyItem } from '@/lib/marketplace/taxonomy-resolve';
import { taxonomyLabelKey } from '@/lib/marketplace/taxonomy-i18n';
import { cn } from '@/lib/utils';

type Props = {
  barterOpenness?: string | null;
  priceModel?: string | null;
  acceptedSpecializations?: string[];
  specializations?: string[];
  marketplaceCategory?: MarketplaceCategory | null;
  subcategory?: string | null;
  listingIntent?: string | null;
  category?: string | null;
  className?: string;
};

export default function ProductValueExchangeSection({
  barterOpenness,
  priceModel,
  acceptedSpecializations = [],
  specializations,
  marketplaceCategory,
  subcategory,
  listingIntent,
  category,
  className,
}: Props) {
  const { t } = useTranslation();

  const listingKind = useMemo(
    () =>
      deriveListingKind({
        listingIntent,
        marketplaceCategory,
        specializations,
        subcategory,
        category,
      }).listingKind,
    [listingIntent, marketplaceCategory, specializations, subcategory, category],
  );

  const block = useMemo(
    () =>
      buildDetailValueExchangeBlock({
        listingKind,
        marketplaceCategory: marketplaceCategory ?? null,
        primarySpecializationId: specializations?.[0] ?? subcategory ?? null,
        barterOpenness,
        priceModel,
        acceptedTaxonomyIds: acceptedSpecializations,
      }),
    [
      listingKind,
      marketplaceCategory,
      specializations,
      subcategory,
      barterOpenness,
      priceModel,
      acceptedSpecializations,
    ],
  );

  const openness = String(barterOpenness ?? 'MONEY').toUpperCase();
  const showSection =
    block !== null &&
    (acceptedSpecializations.length > 0 || openness !== 'MONEY');

  if (!showSection || !block) return null;

  const acceptedLines = block.lines.filter(
    (line) =>
      line.kind === 'accepted_subcategory' ||
      line.kind === 'accepted_category' ||
      line.kind === 'desired',
  );

  return (
    <section
      className={cn(
        'rounded-xl border border-gray-100 bg-white px-4 py-4 shadow-sm',
        className,
      )}
    >
      <h2 className="mb-3 text-sm font-semibold text-gray-900">
        {t(valueExchangeSectionTitleKey())}
      </h2>
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-900">
          <span className="text-base" aria-hidden>
            {block.paymentEmoji}
          </span>
          <span className="font-medium">{t(block.paymentLabelKey)}</span>
        </div>
        {acceptedLines.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              {t('marketplace.valueExchange.barter.accepts')}
            </p>
            <ul className="flex flex-wrap gap-2">
              {acceptedLines
                .filter((line) => line.kind === 'accepted_subcategory')
                .map((line) => {
                  const item = line.taxonomyId
                    ? getMarketplaceTaxonomyItem(line.taxonomyId)
                    : null;
                  const label = line.taxonomyId
                    ? t(taxonomyLabelKey(line.taxonomyId))
                    : t(line.labelKey);
                  return (
                    <li
                      key={line.taxonomyId ?? line.labelKey}
                      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-900 ring-1 ring-emerald-100"
                    >
                      <TaxonomyLucideIcon
                        name={item?.icon ?? 'Tag'}
                        className="h-3.5 w-3.5 shrink-0"
                      />
                      {label}
                    </li>
                  );
                })}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
