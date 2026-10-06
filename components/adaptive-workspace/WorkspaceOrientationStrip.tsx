'use client';

/**
 * Workspace orientation strip — Model B first impression (multi-persona UX).
 *
 * Presentation only. Sacred HomeCheff meaning stays complete at every level.
 * Landscape chrome stays compact (WX 1B.4).
 * Short landscape single bar (WX 1B.4.1): logo + context + create + menu.
 *
 * Model B: identity + complete title + one body + primary Sell/Offer CTA.
 * Keyword strip and “with or without money” are not primary fold chrome.
 */

import { useCallback, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { useSession } from 'next-auth/react';
import { useCreateFlow } from '@/components/create/CreateFlowContext';
import { useGuestBottomNavPanel } from '@/hooks/useGuestBottomNavPanel';
import type { GuestSalesPanelId } from '@/lib/guest/guest-explanation-panels';
import { useLandscapeWorkPosture } from '@/components/adaptive-workspace/WorkspaceChromeProvider';
import LandscapeWorkBarCommands from '@/components/adaptive-workspace/LandscapeWorkBarCommands';
import { resolveOrientationExplanation } from '@/lib/adaptive-workspace-react/resolve-orientation-explanation';
import HomeHeroCollapsible from '@/components/home/HomeHeroCollapsible';
import { useHeroGeoContext } from '@/lib/home/use-hero-geo-context';
import HomeValueExplainerDialog from '@/components/home/HomeValueExplainerDialog';

const GuestSalesInfoPanel = dynamic(
  () => import('@/components/home/GuestSalesInfoPanel'),
  { ssr: false },
);

type Props = {
  className?: string;
  /**
   * Marketplace keeps a short headline so supply can start in the first viewport.
   * Workspace keeps the fuller orientation strip.
   */
  variant?: 'marketplace' | 'workspace';
};

const ctaPrimaryClass = cn(
  'hc-btn-primary min-h-[40px] shrink-0 gap-1.5 rounded-xl px-3.5 py-1.5',
  'text-sm font-semibold whitespace-nowrap touch-manipulation',
);

const ctaExplainClass = cn(
  'inline-flex min-h-[44px] items-center text-left',
  'text-xs font-medium text-[var(--hc-blue)] underline-offset-2 hover:underline',
  'touch-manipulation',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hc-focus)]',
);

export default function WorkspaceOrientationStrip({
  className,
  variant = 'workspace',
}: Props) {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const { openCreateFlow } = useCreateFlow();
  const { handleGuestCreateClick, guestBottomNavPanelEl } = useGuestBottomNavPanel();
  const [guestSalesPanel, setGuestSalesPanel] = useState<GuestSalesPanelId | null>(null);
  const [valueExplainerOpen, setValueExplainerOpen] = useState(false);
  const valueExplainerTriggerRef = useRef<HTMLButtonElement>(null);
  const closeValueExplainer = useCallback(() => setValueExplainerOpen(false), []);
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

  const heroGeo = useHeroGeoContext();
  const whereLabel = heroGeo.city
    ? t('homePhase1.orientationTitleInCity', { city: heroGeo.city })
    : t('homePhase1.orientationTitle');
  const identityLabel = t('homePhase1.orientationIdentityGeneric');
  const actionsSecondary = t('homePhase1.orientationActionSecondary');

  const primaryBody =
    level === 'ultra_compact'
      ? t('homePhase1.orientationExplainUltra')
      : level === 'compact_complete'
        ? t('homePhase1.orientationExplainCompactPrimary')
        : t('homePhase1.orientationExplainSupport');

  // Model B: secondary / support / keyword strip out of primary fold.
  // Value-exchange hint only on rich (wide desktop) — not first-screen chrome.
  const valueExchangeHint =
    level === 'rich' ? t('homePhase1.orientationValueExchangeHint') : null;

  const bannerAria = workToolbar
    ? `${identityLabel}. ${whereLabel}. ${primaryBody}. ${actionsSecondary}`
    : identityLabel;

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

  if (variant === 'marketplace') {
    return (
      <>
      <div
        data-wx-orientation-strip=""
        data-wx-orientation-model="B"
        data-hc-orientation-density="marketplace"
        className={cn(
          'hc-wx-orientation-strip w-full min-w-0',
          'border-b border-[var(--hc-border-quiet)] bg-[var(--hc-surface-page)]',
          'px-3 py-1.5 sm:px-4',
          className,
        )}
        role="banner"
        aria-label={whereLabel}
      >
        <div className="grid min-w-0 grid-cols-1 items-start gap-1 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-baseline xl:gap-3">
          <h1
            data-testid="home-hero-title"
            data-hero-city={heroGeo.city ?? ''}
            data-wx-orientation-title=""
            className="min-w-0 text-sm font-semibold leading-snug tracking-tight text-[var(--hc-text)] sm:text-base xl:truncate"
          >
            {whereLabel}
          </h1>
          <button
            ref={valueExplainerTriggerRef}
            type="button"
            data-hc-value-explainer-trigger=""
            onClick={() => setValueExplainerOpen(true)}
            className="justify-self-start text-left text-xs font-medium leading-snug text-[var(--hc-blue)] underline-offset-2 hover:underline xl:justify-self-end"
            aria-haspopup="dialog"
            aria-expanded={valueExplainerOpen}
          >
            {t('homeValueExplainer.trigger')}
          </button>
        </div>
        <p className="sr-only" data-wx-orientation-explain-body="">
          {t('homePhase1.orientationExplainCompactPrimary')}
        </p>
      </div>
      <HomeValueExplainerDialog
        open={valueExplainerOpen}
        onClose={closeValueExplainer}
        onStartOffering={onShare}
        returnFocusRef={valueExplainerTriggerRef}
      />
      </>
    );
  }

  if (!singleBar) return null;

  return (
    <>
      <HomeHeroCollapsible>
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
          'rounded-none border-b border-[var(--hc-border-quiet)] sm:rounded-t-2xl',
          'bg-[var(--hc-surface-page)] text-[var(--hc-text)]',
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
            {identityLabel}. {whereLabel}. {primaryBody}. {actionsSecondary}
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
                    'font-semibold uppercase tracking-[0.14em] text-[var(--hc-blue)]',
                    explain.singleLine
                      ? 'text-[9px] leading-tight'
                      : 'text-[10px] sm:text-[11px] leading-tight',
                  )}
                >
                  {identityLabel}
                </p>
              ) : null}
              <h1
                data-testid="home-hero-title"
                data-hero-city={heroGeo.city ?? ''}
                data-wx-orientation-title=""
                className={cn(
                  'font-bold tracking-tight text-[var(--hc-text)]',
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
                    'text-[var(--hc-text-secondary)]',
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
                  className="mt-1 max-w-3xl text-[clamp(0.7rem,1.4vw,0.8rem)] leading-snug text-[var(--hc-text-secondary)]"
                >
                  {valueExchangeHint}
                </p>
              ) : null}

              {!workToolbar && !explain.singleLine ? (
                <div
                  data-wx-orientation-trust=""
                  className="mt-1.5 flex flex-wrap gap-1.5"
                >
                  <span className="rounded-md border border-[var(--hc-border-quiet)] bg-[var(--hc-surface-card)] px-2 py-0.5 text-[10px] font-medium text-[var(--hc-text-secondary)] sm:text-[11px]">
                    {t('homePhase1.orientationTrustCategories')}
                  </span>
                  <span className="rounded-md border border-[var(--hc-border-quiet)] bg-[var(--hc-surface-card)] px-2 py-0.5 text-[10px] font-medium text-[var(--hc-text-secondary)] sm:text-[11px]">
                    {t('homePhase1.orientationTrustSecurePay')}
                  </span>
                  <span className="rounded-md border border-[var(--hc-border-quiet)] bg-[var(--hc-surface-card)] px-2 py-0.5 text-[10px] font-medium text-[var(--hc-text-secondary)] sm:text-[11px]">
                    {t('homePhase1.orientationTrustPickup')}
                  </span>
                  <span className="rounded-md border border-[var(--hc-border-quiet)] bg-[var(--hc-surface-card)] px-2 py-0.5 text-[10px] font-medium text-[var(--hc-text-secondary)] sm:text-[11px]">
                    {t('homePhase1.orientationTrustRealPeople')}
                  </span>
                </div>
              ) : null}
            </div>

            {!workToolbar && !explain.singleLine ? (
              <div
                data-wx-orientation-meta=""
                data-wx-orientation-actions=""
                data-wx-orientation-cta=""
                className="flex flex-wrap items-center gap-2 pt-0.5"
              >
                <button
                  type="button"
                  data-wx-primary-action=""
                  data-wx-seller-cta=""
                  onClick={onShare}
                  className={ctaPrimaryClass}
                  aria-label={t('homePhase1.ctaShare')}
                >
                  <Plus className="h-4 w-4 shrink-0" aria-hidden />
                  <span>{t('homePhase1.ctaShare')}</span>
                </button>
                <button
                  ref={valueExplainerTriggerRef}
                  type="button"
                  data-hc-value-explainer-trigger=""
                  onClick={() => setValueExplainerOpen(true)}
                  className={ctaExplainClass}
                  aria-haspopup="dialog"
                  aria-expanded={valueExplainerOpen}
                >
                  {t('homeValueExplainer.trigger')}
                </button>
              </div>
            ) : explain.showActions && (workToolbar || explain.singleLine) ? (
              <div
                data-wx-orientation-meta=""
                data-wx-orientation-actions=""
                className="shrink-0 max-w-[48%] text-right text-[clamp(0.6rem,1.6vw,0.7rem)] leading-tight text-[var(--hc-text-secondary)]"
              >
                <span className="font-medium text-[var(--hc-text)]">{actionsSecondary}</span>
              </div>
            ) : null}
          </div>
        )}
      </div>
      </HomeHeroCollapsible>
      {guestBottomNavPanelEl}
      <HomeValueExplainerDialog
        open={valueExplainerOpen}
        onClose={closeValueExplainer}
        onStartOffering={onShare}
        returnFocusRef={valueExplainerTriggerRef}
      />
      {isGuest ? (
        <GuestSalesInfoPanel panel={guestSalesPanel} onClose={() => setGuestSalesPanel(null)} />
      ) : null}
    </>
  );
}
