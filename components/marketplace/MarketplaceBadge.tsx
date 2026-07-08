'use client';

import { TaxonomyLucideIcon } from '@/components/products/marketplace/TaxonomyLucideIcon';
import { useTranslation } from '@/hooks/useTranslation';
import {
  resolveOfferBadgeByTaxonomyId,
  type ResolvedOfferBadge,
} from '@/lib/marketplace/taxonomy-badges';
import {
  TAXONOMY_BADGE_SIZE_CLASSES,
  TAXONOMY_TONE_CLASSES,
  type TaxonomyBadgeSize,
} from '@/lib/marketplace/taxonomy-tone';
import { cn } from '@/lib/utils';

type Props = {
  taxonomyId: string;
  size?: TaxonomyBadgeSize;
  showIcon?: boolean;
  className?: string;
};

type InternalProps = {
  badge: ResolvedOfferBadge;
  size?: TaxonomyBadgeSize;
  showIcon?: boolean;
  className?: string;
};

export function MarketplaceBadgeResolved({
  badge,
  size = 'sm',
  showIcon = true,
  className,
}: InternalProps) {
  const { t } = useTranslation();
  const sizeClasses = TAXONOMY_BADGE_SIZE_CLASSES[size];

  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center rounded-md border font-medium',
        TAXONOMY_TONE_CLASSES[badge.tone],
        sizeClasses.badge,
        className,
      )}
    >
      {showIcon ? (
        <TaxonomyLucideIcon name={badge.icon} className={sizeClasses.icon} />
      ) : null}
      <span className="truncate">{badge.displayLabel ?? t(badge.labelKey)}</span>
    </span>
  );
}

export default function MarketplaceBadge({
  taxonomyId,
  size = 'sm',
  showIcon = true,
  className,
}: Props) {
  const badge = resolveOfferBadgeByTaxonomyId(taxonomyId);
  if (!badge) return null;

  return (
    <MarketplaceBadgeResolved
      badge={badge}
      size={size}
      showIcon={showIcon}
      className={className}
    />
  );
}
