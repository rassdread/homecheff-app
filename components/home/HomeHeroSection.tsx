'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { Compass, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { useCreateFlow } from '@/components/create/CreateFlowContext';
import { useGuestBottomNavPanel } from '@/hooks/useGuestBottomNavPanel';
import type { GuestSalesPanelId } from '@/lib/guest/guest-explanation-panels';
import { scrollToHomeFeed } from '@/lib/guest/guest-explanation-panels';
import HomepageEcosystemNavLinks from '@/components/home/HomepageEcosystemNavLinks';

const GuestSalesInfoPanel = dynamic(
  () => import('@/components/home/GuestSalesInfoPanel'),
  { ssr: false },
);

const ctaPrimaryClass = cn(
  'inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-xl px-3.5 py-2',
  'text-sm font-bold bg-white text-primary-brand shadow-md whitespace-nowrap',
  'hover:bg-primary-50 touch-manipulation transition-colors',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-brand',
);

const ctaSecondaryClass = cn(
  'inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 py-2',
  'text-sm font-semibold bg-white/15 text-white border border-white/45 backdrop-blur-sm whitespace-nowrap',
  'hover:bg-white/25 touch-manipulation transition-colors',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-brand',
);

/**
 * Single compact Marketplace header — identity, ecosystem nav, one-line context, clear CTAs.
 * Replaces stacked HomepageEcosystemSignal + large dorpsplein hero.
 */
export default function HomeHeroSection() {
  const { t, language } = useTranslation();
  const { data: session, status } = useSession();
  const { openCreateFlow } = useCreateFlow();
  const { handleGuestCreateClick, guestBottomNavPanelEl } = useGuestBottomNavPanel();
  const [guestSalesPanel, setGuestSalesPanel] = useState<GuestSalesPanelId | null>(null);

  const isGuest = status !== 'loading' && !session?.user;
  const isEn = language === 'en';
  const seoEverybodyEats = isEn ? 'Everybody Eats.' : 'Everybody Eats. Iedereen eet mee.';

  const scrollToFeed = useCallback(() => {
    scrollToHomeFeed();
  }, []);

  const handleShareClick = useCallback(() => {
    if (isGuest) {
      handleGuestCreateClick();
      return;
    }
    openCreateFlow();
  }, [isGuest, handleGuestCreateClick, openCreateFlow]);

  const handleDiscoverClick = useCallback(() => {
    if (isGuest) {
      setGuestSalesPanel('discover');
      return;
    }
    scrollToFeed();
  }, [isGuest, scrollToFeed]);

  return (
    <>
      <section
        className="relative overflow-hidden rounded-xl xl:rounded-2xl hc-hero-dorpsplein mb-1 sm:mb-1.5 shadow-md"
        aria-labelledby="home-compact-header-title"
        data-hc-ecosystem-participation-signal="1"
      >
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary-brand via-[#007a5c] to-secondary-brand"
          aria-hidden
        />

        <div className="relative z-[1] px-3 py-2 sm:px-4 sm:py-2.5 xl:px-5 xl:py-3">
          {/* Row 1 — identity + ecosystem navigation */}
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <p className="text-[11px] sm:text-xs font-semibold text-white/95 tracking-tight">
              HomeCheff — {t('homePhase1.orientationIdentity')}
            </p>
            <HomepageEcosystemNavLinks tone="onHero" className="sm:justify-end" />
          </div>

          {/* Row 2 — title + supporting line (single explanation block) */}
          <div className="mt-1.5 sm:mt-2 min-w-0">
            <h1
              id="home-compact-header-title"
              className="text-sm sm:text-base xl:text-lg font-extrabold text-white leading-snug tracking-tight line-clamp-2"
            >
              {t('homePhase1.orientationExplainUltra')}
            </h1>
            <p className="mt-0.5 text-[11px] sm:text-xs text-white/85 line-clamp-2 leading-snug max-w-3xl">
              {t('homeCompactHeader.supportLine')}
            </p>
          </div>

          {/* Row 3 — labeled CTAs (no icon-only controls) */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDiscoverClick}
              className={ctaSecondaryClass}
              aria-label={t('homePhase1.ctaDiscover')}
            >
              <Compass className="h-4 w-4 shrink-0" aria-hidden />
              <span>{t('homePhase1.ctaDiscover')}</span>
            </button>
            <button
              type="button"
              data-wx-primary-action=""
              onClick={handleShareClick}
              className={ctaPrimaryClass}
              aria-label={t('homePhase1.ctaShare')}
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden />
              <span>{t('homePhase1.ctaShare')}</span>
            </button>
          </div>

          {/* Crawlable SEO copy — not a second visual band */}
          <p className="sr-only">{seoEverybodyEats}</p>
        </div>
      </section>

      {guestBottomNavPanelEl}
      {isGuest ? (
        <GuestSalesInfoPanel panel={guestSalesPanel} onClose={() => setGuestSalesPanel(null)} />
      ) : null}
    </>
  );
}
