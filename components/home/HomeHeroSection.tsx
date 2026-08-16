'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { Compass, Heart, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { useCreateFlow } from '@/components/create/CreateFlowContext';
import { useGuestBottomNavPanel } from '@/hooks/useGuestBottomNavPanel';
import type { GuestSalesPanelId } from '@/lib/guest/guest-explanation-panels';
import { scrollToHomeFeed } from '@/lib/guest/guest-explanation-panels';

const GuestSalesInfoPanel = dynamic(
  () => import('@/components/home/GuestSalesInfoPanel'),
  { ssr: false },
);
const HeroVisualCluster = dynamic(
  () => import('@/components/home/HomeHeroVisualCluster'),
  { ssr: false },
);

const ctaClassPrimary = cn(
  'inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl px-4 lg:px-5 py-1.5 text-sm font-bold',
  'bg-white text-primary-brand shadow-md',
  'hover:bg-primary-50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-brand'
);

const ctaClassSecondary = cn(
  'inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl px-4 lg:px-5 py-1.5 text-sm font-semibold',
  'bg-white/15 text-white border border-white/50 backdrop-blur-md',
  'hover:bg-white/25 hover:-translate-y-0.5 transition-all duration-300',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-brand'
);

const mobileActionClass =
  'inline-flex shrink-0 items-center justify-center gap-1 rounded-lg bg-white/20 border border-white/35 px-2.5 py-1.5 text-[11px] font-semibold text-white backdrop-blur-sm touch-manipulation hover:bg-white/30';

function HeroPlatformStrip() {
  const { t } = useTranslation();

  return (
    <div className="hc-hero-platform-strip hidden lg:flex lg:flex-wrap lg:items-center lg:justify-start lg:gap-x-4 lg:gap-y-1 px-5 py-1.5 text-[10px] font-medium text-white/80">
      <span className="text-white/95">{t('homePhase1.heroStripBrands')}</span>
      <span className="text-white/40 hidden sm:inline" aria-hidden>·</span>
      <span>{t('homePhase1.heroStripCategories')}</span>
      <span className="text-white/40 hidden sm:inline" aria-hidden>·</span>
      <span className="inline-flex items-center gap-1 text-white/90">
        <Heart className="w-3 h-3 text-amber-200/90 shrink-0" aria-hidden />
        {t('homePhase1.heroStripCommunity')}
      </span>
    </div>
  );
}

export default function HomeHeroSection() {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const { openCreateFlow } = useCreateFlow();
  const { handleGuestCreateClick, guestBottomNavPanelEl } = useGuestBottomNavPanel();
  const [guestSalesPanel, setGuestSalesPanel] = useState<GuestSalesPanelId | null>(null);

  const isGuest = status !== 'loading' && !session?.user;

  const scrollToFeed = useCallback(() => {
    scrollToHomeFeed();
  }, []);

  const handleMobileShareClick = useCallback(() => {
    if (isGuest) {
      handleGuestCreateClick();
      return;
    }
    openCreateFlow();
  }, [isGuest, handleGuestCreateClick, openCreateFlow]);

  const handleDesktopShareClick = useCallback(() => {
    if (isGuest) {
      setGuestSalesPanel('share');
      return;
    }
    openCreateFlow();
  }, [isGuest, openCreateFlow]);

  const handleDesktopDiscoverClick = useCallback(() => {
    if (isGuest) {
      setGuestSalesPanel('discover');
      return;
    }
    scrollToFeed();
  }, [isGuest, scrollToFeed]);

  return (
    <>
      {/* Mobile / tablet: Model B compact strip — feed-first; landscape ultra-thin */}
      <section className="lg:hidden relative overflow-hidden rounded-xl hc-hero-dorpsplein mb-1.5 shadow-md min-h-[5.5rem] max-h-[8.5rem] max-[900px]:landscape:min-h-0 max-[900px]:landscape:max-h-[3.25rem] max-[900px]:landscape:mb-1">
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary-brand via-[#007a5c] to-secondary-brand"
          aria-hidden
        />
        <div className="relative z-[1] flex h-full min-h-[5.5rem] max-[900px]:landscape:min-h-0 items-center justify-between gap-2 px-3 py-2 sm:px-4 max-[900px]:landscape:py-1 max-[900px]:landscape:px-2">
          <div className="min-w-0 flex-1">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white/95 mb-0.5 max-[900px]:landscape:hidden">
              <span className="hc-pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-amber-300" aria-hidden />
              {t('homePhase1.orientationIdentity')}
            </p>
            <h1 className="text-sm sm:text-base font-extrabold text-white leading-snug line-clamp-2 tracking-tight max-[900px]:landscape:text-xs max-[900px]:landscape:line-clamp-1">
              {t('homePhase1.orientationTitle')}
            </h1>
            <p className="hidden min-[400px]:block text-[11px] text-white/90 line-clamp-1 mt-0.5 font-medium max-[900px]:landscape:hidden">
              {t('homePhase1.orientationExplainCompactPrimary')}
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-1 sm:flex-row max-[900px]:landscape:flex-row max-[900px]:landscape:gap-1">
            <button type="button" onClick={scrollToFeed} className={cn(mobileActionClass, 'max-[900px]:landscape:py-1 max-[900px]:landscape:text-[10px]')}>
              <Compass className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="max-[900px]:landscape:hidden">{t('homePhase1.ctaDiscover')}</span>
              <span className="hidden max-[900px]:landscape:inline" aria-hidden>
                {t('homePhase1.orientationActionPrimary').split(' ')[0]}
              </span>
            </button>
            <button type="button" onClick={handleMobileShareClick} className={cn(mobileActionClass, 'max-[900px]:landscape:py-1 max-[900px]:landscape:text-[10px]')}>
              <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="max-[900px]:landscape:sr-only">{t('homePhase1.ctaShare')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Desktop: full hero — unchanged */}
      <section className="hidden lg:block relative overflow-visible rounded-2xl sm:rounded-3xl hc-hero-dorpsplein mb-3 sm:mb-4 lg:mb-3 shadow-xl">
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary-brand via-[#007a5c] to-secondary-brand"
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.35)_0%,_transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(255,214,0,0.2)_0%,_transparent_50%)]"
          aria-hidden
        />

        <div className="relative lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-4 overflow-visible">
          <div className="relative z-[1] px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8 lg:pt-4 lg:pb-2 text-center lg:text-left">
            <div className="max-w-2xl mx-auto lg:mx-0 lg:max-w-[720px] xl:max-w-[800px]">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 px-3 py-0.5 text-[11px] sm:text-xs font-semibold text-white/95 mb-1.5 sm:mb-2">
                <span className="hc-pulse-dot inline-block h-2 w-2 rounded-full bg-amber-300" aria-hidden />
                {t('homeDorpsplein.heroLiveLabel')}
              </p>

              <h1 className="text-[1.65rem] sm:text-3xl lg:text-[1.95rem] xl:text-[2.1rem] font-extrabold text-white mb-1 sm:mb-1.5 leading-[1.12] tracking-tight max-w-[22ch] lg:max-w-[28ch] mx-auto lg:mx-0">
                {t('homePhase1.orientationTitle')}
              </h1>

              <p className="text-sm sm:text-[0.9375rem] lg:text-[0.975rem] text-white/90 mb-2 sm:mb-2.5 max-w-xl lg:max-w-[40rem] mx-auto lg:mx-0 leading-snug font-medium">
                {t('homePhase1.orientationExplainCompactPrimary')}
              </p>

              <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                <button type="button" onClick={handleDesktopDiscoverClick} className={ctaClassPrimary}>
                  <Compass className="w-4 h-4 shrink-0" aria-hidden />
                  {t('homePhase1.ctaDiscover')}
                </button>
                <button type="button" onClick={handleDesktopShareClick} className={ctaClassSecondary}>
                  <Plus className="w-4 h-4 shrink-0" aria-hidden />
                  {t('homePhase1.ctaShare')}
                </button>
              </div>
              {/* Secondary / below-fold meaning — not first-impression chrome */}
              <p className="mt-2 max-w-xl text-[11px] leading-snug text-white/70 mx-auto lg:mx-0">
                {t('homePhase1.heroValueExchange')}
              </p>
              <p className="sr-only">{t('homePhase1.heroDefinition')}</p>
            </div>
          </div>

          <HeroVisualCluster />
        </div>

        <HeroPlatformStrip />
      </section>

      {guestBottomNavPanelEl}
      {isGuest ? (
        <GuestSalesInfoPanel panel={guestSalesPanel} onClose={() => setGuestSalesPanel(null)} />
      ) : null}
    </>
  );
}
