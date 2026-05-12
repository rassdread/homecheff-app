'use client';

import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import type { CategoryEcosystemPayload } from '@/lib/community/getCategoryEcosystem';
import { trackOnboardingEvent } from '@/lib/onboarding/onboarding-analytics';
import { useEffect, useRef } from 'react';

const FEED_VERTICAL: Record<string, string> = {
  keuken: 'CHEFF',
  tuin: 'GROWN',
  studio: 'DESIGNER',
};

export default function CategoryEcosystemClient({ data }: { data: CategoryEcosystemPayload }) {
  const { t } = useTranslation();
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackOnboardingEvent('ECOSYSTEM_PAGE_VIEWED', {
      surface: 'category_ecosystem',
      ecosystem: data.slug,
    });
  }, [data.slug]);

  const v = FEED_VERTICAL[data.slug];
  const feedHref = v ? `/?chip=sale&vertical=${v}#homecheff-feed` : '/#homecheff-feed';
  const inspiratieHref = '/inspiratie';
  const affiliateHref = '/affiliate';

  const titleKey = `ecosystemVertical.titles.${data.slug}` as const;
  const introKey = `ecosystemVertical.intros.${data.slug}` as const;

  const isCommunity = data.slug === 'community';
  const isInspiratie = data.slug === 'inspiratie';

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
        {t(titleKey)}
      </h1>
      <p className="mt-3 text-lg text-neutral-600">{t(introKey)}</p>

      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {isCommunity
              ? t('ecosystemVertical.stats.activeBuilders')
              : isInspiratie
                ? t('ecosystemVertical.stats.publicInspiration')
                : t('ecosystemVertical.stats.activeListings')}
          </dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums text-neutral-900">{data.activeListings}</dd>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {isCommunity
              ? t('ecosystemVertical.stats.newBuildersWeek')
              : t('ecosystemVertical.stats.momentumWeek')}
          </dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums text-neutral-900">
            {isCommunity ? data.activeCreatorsWeek : data.newListingsWeek}
          </dd>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {isInspiratie
              ? t('ecosystemVertical.stats.inspirationCreatorsWeek')
              : isCommunity
                ? t('ecosystemVertical.stats.newListingsNationwide')
                : t('ecosystemVertical.stats.workspacePostsWeek')}
          </dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums text-neutral-900">
            {isCommunity ? data.newListingsWeek : isInspiratie ? data.activeCreatorsWeek : data.inspirationPostsWeek}
          </dd>
        </div>
        {!isCommunity && !isInspiratie && data.savesWeekApprox > 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:col-span-1">
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {t('ecosystemVertical.stats.savesWeek')}
            </dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-neutral-900">{data.savesWeekApprox}</dd>
          </div>
        ) : null}
        {!isCommunity && !isInspiratie ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:col-span-1">
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {t('ecosystemVertical.stats.activeCreatorsWeek')}
            </dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-neutral-900">{data.activeCreatorsWeek}</dd>
          </div>
        ) : null}
      </dl>

      {data.risingUsername && !isInspiratie && !isCommunity ? (
        <p className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm text-emerald-950">
          <span className="font-medium">{t('ecosystemVertical.spotlight.creator')}</span>{' '}
          <Link
            href={`/user/${encodeURIComponent(data.risingUsername)}`}
            className="text-emerald-800 underline decoration-emerald-200 underline-offset-2 hover:text-emerald-950"
            prefetch={false}
          >
            @{data.risingUsername}
          </Link>
          {data.risingListingCount > 0
            ? ` · ${t('ecosystemVertical.spotlight.newListings', { count: data.risingListingCount })}`
            : null}
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        {!isCommunity ? (
          <Link
            href={feedHref}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            prefetch={false}
          >
            {t('ecosystemVertical.ctaFeed')}
          </Link>
        ) : null}
        <Link
          href={isCommunity ? affiliateHref : inspiratieHref}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
          prefetch={false}
        >
          {isCommunity ? t('ecosystemVertical.ctaAffiliate') : t('ecosystemVertical.ctaInspiration')}
        </Link>
      </div>
    </div>
  );
}
