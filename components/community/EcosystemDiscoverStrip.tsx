'use client';

import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import { Compass, MapPin, Sprout, Palette, Lightbulb, Users } from 'lucide-react';
import { LOCAL_SEO_CITIES } from '@/lib/seo/localCities';
import { trackOnboardingEvent } from '@/lib/onboarding/onboarding-analytics';

const ECOSYSTEM_LINKS = [
  { href: '/gemeenschap/keuken', key: 'keuken' as const, Icon: Compass },
  { href: '/gemeenschap/tuin', key: 'tuin' as const, Icon: Sprout },
  { href: '/gemeenschap/studio', key: 'studio' as const, Icon: Palette },
  { href: '/gemeenschap/inspiratie', key: 'inspiratie' as const, Icon: Lightbulb },
  { href: '/gemeenschap/community', key: 'community' as const, Icon: Users },
];

export default function EcosystemDiscoverStrip({ variant = 'home' }: { variant?: 'home' | 'discover' }) {
  const { t } = useTranslation();
  const sampleCity = LOCAL_SEO_CITIES[0];

  return (
    <section
      className={`rounded-2xl border border-slate-200/90 bg-white/90 px-3 py-3 shadow-sm backdrop-blur-sm sm:px-4 ${
        variant === 'home' ? 'mb-4' : 'mb-6'
      }`}
      aria-label={t('ecosystemStrip.sectionAria')}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {t('ecosystemStrip.heading')}
        </p>
        {sampleCity ? (
          <Link
            href={`/maaltijden/${sampleCity.slug}`}
            className="inline-flex min-h-[44px] items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-900"
            prefetch={false}
            onClick={() =>
              trackOnboardingEvent('ECOSYSTEM_NAV_CLICK', {
                target: 'city_hub',
                slug: sampleCity.slug,
                from: variant,
              })
            }
          >
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {t('ecosystemStrip.sampleCity', { city: sampleCity.label })}
          </Link>
        ) : null}
      </div>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ECOSYSTEM_LINKS.map(({ href, key, Icon }) => (
          <Link
            key={href}
            href={href}
            prefetch={false}
            onClick={() =>
              trackOnboardingEvent('ECOSYSTEM_NAV_CLICK', {
                target: 'ecosystem_vertical',
                slug: key,
                from: variant,
              })
            }
            className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border border-slate-200/90 bg-slate-50/90 px-3 py-2 text-xs font-medium text-slate-800 hover:border-emerald-200 hover:bg-emerald-50/80"
          >
            <Icon className="h-3.5 w-3.5 text-emerald-700" aria-hidden />
            {t(`ecosystemStrip.links.${key}`)}
          </Link>
        ))}
      </div>
    </section>
  );
}
