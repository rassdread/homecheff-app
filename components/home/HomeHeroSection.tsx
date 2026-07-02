'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ChefHat, Sprout, Palette, Compass, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { useCreateFlow } from '@/components/create/CreateFlowContext';
import GuestSalesInfoPanel from '@/components/home/GuestSalesInfoPanel';
import type { GuestSalesPanelId } from '@/lib/guest/guest-explanation-panels';
import { scrollToHomeFeed } from '@/lib/guest/guest-explanation-panels';

const VERTICALS = [
  {
    key: 'cheff' as const,
    panel: 'cheff' as const,
    icon: ChefHat,
    color: 'from-orange-500 to-red-500',
    border: 'border-orange-200 hover:border-orange-300',
  },
  {
    key: 'garden' as const,
    panel: 'garden' as const,
    icon: Sprout,
    color: 'from-emerald-500 to-teal-500',
    border: 'border-emerald-200 hover:border-emerald-300',
  },
  {
    key: 'designer' as const,
    panel: 'designer' as const,
    icon: Palette,
    color: 'from-purple-500 to-pink-500',
    border: 'border-purple-200 hover:border-purple-300',
  },
];

const ctaClassPrimary = cn(
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl px-6 py-2.5',
  'bg-white text-primary-brand font-semibold shadow-lg',
  'hover:bg-emerald-50 transition-all duration-200',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-600'
);

const ctaClassSecondary = cn(
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl px-6 py-2.5',
  'bg-white/15 text-white font-semibold border border-white/40 backdrop-blur-sm',
  'hover:bg-white/25 transition-all duration-200',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-600'
);

export default function HomeHeroSection() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { openCreateFlow } = useCreateFlow();
  const [guestPanel, setGuestPanel] = useState<GuestSalesPanelId | null>(null);

  const isGuest = status !== 'loading' && !session?.user;

  const scrollToFeed = useCallback(() => {
    scrollToHomeFeed();
  }, []);

  const openVerticalFeed = useCallback(
    (key: string) => {
      router.push(`/?chip=sale&vertical=${key}#homecheff-feed`);
      window.setTimeout(scrollToFeed, 150);
    },
    [router, scrollToFeed]
  );

  const openGuestPanel = useCallback((panel: GuestSalesPanelId) => {
    setGuestPanel(panel);
  }, []);

  return (
    <>
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary-brand via-emerald-600 to-teal-600 px-4 py-8 sm:px-8 sm:py-10 shadow-lg mb-6">
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
            {t('homePhase1.heroTitle')}
          </h1>
          <p className="text-sm sm:text-base text-primary-100 mb-6 max-w-2xl mx-auto leading-relaxed">
            {t('homePhase1.heroSubtitle')}
          </p>
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            {isGuest ? (
              <button type="button" onClick={() => openGuestPanel('discover')} className={ctaClassPrimary}>
                <Compass className="w-4 h-4 shrink-0" aria-hidden />
                {t('homePhase1.ctaDiscover')}
              </button>
            ) : (
              <button type="button" onClick={scrollToFeed} className={ctaClassPrimary}>
                <Compass className="w-4 h-4 shrink-0" aria-hidden />
                {t('homePhase1.ctaDiscover')}
              </button>
            )}
            {isGuest ? (
              <button type="button" onClick={() => openGuestPanel('share')} className={ctaClassSecondary}>
                <Plus className="w-4 h-4 shrink-0" aria-hidden />
                {t('homePhase1.ctaShare')}
              </button>
            ) : (
              <button type="button" onClick={() => openCreateFlow()} className={ctaClassSecondary}>
                <Plus className="w-4 h-4 shrink-0" aria-hidden />
                {t('homePhase1.ctaShare')}
              </button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3 text-left">
            {VERTICALS.map(({ key, panel, icon: Icon, color, border }) =>
              isGuest ? (
                <button
                  key={key}
                  type="button"
                  onClick={() => openGuestPanel(panel)}
                  className={cn(
                    'block w-full rounded-xl border p-4 transition-all duration-200 text-left',
                    'bg-white/95 shadow-sm hover:shadow-md hover:-translate-y-0.5',
                    border
                  )}
                >
                  <div className={cn('inline-flex rounded-lg bg-gradient-to-br p-2 mb-3', color)}>
                    <Icon className="w-5 h-5 text-white" aria-hidden />
                  </div>
                  <h2 className="font-bold text-gray-900 text-sm sm:text-base mb-1">
                    {t(`homePhase1.verticals.${key}.title`)}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 leading-snug">
                    {t(`homePhase1.verticals.${key}.description`)}
                  </p>
                </button>
              ) : (
                <Link
                  key={key}
                  href={`/?chip=sale&vertical=${key}#homecheff-feed`}
                  prefetch={false}
                  onClick={(e) => {
                    e.preventDefault();
                    openVerticalFeed(key);
                  }}
                  className={cn(
                    'block rounded-xl border p-4 transition-all duration-200',
                    'bg-white/95 shadow-sm hover:shadow-md hover:-translate-y-0.5',
                    border
                  )}
                >
                  <div className={cn('inline-flex rounded-lg bg-gradient-to-br p-2 mb-3', color)}>
                    <Icon className="w-5 h-5 text-white" aria-hidden />
                  </div>
                  <h2 className="font-bold text-gray-900 text-sm sm:text-base mb-1">
                    {t(`homePhase1.verticals.${key}.title`)}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 leading-snug">
                    {t(`homePhase1.verticals.${key}.description`)}
                  </p>
                </Link>
              )
            )}
          </div>
        </div>
      </section>

      {isGuest ? (
        <GuestSalesInfoPanel panel={guestPanel} onClose={() => setGuestPanel(null)} />
      ) : null}
    </>
  );
}
