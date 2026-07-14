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

const HERO_CHIP_KEYS = [
  { key: 'heroChipFood', emoji: '🍲' },
  { key: 'heroChipGarden', emoji: '🌱' },
  { key: 'heroChipCreations', emoji: '🎨' },
  { key: 'heroChipInspiration', emoji: '✨' },
  { key: 'heroChipChores', emoji: '🔧' },
  { key: 'heroChipBarter', emoji: '⇄' },
  { key: 'heroChipRequests', emoji: '🙋' },
  { key: 'heroChipNearby', emoji: '📍' },
] as const;

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
      {/* Mobile / tablet: compact strip (~120–160px) — feed-first */}
      <section className="lg:hidden relative overflow-hidden rounded-xl hc-hero-dorpsplein mb-2 shadow-md min-h-[7.5rem] max-h-[10rem]">
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary-brand via-[#007a5c] to-secondary-brand"
          aria-hidden
        />
        <div className="relative z-[1] flex h-full min-h-[7.5rem] items-center justify-between gap-2 px-3 py-2.5 sm:px-4">
          <div className="min-w-0 flex-1">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white/95 mb-1">
              <span className="hc-pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-amber-300" aria-hidden />
              {t('homeDorpsplein.heroLiveLabel')}
            </p>
            <h1 className="text-base sm:text-lg font-extrabold text-white leading-tight line-clamp-2 tracking-tight">
              {t('homePhase1.heroTitleHighlight')}
              {t('homePhase1.heroTitleAfter')}
            </h1>
              <p className="hidden min-[380px]:block text-[11px] text-white/90 line-clamp-2 mt-0.5 font-medium">
              {t('homePhase1.heroValueExchange')}
            </p>
            <p className="hidden min-[380px]:block text-[11px] text-white/75 line-clamp-1 mt-0.5">
              {t('homePhase1.heroSubtitle')}
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
            <button type="button" onClick={scrollToFeed} className={mobileActionClass}>
              <Compass className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {t('homePhase1.ctaDiscover')}
            </button>
            <button type="button" onClick={handleMobileShareClick} className={mobileActionClass}>
              <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {t('homePhase1.ctaShare')}
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

              <h1 className="text-[1.65rem] sm:text-3xl lg:text-[1.95rem] xl:text-[2.1rem] font-extrabold text-white mb-1 sm:mb-1.5 leading-[1.12] tracking-tight max-w-[18ch] lg:max-w-[24ch] mx-auto lg:mx-0">
                {t('homePhase1.heroTitleBefore')}
                <span className="relative inline-block">
                  {t('homePhase1.heroTitleHighlight')}
                  <span
                    className="absolute -bottom-0.5 left-0 right-0 h-1 rounded-full bg-amber-300/90"
                    aria-hidden
                  />
                </span>
                {t('homePhase1.heroTitleAfter')}
              </h1>

              <p className="text-sm sm:text-[0.9375rem] lg:text-[0.975rem] text-white/90 mb-1 sm:mb-1.5 max-w-xl lg:max-w-[40rem] mx-auto lg:mx-0 leading-snug font-medium">
                {t('homePhase1.heroSubtitle')}
              </p>
              <p className="text-xs sm:text-sm text-white/95 mb-1 sm:mb-1.5 max-w-xl lg:max-w-[40rem] mx-auto lg:mx-0 leading-snug font-semibold">
                {t('homePhase1.heroValueExchange')}
              </p>
              <p className="text-[11px] sm:text-xs text-white/70 mb-2 sm:mb-2.5 max-w-xl lg:max-w-[40rem] mx-auto lg:mx-0 leading-snug">
                {t('homePhase1.heroDefinition')}
              </p>

              <ul
                className="hidden sm:flex flex-nowrap lg:flex-wrap justify-center lg:justify-start gap-1.5 mb-2 lg:mb-2 list-none p-0 m-0 overflow-x-auto lg:overflow-visible"
                aria-label={t('homePhase1.heroTitleHighlight')}
              >
                {HERO_CHIP_KEYS.map(({ key, emoji }) => (
                  <li key={key} className="shrink-0">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/12 border border-white/22 px-2 py-0.5 text-[11px] font-semibold text-white/95 backdrop-blur-sm whitespace-nowrap">
                      <span aria-hidden>{emoji}</span>
                      {t(`homePhase1.${key}`)}
                    </span>
                  </li>
                ))}
              </ul>

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
