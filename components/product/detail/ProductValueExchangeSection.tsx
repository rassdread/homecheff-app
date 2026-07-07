'use client';

import { useMemo } from 'react';
import type { MarketplaceCategory } from '@prisma/client';
import { useTranslation } from '@/hooks/useTranslation';
import {
  buildDesiredExchangesForDetail,
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
  listingTitle?: string | null;
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
  listingTitle,
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

  const desiredExchanges = useMemo(
    () =>
      buildDesiredExchangesForDetail({
        listingIntent,
        marketplaceCategory,
        specializations,
        subcategory,
        category,
        listingTitle,
      }),
    [
      listingIntent,
      marketplaceCategory,
      specializations,
      subcategory,
      category,
      listingTitle,
    ],
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
        desiredExchanges,
      }),
    [
      listingKind,
      marketplaceCategory,
      specializations,
      subcategory,
      barterOpenness,
      priceModel,
      acceptedSpecializations,
      desiredExchanges,
    ],
  );

  const openness = String(barterOpenness ?? 'MONEY').toUpperCase();
  const desiredLines = block?.lines.filter((line) => line.kind === 'desired') ?? [];

  const showSection =
    block !== null &&
    (openness !== 'MONEY' || desiredLines.length > 0);

  if (!showSection || !block) return null;

  return (
    <section
      className={cn(
        'rounded-xl border border-gray-100 bg-white px-4 py-4 shadow-sm',
        className,
      )}
      data-detail-section="value_exchange"
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
        {desiredLines.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              {t('marketplace.valueExchange.barter.seeks')}
            </p>
            <ul className="space-y-2">
              {desiredLines.map((line) => {
                const item = line.taxonomyId
                  ? getMarketplaceTaxonomyItem(line.taxonomyId)
                  : null;
                const label = line.taxonomyId
                  ? t(taxonomyLabelKey(line.taxonomyId))
                  : t(line.labelKey);
                const note = line.description?.trim();
                const showNote =
                  note &&
                  note !== (listingTitle ?? '').trim() &&
                  note.length > 0;
                return (
                  <li
                    key={line.taxonomyId ?? line.labelKey}
                    className="rounded-lg bg-amber-50 px-3 py-2 ring-1 ring-amber-100"
                  >
                    <div className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-950">
                      <TaxonomyLucideIcon
                        name={item?.icon ?? 'Tag'}
                        className="h-3.5 w-3.5 shrink-0"
                      />
                      {label}
                    </div>
                    {showNote ? (
                      <p className="mt-1 text-xs italic text-amber-900/80">
                        &ldquo;{note}&rdquo;
                      </p>
                    ) : null}
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
