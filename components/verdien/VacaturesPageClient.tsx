'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { careersPath } from '@/lib/navigation/public-careers-nav';
import EcosystemShareAction from '@/components/share/EcosystemShareAction';
import {
  getVerdienHubCopy,
  type VerdienHubCopy,
  type VerdienHubLang,
} from '@/lib/i18n/verdienHubSources';

type Props = {
  copy: VerdienHubCopy;
  initialLang: VerdienHubLang;
};

/**
 * Real HomeCheff employment openings only — not ecosystem earning opportunities.
 */
export default function VacaturesPageClient({ copy: serverCopy, initialLang }: Props) {
  const { language, isReady } = useTranslation();
  const copy = useMemo(() => {
    if (isReady && (language === 'en' || language === 'nl')) {
      return getVerdienHubCopy(language);
    }
    return serverCopy;
  }, [isReady, language, serverCopy]);
  const lang =
    isReady && (language === 'en' || language === 'nl') ? language : initialLang;
  const hubHref = careersPath('hub', lang);
  const jobsHref = careersPath('jobs', lang);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="text-sm font-medium text-emerald-700">
          <Link href={hubHref} className="hover:underline">
            {copy.title}
          </Link>
          {' / '}
          {copy.employment.nav}
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          {copy.employment.pageTitle}
        </h1>
        <p className="mt-3 text-slate-600">{copy.employment.pageIntro}</p>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            {copy.employment.emptyTitle}
          </h2>
          <p className="mt-2 text-sm text-slate-600">{copy.employment.emptyBody}</p>
          <p className="mt-4 text-sm text-slate-500">{copy.employment.distinction}</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={hubHref}
            className="inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {copy.employment.backToHub}
          </Link>
          <EcosystemShareAction
            destinationHref={jobsHref}
            title={copy.employment.pageTitle}
            text={copy.shareCopy.jobs}
            surface="jobs_page"
            product="careers"
            opportunityId="jobs"
            label={copy.cards.jobs.share}
          />
        </div>
      </div>
    </div>
  );
}
