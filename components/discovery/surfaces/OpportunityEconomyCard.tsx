'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef } from 'react';
import {
  Bike,
  Building2,
  Calendar,
  Flower2,
  GraduationCap,
  HandHeart,
  HeartHandshake,
  Landmark,
  Megaphone,
  Monitor,
  School,
  Store,
  Trophy,
  Truck,
  Wifi,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { EconomyOpportunitySurfaceContract } from '@/lib/discovery/surfaces/map-economy-opportunity-surface';
import {
  recordEconomyOpportunityDismissed,
  recordEconomyOpportunityShown,
} from '@/lib/discovery/surfaces/surface-client-storage';
import { trackActivityCardEvent } from '@/lib/discovery/activity-cards/activity-card-analytics';

const ICON_MAP: Record<string, LucideIcon> = {
  Store,
  Megaphone,
  Bike,
  GraduationCap,
  HandHeart,
  Building2,
  Trophy,
  School,
  Landmark,
  Calendar,
  Wrench,
  Monitor,
  Truck,
  HeartHandshake,
  Flower2,
  Wifi,
};

export type OpportunityEconomyCardProps = {
  contract: EconomyOpportunitySurfaceContract;
  t: (key: string) => string;
  surface?: string;
  className?: string;
  onDismiss?: () => void;
  compact?: boolean;
};

export default function OpportunityEconomyCard({
  contract,
  t,
  surface = 'desktop_sidebar',
  className = '',
  onDismiss,
  compact = false,
}: OpportunityEconomyCardProps) {
  const Icon = ICON_MAP[contract.icon] ?? Store;
  const shownRef = useRef(false);

  useEffect(() => {
    if (shownRef.current) return;
    shownRef.current = true;
    recordEconomyOpportunityShown(contract.opportunityType);
    trackActivityCardEvent('ACTIVITY_CARD_SHOWN', {
      cardId: contract.instanceId,
      cardType: contract.opportunityType,
      surface,
    });
  }, [contract.instanceId, contract.opportunityType, surface]);

  const handleAction = useCallback(() => {
    trackActivityCardEvent('ACTIVITY_CARD_CLICKED', {
      cardId: contract.instanceId,
      cardType: contract.opportunityType,
      surface,
    });
  }, [contract.instanceId, contract.opportunityType, surface]);

  const handleDismiss = useCallback(() => {
    recordEconomyOpportunityDismissed(contract.opportunityType);
    trackActivityCardEvent('ACTIVITY_CARD_DISMISSED', {
      cardId: contract.instanceId,
      cardType: contract.opportunityType,
      surface,
    });
    onDismiss?.();
  }, [contract.instanceId, contract.opportunityType, surface, onDismiss]);

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/90 to-white shadow-sm ${compact ? 'p-3' : 'p-4'} ${className}`}
      data-surface-module="economy-opportunity"
      data-opportunity-type={contract.opportunityType}
    >
      {contract.dismissible ? (
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-2 top-2 rounded-full p-1.5 text-gray-400 hover:bg-white/80 hover:text-gray-600"
          aria-label={t('buttons.close')}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}

      <div className={`flex gap-3 ${contract.dismissible ? 'pr-8' : ''}`}>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700/80">
            {t('surfaces.opportunity.band.label')}
          </p>
          <h3 className={`${compact ? 'text-sm' : 'text-base'} mt-0.5 font-bold leading-snug text-gray-900`}>
            {t(contract.titleKey)}
          </h3>
          <p className={`mt-1 ${compact ? 'text-xs' : 'text-sm'} leading-relaxed text-gray-600 line-clamp-3`}>
            {t(contract.descriptionKey)}
          </p>
          {contract.actionHref ? (
            <Link
              href={contract.actionHref}
              onClick={handleAction}
              className={`mt-3 inline-flex min-h-9 items-center justify-center rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-700 ${compact ? 'text-xs px-3' : ''}`}
            >
              {t(contract.actionLabelKey)}
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
