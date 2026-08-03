'use client';

/**
 * WX Phase 1A.1 — Workspace orientation strip (WDL P4 / P5 / P14).
 * Primary Create stays in the NavBar command surface (WDL P6).
 *
 * WX Phase 1B.4 — Landscape Work Posture: compact chrome.
 * WX Phase 1C.1 — Portrait target ~10–12% viewport; landscape stays minimal.
 */

import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { useLandscapeWorkPosture } from '@/components/adaptive-workspace/WorkspaceChromeProvider';

type Props = {
  className?: string;
};

export default function WorkspaceOrientationStrip({ className }: Props) {
  const { t } = useTranslation();
  const landscape = useLandscapeWorkPosture();
  const compact = landscape.orientationCompact;

  const whereLabel = `${t('homePhase1.heroTitleHighlight')}${t('homePhase1.heroTitleAfter')}`;

  return (
    <div
      data-wx-orientation-strip=""
      data-wx-phase="1c.1"
      data-wx-orientation-compact={compact ? '1' : '0'}
      className={cn(
        'hc-wx-orientation-strip w-full min-w-0',
        'rounded-none sm:rounded-t-2xl border-b border-primary-brand/30',
        'bg-gradient-to-r from-primary-brand via-primary-brand to-emerald-800',
        'text-white',
        compact ? 'px-3 py-1 sm:px-4 sm:py-1.5' : 'px-3 py-2 sm:px-4 sm:py-2.5',
        className,
      )}
      role="banner"
      aria-label={t('feed.discoverFiltersHeading')}
    >
      <div
        className={cn(
          'flex min-w-0 items-center justify-between gap-3',
          compact ? 'gap-2' : 'gap-3',
        )}
      >
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'font-semibold uppercase tracking-[0.14em] text-emerald-100/95',
              compact ? 'text-[9px] leading-none' : 'text-[10px] sm:text-[11px] leading-tight',
            )}
          >
            {t('homeDorpsplein.heroLiveLabel')}
          </p>
          <h1
            className={cn(
              'font-bold tracking-tight text-white truncate',
              compact
                ? 'mt-0.5 text-sm sm:text-base leading-tight'
                : 'mt-0.5 text-base sm:text-lg leading-snug',
            )}
          >
            {whereLabel}
          </h1>
        </div>
        <div
          data-wx-orientation-meta=""
          className={cn(
            'shrink-0 text-right text-emerald-50/90',
            compact ? 'text-[10px] leading-tight' : 'text-[11px] sm:text-xs leading-snug',
          )}
        >
          <span className="font-medium text-white/90">
            {t('homePhase1.ctaDiscover')}
          </span>
          <span className="mx-1 text-white/35" aria-hidden>
            ·
          </span>
          <span className="font-medium text-white/90">
            {t('homePhase1.ctaShare')}
          </span>
        </div>
      </div>
    </div>
  );
}
