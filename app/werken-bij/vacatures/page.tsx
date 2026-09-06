'use client';

import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import EcosystemShareAction from '@/components/share/EcosystemShareAction';

/**
 * Real HomeCheff employment openings only — not ecosystem earning opportunities.
 */
export default function VacaturesPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="text-sm font-medium text-emerald-700">
          <Link href="/werken-bij" className="hover:underline">
            {t('verdienHub.title')}
          </Link>
          {' / '}
          {t('verdienHub.employment.nav')}
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          {t('verdienHub.employment.pageTitle')}
        </h1>
        <p className="mt-3 text-slate-600">{t('verdienHub.employment.pageIntro')}</p>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            {t('verdienHub.employment.emptyTitle')}
          </h2>
          <p className="mt-2 text-sm text-slate-600">{t('verdienHub.employment.emptyBody')}</p>
          <p className="mt-4 text-sm text-slate-500">{t('verdienHub.employment.distinction')}</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/werken-bij"
            className="inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {t('verdienHub.employment.backToHub')}
          </Link>
          <EcosystemShareAction
            destinationHref="/werken-bij/vacatures"
            title={t('verdienHub.employment.pageTitle')}
            text={t('verdienHub.shareCopy.jobs')}
            surface="jobs_page"
            product="careers"
            opportunityId="jobs"
            labelKey="verdienHub.cards.jobs.share"
          />
        </div>
      </div>
    </div>
  );
}
