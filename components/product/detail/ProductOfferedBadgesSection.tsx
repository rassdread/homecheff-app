'use client';

import type { MarketplaceCategory } from '@prisma/client';
import MarketplaceBadgeList from '@/components/marketplace/MarketplaceBadgeList';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

type Props = {
  specializations?: unknown;
  marketplaceCategory?: MarketplaceCategory | null;
  legacyCategory?: string | null;
  className?: string;
};

export default function ProductOfferedBadgesSection({
  specializations,
  marketplaceCategory,
  legacyCategory,
  className,
}: Props) {
  const { t } = useTranslation();

  return (
    <section className={cn('rounded-xl border border-gray-100 bg-white px-4 py-4 shadow-sm', className)}>
      <h2 className="mb-2 text-sm font-semibold text-gray-900">
        {t('marketplace.badges.offeredHeading')}
      </h2>
      <MarketplaceBadgeList
        specializations={specializations}
        marketplaceCategory={marketplaceCategory}
        legacyCategory={legacyCategory}
        size="md"
        showIcon
      />
    </section>
  );
}
