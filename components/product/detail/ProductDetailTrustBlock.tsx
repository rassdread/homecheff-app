'use client';

import type { DiscoveryTrustContract } from '@/lib/discovery/contracts/discovery-trust-contract';
import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import { buildDetailTrustBlock } from '@/lib/marketplace/detail/detail-trust-block';
import BusinessPlanBadge from '@/components/business/BusinessPlanBadge';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

type Props = {
  trust: DiscoveryTrustContract;
  listingKind: ListingKind;
  className?: string;
  compact?: boolean;
};

export default function ProductDetailTrustBlock({
  trust,
  listingKind,
  className,
  compact = false,
}: Props) {
  const { t } = useTranslation();
  const plan = buildDetailTrustBlock(trust, listingKind);

  if (plan.lines.length === 0) return null;

  return (
    <section
      className={cn(
        'rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm',
        className,
      )}
      data-detail-section="trust_block"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2
          className={cn(
            'font-semibold text-gray-900',
            compact ? 'text-xs uppercase tracking-wide text-gray-500' : 'text-sm',
          )}
        >
          {t('marketplace.detail.sections.trustBlock')}
        </h2>
        {trust.businessPlan && trust.businessPlan !== 'individual' ? (
          <BusinessPlanBadge plan={trust.businessPlan} t={t} />
        ) : null}
      </div>
      <ul className={cn('space-y-1.5', compact ? 'text-xs' : 'text-sm')}>
        {plan.lines.map((line) => (
          <li key={`${line.kind}-${line.badgeId ?? line.labelKey}`} className="text-gray-700">
            {line.count != null
              ? t(line.labelKey, { count: line.count })
              : t(line.labelKey)}
          </li>
        ))}
      </ul>
    </section>
  );
}
