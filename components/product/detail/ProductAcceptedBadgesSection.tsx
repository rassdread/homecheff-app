'use client';

import AcceptedValuesGroupedList from '@/components/marketplace/AcceptedValuesGroupedList';
import { normalizeAcceptedTaxonomyIds } from '@/lib/marketplace/taxonomy-normalize';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

type Props = {
  acceptedSpecializations?: unknown;
  priceCents?: number | null;
  priceModel?: string | null;
  className?: string;
};

export default function ProductAcceptedBadgesSection({
  acceptedSpecializations,
  priceCents,
  priceModel,
  className,
}: Props) {
  const { t } = useTranslation();
  const normalized = normalizeAcceptedTaxonomyIds(acceptedSpecializations);
  if (normalized.length === 0) return null;

  const headingKey = 'marketplace.detail.acceptedValues.sellerAcceptsHeading';

  return (
    <section
      className={cn(
        'rounded-xl border border-gray-100 bg-white px-4 py-4 shadow-sm',
        className,
      )}
    >
      <h2 className="mb-2 text-sm font-semibold text-gray-900">{t(headingKey)}</h2>
      <p className="mb-3 text-xs text-gray-600 leading-relaxed">
        {t('marketplace.detail.acceptedValues.description')}
      </p>
      <AcceptedValuesGroupedList ids={normalized} />
    </section>
  );
}
