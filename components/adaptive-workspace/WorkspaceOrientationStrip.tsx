'use client';

/**
 * WX Phase 1A.1 — Workspace orientation strip (WDL P4 / P5 / P14).
 * Primary Create stays in the NavBar command surface (WDL P6).
 *
 * WX Phase 1B.4 — Landscape Work Posture: compact chrome.
 * WX Phase 1C.1 — Height budget for feed-first portrait.
 * WX Phase 1C.1+ — First-visitor explanation adapts to AvailableSpace.
 */

import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { useLandscapeWorkPosture } from '@/components/adaptive-workspace/WorkspaceChromeProvider';
import { resolveOrientationExplanation } from '@/lib/adaptive-workspace-react/resolve-orientation-explanation';

type Props = {
  className?: string;
};

export default function WorkspaceOrientationStrip({ className }: Props) {
  const { t } = useTranslation();
  const landscape = useLandscapeWorkPosture();
  const explain = resolveOrientationExplanation({
    usableWidthPx: landscape.usableWidthPx,
    usableHeightPx: landscape.usableHeightPx,
  });
  const compact = landscape.orientationCompact || explain.singleLine;
  const level = explain.level;

  const whereLabel = `${t('homePhase1.heroTitleHighlight')}${t('homePhase1.heroTitleAfter')}`;

  const bodyKey =
    level === 'short'
      ? 'homePhase1.orientationExplainShort'
      : level === 'medium'
        ? 'homePhase1.orientationExplainMedium'
        : level === 'full'
          ? 'homePhase1.orientationExplainFull'
          : null;

  const actionsCopy =
    level === 'compact'
      ? t('homePhase1.orientationExplainCompact')
      : t('homePhase1.orientationActions');

  return (
    <div
      data-wx-orientation-strip=""
      data-wx-phase="1c.1"
      data-wx-orientation-compact={compact ? '1' : '0'}
      data-wx-orientation-explain={level}
      className={cn(
        'hc-wx-orientation-strip w-full min-w-0',
        'rounded-none sm:rounded-t-2xl border-b border-primary-brand/30',
        'bg-gradient-to-r from-primary-brand via-primary-brand to-emerald-800',
        'text-white',
        level === 'short' && 'px-3 py-1.5 sm:px-4 sm:py-2',
        level === 'compact' && 'px-3 py-1 sm:px-4 sm:py-1.5',
        level === 'medium' && 'px-3 py-2 sm:px-5 sm:py-2.5',
        level === 'full' && 'px-4 py-3 sm:px-6 sm:py-3.5',
        className,
      )}
      role="banner"
      aria-label={t('homePhase1.orientationIdentity')}
    >
      <div
        className={cn(
          'flex min-w-0',
          explain.singleLine
            ? 'flex-row items-center justify-between gap-2'
            : 'flex-col gap-1 sm:gap-1.5',
        )}
      >
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'font-semibold uppercase tracking-[0.14em] text-emerald-100/95',
              compact ? 'text-[9px] leading-none' : 'text-[10px] sm:text-[11px] leading-tight',
            )}
          >
            {t('homePhase1.orientationIdentity')}
          </p>
          <h1
            className={cn(
              'font-bold tracking-tight text-white',
              compact
                ? 'mt-0.5 text-sm sm:text-base leading-tight truncate'
                : level === 'full'
                  ? 'mt-0.5 text-lg sm:text-xl md:text-[1.35rem] leading-snug'
                  : 'mt-0.5 text-base sm:text-lg leading-snug',
            )}
          >
            {whereLabel}
          </h1>

          {explain.showBody && bodyKey ? (
            <p
              data-wx-orientation-explain-body=""
              className={cn(
                'text-white/90',
                level === 'short' &&
                  'mt-0.5 text-[11px] sm:text-xs leading-snug line-clamp-2',
                level === 'medium' &&
                  'mt-1 max-w-3xl text-xs sm:text-sm leading-snug line-clamp-3',
                level === 'full' &&
                  'mt-1.5 max-w-4xl text-sm leading-snug line-clamp-3',
              )}
            >
              {t(bodyKey)}
            </p>
          ) : null}
        </div>

        {explain.showActions ? (
          <div
            data-wx-orientation-meta=""
            data-wx-orientation-actions=""
            className={cn(
              'min-w-0 text-emerald-50/95',
              explain.singleLine
                ? 'shrink-0 max-w-[55%] text-right text-[10px] leading-tight'
                : cn(
                    'border-t border-white/15 pt-1.5',
                    level === 'full'
                      ? 'text-[11px] sm:text-xs'
                      : 'text-[10px] sm:text-[11px]',
                  ),
            )}
          >
            <span className="font-medium text-white/95">{actionsCopy}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
