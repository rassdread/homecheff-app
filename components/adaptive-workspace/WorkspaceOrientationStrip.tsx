'use client';

/**
 * Workspace orientation strip — Model B first impression (multi-persona UX).
 *
 * Presentation only. Sacred HomeCheff meaning stays complete at every level.
 * Landscape chrome stays compact (WX 1B.4).
 * Short landscape single bar (WX 1B.4.1): logo + context + create + menu.
 *
 * Model B: identity + complete title + one body + Discover / Sell CTAs.
 * Keyword strip and “with or without money” are not primary fold chrome.
 */

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { Compass, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { useSession } from 'next-auth/react';
import { useCreateFlow } from '@/components/create/CreateFlowContext';
import { useGuestBottomNavPanel } from '@/hooks/useGuestBottomNavPanel';
import { scrollToHomeFeed } from '@/lib/guest/guest-explanation-panels';
import type { GuestSalesPanelId } from '@/lib/guest/guest-explanation-panels';
import { useLandscapeWorkPosture } from '@/components/adaptive-workspace/WorkspaceChromeProvider';
import LandscapeWorkBarCommands from '@/components/adaptive-workspace/LandscapeWorkBarCommands';
import { resolveOrientationExplanation } from '@/lib/adaptive-workspace-react/resolve-orientation-explanation';

const GuestSalesInfoPanel = dynamic(
  () => import('@/components/home/GuestSalesInfoPanel'),
  { ssr: false },
);

type Props = {
  className?: string;
};

const ctaPrimaryClass = cn(
  'inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl px-3.5 py-1.5',
  'text-sm font-bold bg-white text-primary-brand shadow-md',
  'hover:bg-primary-50 touch-manipulation transition-colors',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-brand',
);

const ctaSecondaryClass = cn(
  'inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl px-3.5 py-1.5',
  'text-sm font-semibold bg-white/15 text-white border border-white/50 backdrop-blur-md',
  'hover:bg-white/25 touch-manipulation transition-colors',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-brand',
);

export default function WorkspaceOrientationStrip({ className }: Props) {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const { openCreateFlow } = useCreateFlow();
  const { handleGuestCreateClick, guestBottomNavPanelEl } = useGuestBottomNavPanel();
  const [guestSalesPanel, setGuestSalesPanel] = useState<GuestSalesPanelId | null>(null);
  const landscape = useLandscapeWorkPosture();
  const explain = resolveOrientationExplanation({
    usableWidthPx: landscape.usableWidthPx,
    usableHeightPx: landscape.usableHeightPx,
  });
  const level = explain.level;
  const landscapePosture = landscape.orientationCompact || explain.singleLine;
  const workToolbar = landscape.shortChromeCompact && explain.singleLine;
  const singleBar = workToolbar;
  const isGuest = status !== 'loading' && !session?.user;

  const whereLabel = t('homePhase1.orientationTitle');
  const identityLabel = t('homePhase1.orientationIdentity');
  const actionsPrimary = t('homePhase1.orientationActionPrimary');
  const actionsSecondary = t('homePhase1.orientationActionSecondary');

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

  // Model B: secondary / support / keyword strip out of primary fold.
  // Value-exchange hint only on rich (wide desktop) — not first-screen chrome.
  const valueExchangeHint =
    level === 'rich' ? t('homePhase1.orientationValueExchangeHint') : null;

  const bannerAria = workToolbar
    ? `${identityLabel}. ${whereLabel}. ${primaryBody}. ${actionsPrimary}`
    : identityLabel;

  const onDiscover = useCallback(() => {
    scrollToHomeFeed();
  }, []);

  const onShare = useCallback(() => {
    if (isGuest) {
      if (landscape.usableWidthPx < 1024) {
        handleGuestCreateClick();
        return;
      }
      setGuestSalesPanel('share');
      return;
    }
    openCreateFlow();
  }, [isGuest, handleGuestCreateClick, openCreateFlow, landscape.usableWidthPx]);

  return (
    <>
      <div
        data-wx-orientation-strip=""
        data-wx-orientation-model="B"
        data-wx-phase={singleBar ? '1b.4.1' : 'mp-ux-b'}
        data-wx-orientation-compact={landscapePosture ? '1' : '0'}
        data-wx-orientation-explain={level}
        data-wx-orientation-budget={explain.chromeBudget}
        data-wx-orientation-complete="1"
        data-wx-work-toolbar={workToolbar ? '1' : '0'}
        data-wx-single-bar={singleBar ? '1' : '0'}
        className={cn(
          'hc-wx-orientation-strip w-full min-w-0',
          'rounded-none sm:rounded-t-2xl border-b border-primary-brand/30',
          'bg-gradient-to-r from-primary-brand via-primary-brand to-emerald-800',
          'text-white',
          singleBar && 'hc-wx-single-workbar',
          !singleBar && workToolbar && 'px-3 py-1 sm:px-4',
          !workToolbar && level === 'ultra_compact' && 'px-3 py-1.5 sm:px-4',
          level === 'compact_complete' && 'px-3 py-2 sm:px-4 sm:py-2',
          level === 'standard_complete' && 'px-3 py-2 sm:px-5 sm:py-2.5',
          level === 'expanded' && 'px-3 py-2.5 sm:px-5 sm:py-3',
          level === 'rich' && 'px-4 py-3 sm:px-6 sm:py-3.5',
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

        {singleBar ? (
          <LandscapeWorkBarCommands contextLabel={whereLabel} />
        ) : (
          <div
            className={cn(
              'flex min-w-0',
              explain.singleLine || workToolbar
                ? 'flex-row items-center justify-between gap-2'
                : 'flex-col gap-1.5',
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
                    'truncate text-[clamp(0.875rem,2.4vw,1.05rem)] leading-snug',
                  level === 'ultra_compact' &&
                    !workToolbar &&
                    'mt-0.5 text-[clamp(0.95rem,3vw,1.15rem)] leading-snug line-clamp-2',
                  level === 'compact_complete' &&
                    'mt-0.5 text-[clamp(1rem,3.2vw,1.25rem)] leading-snug',
                  level === 'standard_complete' &&
                    'mt-1 text-[clamp(1.05rem,3.2vw,1.35rem)] leading-snug max-w-3xl',
                  level === 'expanded' &&
                    'mt-1 text-[clamp(1.1rem,2.6vw,1.45rem)] leading-snug max-w-3xl',
                  level === 'rich' &&
                    'mt-1 text-[clamp(1.15rem,2.2vw,1.55rem)] leading-snug max-w-4xl',
                )}
              >
                {whereLabel}
              </h1>

              {explain.showBody && !workToolbar && !explain.singleLine ? (
                <p
                  data-wx-orientation-explain-body=""
                  className={cn(
                    'text-white/90',
                    level === 'compact_complete' &&
                      'mt-1 text-[clamp(0.7rem,2vw,0.8rem)] leading-snug line-clamp-2',
                    level === 'standard_complete' &&
                      'mt-1 max-w-3xl text-[clamp(0.75rem,2vw,0.9rem)] leading-snug',
                    level === 'expanded' &&
                      'mt-1.5 max-w-3xl text-[clamp(0.8rem,1.8vw,0.95rem)] leading-snug',
                    level === 'rich' &&
                      'mt-1.5 max-w-4xl text-[clamp(0.85rem,1.5vw,1rem)] leading-snug',
                  )}
                >
                  {primaryBody}
                </p>
              ) : null}

              {valueExchangeHint ? (
                <p
                  data-wx-orientation-value-exchange=""
                  className="mt-1 max-w-3xl text-[clamp(0.7rem,1.4vw,0.8rem)] leading-snug text-emerald-50/90"
                >
                  {valueExchangeHint}
                </p>
              ) : null}
            </div>

            {!workToolbar && !explain.singleLine ? (
              <div
                data-wx-orientation-meta=""
                data-wx-orientation-actions=""
                data-wx-orientation-cta=""
                className="flex flex-wrap items-center gap-2 pt-0.5"
              >
                <button type="button" onClick={onDiscover} className={ctaPrimaryClass}>
                  <Compass className="h-4 w-4 shrink-0" aria-hidden />
                  {actionsPrimary}
                </button>
                <button type="button" onClick={onShare} className={ctaSecondaryClass}>
                  <Plus className="h-4 w-4 shrink-0" aria-hidden />
                  {actionsSecondary}
                </button>
              </div>
            ) : explain.showActions && (workToolbar || explain.singleLine) ? (
              <div
                data-wx-orientation-meta=""
                data-wx-orientation-actions=""
                className="shrink-0 max-w-[48%] text-right text-[clamp(0.6rem,1.6vw,0.7rem)] leading-tight text-emerald-50/95"
              >
                <span className="font-medium text-white/95">{actionsPrimary}</span>
              </div>
            ) : null}
          </div>
        )}
      </div>
      {guestBottomNavPanelEl}
      {isGuest ? (
        <GuestSalesInfoPanel panel={guestSalesPanel} onClose={() => setGuestSalesPanel(null)} />
      ) : null}
    </>
  );
}
