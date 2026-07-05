'use client';

import type { PriceModel } from '@prisma/client';
import MarketplaceBadgeList from '@/components/marketplace/MarketplaceBadgeList';
import { resolveAcceptedValueHeadingKey } from '@/lib/marketplace/accepted-value-heading';
import { resolveAcceptedBadges } from '@/lib/marketplace/taxonomy-badges';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

type Props = {
  acceptedSpecializations?: unknown;
  priceCents?: number | null;
  priceModel?: PriceModel | string | null;
  maxVisible?: number;
  showHeading?: boolean;
  className?: string;
};

export default function MarketplaceAcceptedBadgesRow({
  acceptedSpecializations,
  priceCents,
  priceModel,
  maxVisible = 2,
  showHeading = true,
  className,
}: Props) {
  const { t } = useTranslation();
  const badges = resolveAcceptedBadges(acceptedSpecializations);
  if (badges.length === 0) return null;

  const headingKey = resolveAcceptedValueHeadingKey({ priceCents, priceModel });

  return (
    <div className={cn('space-y-1', className)}>
      {showHeading ? (
        <p className="text-[10px] sm:text-xs font-medium text-gray-600">
          {t(headingKey)}
        </p>
      ) : null}
      <MarketplaceBadgeList
        specializations={acceptedSpecializations}
        variant="accepted"
        maxVisible={maxVisible}
        size="sm"
      />
    </div>
  );
}
