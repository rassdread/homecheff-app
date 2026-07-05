'use client';

import type { MarketplaceCategory } from '@prisma/client';
import { useTranslation } from '@/hooks/useTranslation';
import { resolveAcceptedBadges, resolveOfferBadges } from '@/lib/marketplace/taxonomy-badges';
import {
  TAXONOMY_BADGE_SIZE_CLASSES,
  type TaxonomyBadgeSize,
} from '@/lib/marketplace/taxonomy-tone';
import { cn } from '@/lib/utils';
import { MarketplaceBadgeResolved } from './MarketplaceBadge';

type Props = {
  /** Canonical or legacy specialization ids */
  ids?: string[];
  specializations?: unknown;
  marketplaceCategory?: MarketplaceCategory | null;
  legacyCategory?: string | null;
  maxVisible?: number;
  size?: TaxonomyBadgeSize;
  showIcon?: boolean;
  className?: string;
  /** offer = offered specializations (with legacy fallback); accepted = accepted values only */
  variant?: 'offer' | 'accepted';
};

export default function MarketplaceBadgeList({
  ids,
  specializations,
  marketplaceCategory,
  legacyCategory,
  maxVisible,
  size = 'sm',
  showIcon = true,
  className,
  variant = 'offer',
}: Props) {
  const { t } = useTranslation();
  const resolved =
    variant === 'accepted'
      ? resolveAcceptedBadges(specializations ?? ids)
      : resolveOfferBadges({
          specializations: specializations ?? ids,
          marketplaceCategory,
          legacyCategory,
        });

  if (resolved.length === 0) return null;

  const visible =
    maxVisible != null && maxVisible >= 0
      ? resolved.slice(0, maxVisible)
      : resolved;
  const overflow =
    maxVisible != null && resolved.length > maxVisible
      ? resolved.length - maxVisible
      : 0;
  const sizeClasses = TAXONOMY_BADGE_SIZE_CLASSES[size];

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {visible.map((badge) => (
        <MarketplaceBadgeResolved
          key={`${badge.kind}-${badge.id}`}
          badge={badge}
          size={size}
          showIcon={showIcon}
        />
      ))}
      {overflow > 0 ? (
        <span
          className={cn(
            'inline-flex items-center rounded-md border font-semibold bg-neutral-50 text-neutral-600 border-neutral-200/80',
            sizeClasses.badge,
          )}
        >
          {t('marketplace.badges.overflow', { count: overflow })}
        </span>
      ) : null}
    </div>
  );
}
