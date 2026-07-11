'use client';

import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import { PUBLIC_DATASET_CATALOG } from '@/lib/living-platform/evidence-queries';

const SECTIONS = [
  { titleKey: 'sectionFeaturesTitle', bodyKey: 'sectionFeaturesBody' },
  { titleKey: 'sectionDocsTitle', bodyKey: 'sectionDocsBody' },
  { titleKey: 'sectionTruthTitle', bodyKey: 'sectionTruthBody' },
  { titleKey: 'sectionEvidenceTitle', bodyKey: 'sectionEvidenceBody' },
  { titleKey: 'sectionTransparencyTitle', bodyKey: 'sectionTransparencyBody' },
] as const;

export default function HowHomeCheffGrowsContent() {
  const { t } = useTranslation();
  const ns = 'livingPlatformHowGrows';
  const tk = (key: string) => t(`${ns}.${key}`);

  return (
    <>
      {SECTIONS.map((s) => (
        <section key={s.titleKey} className="mt-10">
          <h2 className="text-xl font-semibold text-gray-900">{tk(s.titleKey)}</h2>
          <p className="mt-3 text-gray-700 leading-relaxed">{tk(s.bodyKey)}</p>
        </section>
      ))}

      <section className="mt-10 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          {t('livingPlatformShared.authoritySectionTitle')}
        </h2>
        <ul className="mt-4 space-y-2">
          {PUBLIC_DATASET_CATALOG.map((ds) => (
            <li key={ds.id}>
              <Link href={ds.path} className="text-emerald-700 hover:underline">
                {t(`livingPlatformShared.${ds.labelKey}`)}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
