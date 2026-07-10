'use client';

import { useMemo } from 'react';
import type { MarketplaceCategory } from '@prisma/client';
import { useTranslation } from '@/hooks/useTranslation';
import { buildDetailAcceptedValuesPresentation } from '@/lib/marketplace/detail/detail-accepted-values-presentation';
import { deriveListingKind } from '@/lib/marketplace/listing-kind/derive-listing-kind';
import { getMarketplaceTaxonomyItem } from '@/lib/marketplace/taxonomy-resolve';
import { TaxonomyLucideIcon } from '@/components/products/marketplace/TaxonomyLucideIcon';
import { taxonomyLabelKey } from '@/lib/marketplace/taxonomy-i18n';
import { cn } from '@/lib/utils';

type Props = {
  acceptedSpecializations?: string[];
  marketplaceCategory?: MarketplaceCategory | null;
  listingIntent?: string | null;
  specializations?: string[];
  subcategory?: string | null;
  category?: string | null;
  className?: string;
};

export default function ProductDetailAcceptedValuesSection({
  acceptedSpecializations = [],
  marketplaceCategory,
  listingIntent,
  specializations,
  subcategory,
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

  const presentation = useMemo(
    () =>
      buildDetailAcceptedValuesPresentation({
        acceptedTaxonomyIds: acceptedSpecializations,
        marketplaceCategory,
        listingKind,
      }),
    [acceptedSpecializations, marketplaceCategory, listingKind],
  );

  if (!presentation.hasContent) return null;

  return (
    <section
      className={cn(
        'rounded-xl border border-gray-100 bg-white px-4 py-4 shadow-sm',
        className,
      )}
      data-detail-section="accepted_values"
    >
      <h2 className="mb-1 text-sm font-semibold text-gray-900">
        {t('marketplace.detail.acceptedValues.sellerAcceptsHeading')}
      </h2>
      <p className="mb-3 text-xs text-gray-600 leading-relaxed">
        {t('marketplace.detail.acceptedValues.description')}
      </p>
      <div className="space-y-4">
        {presentation.groups.map((group) => (
          <div key={group.mainCategory}>
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <span aria-hidden>{group.emoji}</span>
              <span>{t(group.labelKey)}</span>
            </div>
            <ul className="mt-2 space-y-2 border-l-2 border-emerald-100 pl-3">
              {group.subcategories.map((sub) => (
                <li key={sub.taxonomyId}>
                  <div className="flex items-center gap-1.5 text-sm text-gray-900">
                    <TaxonomyLucideIcon
                      name={sub.icon}
                      className="h-3.5 w-3.5 shrink-0"
                      tone={getMarketplaceTaxonomyItem(sub.taxonomyId)?.tone}
                    />
                    <span>{t(taxonomyLabelKey(sub.taxonomyId))}</span>
                  </div>
                  {sub.note ? (
                    <p className="mt-0.5 text-xs italic text-gray-600">
                      &ldquo;{sub.note}&rdquo;
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
