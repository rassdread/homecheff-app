'use client';

import MarketplaceBadgeList from '@/components/marketplace/MarketplaceBadgeList';
import { resolveAcceptedValueHeadingKey } from '@/lib/marketplace/accepted-value-heading';
import { resolveAcceptedBadges } from '@/lib/marketplace/taxonomy-badges';
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
  const badges = resolveAcceptedBadges(acceptedSpecializations);
  if (badges.length === 0) return null;

  const headingKey = resolveAcceptedValueHeadingKey({ priceCents, priceModel });

  return (
    <section
      className={cn(
        'rounded-xl border border-gray-100 bg-white px-4 py-4 shadow-sm',
        className,
      )}
    >
      <h2 className="mb-2 text-sm font-semibold text-gray-900">{t(headingKey)}</h2>
      <MarketplaceBadgeList
        specializations={acceptedSpecializations}
        variant="accepted"
        size="md"
        showIcon
      />
    </section>
  );
}
