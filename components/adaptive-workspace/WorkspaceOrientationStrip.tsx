'use client';

/**
 * WX Phase 1A.1 — Workspace orientation strip (WDL P4 / P5 / P14).
 * Stronger hierarchy than 1A without reverting to a marketing hero.
 * Answers: Where am I? · What can I do? · What is happening?
 * Primary Create stays in the NavBar command surface (WDL P6).
 */

import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

type Props = {
  className?: string;
};

export default function WorkspaceOrientationStrip({ className }: Props) {
  const { t } = useTranslation();

  const whereLabel = `${t('homePhase1.heroTitleHighlight')}${t('homePhase1.heroTitleAfter')}`;

  return (
    <div
      data-wx-orientation-strip=""
      data-wx-phase="1a.1"
      className={cn(
        'hc-wx-orientation-strip w-full min-w-0',
        'rounded-none sm:rounded-t-2xl border-b border-primary-brand/30',
        'bg-gradient-to-r from-primary-brand via-primary-brand to-emerald-800',
        'text-white',
        'px-4 py-4 sm:px-5 sm:py-5 md:px-6',
        className,
      )}
      role="banner"
      aria-label={t('feed.discoverFiltersHeading')}
    >
      <div className="flex flex-col gap-3 min-w-0">
        <div className="min-w-0">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100/95">
            {t('homeDorpsplein.heroLiveLabel')}
          </p>
          <h1 className="mt-1.5 text-xl sm:text-2xl md:text-[1.65rem] font-bold leading-tight tracking-tight text-white">
            {whereLabel}
          </h1>
          <p className="mt-2 max-w-3xl text-sm sm:text-[0.95rem] leading-snug text-white/90">
            {t('homePhase1.heroValueExchange')}
          </p>
        </div>

        <div
          data-wx-orientation-meta=""
          className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/20 pt-3 text-[11px] sm:text-xs text-emerald-50/95"
        >
          <span className="inline-flex items-center gap-1.5 min-w-0">
            <span className="font-semibold text-white/75 uppercase tracking-wide">
              {t('feed.discoverFiltersHeading')}
            </span>
            <span className="text-white/40" aria-hidden>
              ·
            </span>
            <span className="font-medium text-white">
              {t('homePhase1.ctaDiscover')}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5 min-w-0">
            <span className="font-semibold text-white/75 uppercase tracking-wide">
              {t('homeDorpsplein.quickActionsTitle')}
            </span>
            <span className="text-white/40" aria-hidden>
              ·
            </span>
            <span className="font-medium text-white">
              {t('homePhase1.ctaShare')}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
