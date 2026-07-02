'use client';

import Link from 'next/link';
import { ChefHat, Sprout, Palette, Compass, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

const VERTICALS = [
  {
    key: 'cheff' as const,
    icon: ChefHat,
    color: 'from-orange-500 to-red-500',
    border: 'border-orange-200 hover:border-orange-300',
    bg: 'bg-orange-50/80',
  },
  {
    key: 'garden' as const,
    icon: Sprout,
    color: 'from-emerald-500 to-teal-500',
    border: 'border-emerald-200 hover:border-emerald-300',
    bg: 'bg-emerald-50/80',
  },
  {
    key: 'designer' as const,
    icon: Palette,
    color: 'from-purple-500 to-pink-500',
    border: 'border-purple-200 hover:border-purple-300',
    bg: 'bg-purple-50/80',
  },
];

export default function HomeHeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary-brand via-emerald-600 to-teal-600 px-4 py-8 sm:px-8 sm:py-10 shadow-lg mb-6">
      <div className="relative max-w-4xl mx-auto text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
          {t('homePhase1.heroTitle')}
        </h1>
        <p className="text-sm sm:text-base text-primary-100 mb-6 max-w-2xl mx-auto leading-relaxed">
          {t('homePhase1.heroSubtitle')}
        </p>
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          <Link
            href="/#homecheff-feed"
            prefetch={false}
            scroll={false}
            className={cn(
              'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl px-6 py-2.5',
              'bg-white text-primary-brand font-semibold shadow-lg',
              'hover:bg-emerald-50 transition-all duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-600'
            )}
          >
            <Compass className="w-4 h-4 shrink-0" aria-hidden />
            {t('homePhase1.ctaDiscover')}
          </Link>
          <Link
            href="/register"
            className={cn(
              'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl px-6 py-2.5',
              'bg-white/15 text-white font-semibold border border-white/40 backdrop-blur-sm',
              'hover:bg-white/25 transition-all duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-600'
            )}
          >
            <Plus className="w-4 h-4 shrink-0" aria-hidden />
            {t('homePhase1.ctaShare')}
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 text-left">
          {VERTICALS.map(({ key, icon: Icon, color, border, bg }) => (
            <Link
              key={key}
              href={`/?chip=sale&vertical=${key}#homecheff-feed`}
              prefetch={false}
              scroll={false}
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
          ))}
        </div>
      </div>
    </section>
  );
}
