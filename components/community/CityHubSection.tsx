'use client';

import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import type { EcosystemHubPayload } from '@/lib/community/getEcosystemHubForCitySlug';
import { trackOnboardingEvent } from '@/lib/onboarding/onboarding-analytics';
import { useEffect, useRef } from 'react';

export default function CityHubSection({ initial }: { initial: EcosystemHubPayload }) {
  const { t } = useTranslation();
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackOnboardingEvent('ECOSYSTEM_PAGE_VIEWED', {
      surface: 'city_hub',
      city: initial.citySlug,
      activeCreatorsWeek: initial.activeCreatorsWeek,
    });
  }, [initial.citySlug, initial.activeCreatorsWeek]);

  const feedHref = `/?place=${encodeURIComponent(initial.cityLabel)}#homecheff-feed`;
  const discoverHref = '/inspiratie';

  return (
    <section
      className="mt-10 rounded-2xl border border-emerald-100/90 bg-gradient-to-br from-white via-emerald-50/50 to-slate-50 p-5 shadow-sm"
      aria-label={t('ecosystemHub.sectionAria', { city: initial.cityLabel })}
    >
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          {t('ecosystemHub.title', { city: initial.cityLabel })}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {t('ecosystemHub.subtitle', { radius: initial.radiusKm })}
        </p>

        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-white/90 bg-white/90 p-3 shadow-sm">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {t('ecosystemHub.stats.activeCreatorsWeek')}
            </dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-slate-900">
              {initial.activeCreatorsWeek}
            </dd>
          </div>
          <div className="rounded-xl border border-white/90 bg-white/90 p-3 shadow-sm">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {t('ecosystemHub.stats.newListingsWeek')}
            </dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-slate-900">
              {initial.newListingsWeek}
            </dd>
          </div>
          <div className="rounded-xl border border-white/90 bg-white/90 p-3 shadow-sm">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {t('ecosystemHub.stats.inspirationWeek')}
            </dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-slate-900">
              {initial.newInspirationWeek}
            </dd>
          </div>
          <div className="rounded-xl border border-white/90 bg-white/90 p-3 shadow-sm">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {t('ecosystemHub.stats.radius')}
            </dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-slate-900">
              {initial.radiusKm} km
            </dd>
          </div>
        </dl>

        {(initial.risingLocalUsername || initial.localHcpLeaderUsername) && (
          <div className="mt-4 space-y-2 rounded-xl border border-slate-200/80 bg-white/80 p-4 text-sm text-slate-700">
            {initial.risingLocalUsername ? (
              <p>
                <span className="font-medium text-slate-900">
                  {t('ecosystemHub.spotlight.risingLocal')}
                </span>{' '}
                <Link
                  href={`/user/${encodeURIComponent(initial.risingLocalUsername)}`}
                  className="text-emerald-700 underline decoration-emerald-200 underline-offset-2 hover:text-emerald-900"
                  prefetch={false}
                >
                  @{initial.risingLocalUsername}
                </Link>
                {initial.risingLocalListingCount > 0
                  ? ` · ${t('ecosystemHub.spotlight.newListings', { count: initial.risingLocalListingCount })}`
                  : null}
              </p>
            ) : null}
            {initial.localHcpLeaderUsername && initial.localHcpLeaderTotal != null ? (
              <p>
                <span className="font-medium text-slate-900">
                  {t('ecosystemHub.spotlight.hcpLeader')}
                </span>{' '}
                <Link
                  href={`/user/${encodeURIComponent(initial.localHcpLeaderUsername)}`}
                  className="text-emerald-700 underline decoration-emerald-200 underline-offset-2 hover:text-emerald-900"
                  prefetch={false}
                >
                  @{initial.localHcpLeaderUsername}
                </Link>
                <span className="text-slate-500">
                  {' '}
                  · {t('ecosystemHub.spotlight.hcpPoints', { count: initial.localHcpLeaderTotal })}
                </span>
              </p>
            ) : null}
          </div>
        )}

        {initial.sparseGeoSignal ? (
          <p className="mt-3 text-sm text-amber-900/90">{t('ecosystemHub.sparseGeo')}</p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={feedHref}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            prefetch={false}
          >
            {t('ecosystemHub.ctaFeed', { city: initial.cityLabel })}
          </Link>
          <Link
            href={discoverHref}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            prefetch={false}
          >
            {t('ecosystemHub.ctaDiscover')}
          </Link>
        </div>
      </section>
  );
}
