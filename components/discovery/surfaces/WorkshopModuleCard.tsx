'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef } from 'react';
import {
  Calendar,
  Clock,
  GraduationCap,
  MapPin,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { WorkshopModuleContract } from '@/lib/discovery/surfaces/surface-contract';
import { trackActivityCardEvent } from '@/lib/discovery/activity-cards/activity-card-analytics';

const ICON_MAP: Record<string, LucideIcon> = {
  GraduationCap,
  Calendar,
  MapPin,
  Clock,
};

export type WorkshopModuleCardProps = {
  contract: WorkshopModuleContract;
  t: (key: string) => string;
  surface?: string;
  className?: string;
  onDismiss?: () => void;
};

export default function WorkshopModuleCard({
  contract,
  t,
  surface = 'desktop_sidebar',
  className = '',
  onDismiss,
}: WorkshopModuleCardProps) {
  const Icon = ICON_MAP[contract.icon] ?? GraduationCap;
  const shownRef = useRef(false);

  useEffect(() => {
    if (shownRef.current) return;
    shownRef.current = true;
    trackActivityCardEvent('ACTIVITY_CARD_SHOWN', {
      cardId: contract.id,
      cardType: contract.moduleId,
      surface,
    });
  }, [contract.id, contract.moduleId, surface]);

  const handleDismiss = useCallback(() => {
    trackActivityCardEvent('ACTIVITY_CARD_DISMISSED', {
      cardId: contract.id,
      cardType: contract.moduleId,
      surface,
    });
    onDismiss?.();
  }, [contract.id, contract.moduleId, onDismiss, surface]);

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-white p-4 shadow-sm ${className}`}
      data-surface-module="workshop"
      data-surface-module-id={contract.moduleId}
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

      <div className="flex gap-3 pr-8">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800/80">
            {t('surfaces.workshops.band.label')}
          </p>
          <h3 className="mt-0.5 text-base font-bold leading-snug text-gray-900">
            {t(contract.titleKey)}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-gray-600 line-clamp-3">
            {t(contract.descriptionKey)}
          </p>
          {contract.actionHref ? (
            <Link
              href={contract.actionHref}
              className="mt-3 inline-flex min-h-9 items-center justify-center rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white hover:bg-amber-700"
            >
              {t(contract.actionLabelKey)}
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
