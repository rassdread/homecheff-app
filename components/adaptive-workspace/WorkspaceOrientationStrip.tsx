'use client';

/**
 * WX Phase 1A — Workspace orientation strip (WDL P4 / P5 / P14).
 * Compact chrome that spans the full Workspace — not a marketing billboard.
 * Primary Create lives in the NavBar command surface (WDL P6 — one dominant action).
 */

import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

type Props = {
  className?: string;
};

export default function WorkspaceOrientationStrip({ className }: Props) {
  const { t } = useTranslation();

  return (
    <div
      data-wx-orientation-strip=""
      data-wx-phase="1a"
      className={cn(
        'hc-wx-orientation-strip w-full min-w-0',
        'flex items-center gap-3',
        'rounded-xl border border-primary-brand/15 bg-primary-brand text-white',
        'px-3 py-2 sm:px-4 sm:py-2.5',
        className,
      )}
      role="banner"
      aria-label={t('feed.discoverFiltersHeading')}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-white/80">
          {t('homeDorpsplein.heroLiveLabel')}
        </p>
        <h1 className="text-sm sm:text-base font-bold leading-tight tracking-tight line-clamp-1">
          {t('homePhase1.heroTitleHighlight')}
          {t('homePhase1.heroTitleAfter')}
        </h1>
        <p className="hidden sm:block text-[11px] text-white/85 line-clamp-1 mt-0.5">
          {t('homePhase1.heroValueExchange')}
        </p>
      </div>
    </div>
  );
}
