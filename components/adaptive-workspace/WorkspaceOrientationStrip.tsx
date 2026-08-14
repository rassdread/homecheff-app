'use client';

/**
 * Workspace orientation strip — Available Space messaging (WX Phase 1C.2).
 *
 * Presentation only. Sacred HomeCheff meaning stays complete at every level.
 * Landscape chrome stays compact (WX 1B.4).
 * Short landscape uses a one-line work toolbar (visual density only).
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
  const level = explain.level;
  const landscapePosture = landscape.orientationCompact || explain.singleLine;
  /** One-line visual toolbar — meaning kept via aria-label + sr-only copy. */
  const workToolbar =
    landscape.shortChromeCompact && explain.singleLine;

  const whereLabel = `${t('homePhase1.heroTitleHighlight')}${t('homePhase1.heroTitleAfter')}`;

  const primaryBody =
    level === 'ultra_compact'
      ? t('homePhase1.orientationExplainUltra')
      : level === 'compact_complete'
        ? t('homePhase1.orientationExplainCompactPrimary')
        : level === 'standard_complete'
          ? t('homePhase1.orientationExplainStandard')
          : level === 'expanded'
            ? t('homePhase1.orientationExplainExpanded')
            : t('homePhase1.orientationExplainRich');

  const secondaryBody =
    level === 'compact_complete'
      ? t('homePhase1.orientationExplainCompactSecondary')
      : null;

  const supportBody =
    explain.showSupport ? t('homePhase1.orientationExplainSupport') : null;

  const examplesBody =
    explain.showExamples ? t('homePhase1.orientationExplainExamples') : null;

  const actionsPrimary = t('homePhase1.orientationActionPrimary');
  const actionsSecondary = t('homePhase1.orientationActionSecondary');
  const actionsRow =
    level === 'ultra_compact'
      ? actionsPrimary
      : level === 'compact_complete'
        ? `${actionsPrimary} · ${actionsSecondary}`
        : t('homePhase1.orientationActions');

  const identityLabel = t('homePhase1.orientationIdentity');
  const bannerAria = workToolbar
    ? `${identityLabel}. ${whereLabel}. ${primaryBody}. ${actionsPrimary}`
    : identityLabel;

  return (
    <div
      data-wx-orientation-strip=""
      data-wx-phase="1c.2"
      data-wx-orientation-compact={landscapePosture ? '1' : '0'}
      data-wx-orientation-explain={level}
      data-wx-orientation-budget={explain.chromeBudget}
      data-wx-orientation-complete="1"
      data-wx-work-toolbar={workToolbar ? '1' : '0'}
      className={cn(
        'hc-wx-orientation-strip w-full min-w-0',
        'rounded-none sm:rounded-t-2xl border-b border-primary-brand/30',
        'bg-gradient-to-r from-primary-brand via-primary-brand to-emerald-800',
        'text-white',
        workToolbar && 'px-3 py-1 sm:px-4',
        !workToolbar && level === 'ultra_compact' && 'px-3 py-1 sm:px-4 sm:py-1.5',
        level === 'compact_complete' && 'px-3 py-2 sm:px-4 sm:py-2.5',
        level === 'standard_complete' && 'px-3 py-2.5 sm:px-5 sm:py-3',
        level === 'expanded' && 'px-3 py-3 sm:px-5 sm:py-3.5',
        level === 'rich' && 'px-4 py-3.5 sm:px-6 sm:py-4',
        className,
      )}
      role="banner"
      aria-label={bannerAria}
    >
      {workToolbar ? (
        <p className="sr-only" data-wx-orientation-meaning="">
          {identityLabel}. {whereLabel}. {primaryBody}. {actionsPrimary}
        </p>
      ) : null}

      <div
        className={cn(
          'flex min-w-0',
          explain.singleLine || workToolbar
            ? 'flex-row items-center justify-between gap-2'
            : 'flex-col gap-1 sm:gap-1.5',
        )}
      >
        <div className="min-w-0 flex-1">
          {!workToolbar ? (
            <p
              data-wx-orientation-identity=""
              className={cn(
                'font-semibold uppercase tracking-[0.14em] text-emerald-100/95',
                explain.singleLine
                  ? 'text-[9px] leading-tight'
                  : 'text-[10px] sm:text-[11px] leading-tight',
              )}
            >
              {identityLabel}
            </p>
          ) : null}
          <h1
            data-wx-orientation-title=""
            className={cn(
              'font-bold tracking-tight text-white',
              workToolbar &&
                'truncate text-[clamp(0.8rem,2vw,0.95rem)] leading-none',
              !workToolbar &&
                explain.singleLine &&
                'mt-0.5 text-[clamp(0.875rem,2.4vw,1.05rem)] leading-snug',
              level === 'compact_complete' &&
                'mt-0.5 text-[clamp(1rem,3.2vw,1.2rem)] leading-snug',
              level === 'standard_complete' &&
                'mt-1 text-[clamp(1.05rem,3.4vw,1.35rem)] leading-snug',
              level === 'expanded' &&
                'mt-1 text-[clamp(1.15rem,2.8vw,1.5rem)] leading-snug',
              level === 'rich' &&
                'mt-1.5 text-[clamp(1.2rem,2.2vw,1.65rem)] leading-snug',
            )}
          >
            {whereLabel}
          </h1>

          {explain.showBody && !workToolbar ? (
            <p
              data-wx-orientation-explain-body=""
              className={cn(
                'text-white/90',
                explain.singleLine &&
                  'mt-0.5 text-[clamp(0.65rem,1.8vw,0.75rem)] leading-snug',
                level === 'compact_complete' &&
                  'mt-1 text-[clamp(0.7rem,2vw,0.8rem)] leading-snug',
                level === 'standard_complete' &&
                  'mt-1 max-w-3xl text-[clamp(0.75rem,2.1vw,0.9rem)] leading-snug',
                level === 'expanded' &&
                  'mt-1.5 max-w-3xl text-[clamp(0.8rem,1.8vw,0.95rem)] leading-snug',
                level === 'rich' &&
                  'mt-1.5 max-w-4xl text-[clamp(0.85rem,1.5vw,1rem)] leading-snug',
              )}
            >
              {primaryBody}
            </p>
          ) : null}

          {explain.showSecondaryBody && secondaryBody ? (
            <p
              data-wx-orientation-explain-secondary=""
              className="mt-0.5 max-w-3xl text-[clamp(0.7rem,2vw,0.8rem)] leading-snug text-white/85"
            >
              {secondaryBody}
            </p>
          ) : null}

          {supportBody ? (
            <p
              data-wx-orientation-explain-support=""
              className="mt-1 max-w-3xl text-[clamp(0.75rem,1.6vw,0.9rem)] leading-snug text-white/85"
            >
              {supportBody}
            </p>
          ) : null}

          {examplesBody ? (
            <p
              data-wx-orientation-explain-examples=""
              className="mt-1 max-w-4xl text-[clamp(0.75rem,1.4vw,0.875rem)] leading-snug text-emerald-50/90"
            >
              {examplesBody}
            </p>
          ) : null}
        </div>

        {explain.showActions ? (
          <div
            data-wx-orientation-meta=""
            data-wx-orientation-actions=""
            className={cn(
              'min-w-0 text-emerald-50/95',
              workToolbar || explain.singleLine
                ? 'shrink-0 max-w-[48%] text-right text-[clamp(0.6rem,1.6vw,0.7rem)] leading-tight'
                : cn(
                    'border-t border-white/15 pt-1.5',
                    level === 'rich' || level === 'expanded'
                      ? 'text-[clamp(0.7rem,1.4vw,0.8rem)]'
                      : 'text-[clamp(0.65rem,1.8vw,0.75rem)]',
                  ),
            )}
          >
            <span className="font-medium text-white/95">{actionsRow}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
