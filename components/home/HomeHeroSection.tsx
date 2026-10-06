'use client';

import { useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { useCreateFlow } from '@/components/create/CreateFlowContext';
import { useGuestBottomNavPanel } from '@/hooks/useGuestBottomNavPanel';
import HomeHeroCollapsible from '@/components/home/HomeHeroCollapsible';
import { useHeroGeoContext } from '@/lib/home/use-hero-geo-context';

const ctaPrimaryClass = cn(
  'hc-btn-secondary inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 py-1.5',
  'text-sm font-semibold whitespace-nowrap touch-manipulation',
);

/**
 * Single compact Marketplace header — identity, ecosystem nav, one-line context, clear CTA.
 * Replaces stacked HomepageEcosystemSignal + large dorpsplein hero.
 */
export default function HomeHeroSection() {
  const { t, language } = useTranslation();
  const { data: session, status } = useSession();
  const { openCreateFlow } = useCreateFlow();
  const { handleGuestCreateClick, guestBottomNavPanelEl } = useGuestBottomNavPanel();

  const heroGeo = useHeroGeoContext();
  const isGuest = status !== 'loading' && !session?.user;
  const isEn = language === 'en';
  const seoEverybodyEats = isEn ? 'Everybody Eats.' : 'Everybody Eats. Iedereen eet mee.';

  const handleShareClick = useCallback(() => {
    if (isGuest) {
      handleGuestCreateClick();
      return;
    }
    openCreateFlow();
  }, [isGuest, handleGuestCreateClick, openCreateFlow]);

  return (
    <>
      <HomeHeroCollapsible>
      <section
        className="relative mb-1 overflow-hidden border-b border-[var(--hc-border-quiet)] bg-[var(--hc-surface-page)] sm:mb-1.5"
        aria-labelledby="home-compact-header-title"
        data-hc-ecosystem-participation-signal="1"
      >
        <div className="relative z-[1] px-3 py-1.5 sm:px-4">
          {/* Row 1 — identity + ecosystem navigation */}
          <p className="sr-only">
            HomeCheff. {t('homePhase1.orientationIdentityGeneric')}
          </p>

          <div className="flex min-w-0 items-center justify-between gap-2">
            <h1
              id="home-compact-header-title"
              className="min-w-0 truncate text-sm font-semibold leading-snug tracking-tight text-[var(--hc-text)] sm:text-base"
            >
              {heroGeo.city
                ? t('homePhase1.orientationTitleInCity', { city: heroGeo.city })
                : t('homePhase1.orientationTitle')}
            </h1>
            <p className="sr-only">{t('homeCompactHeader.supportLine')}</p>
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
      </HomeHeroCollapsible>

      {guestBottomNavPanelEl}
    </>
  );
}
