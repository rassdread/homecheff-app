'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { PUBLISHED_CASE_STUDIES } from '@/lib/living-platform/registry';

export default function StoriesPageContent() {
  const { t } = useTranslation();
  const ns = 'livingPlatformStories';
  const tk = (key: string) => t(`${ns}.${key}`);
  const published = PUBLISHED_CASE_STUDIES.filter((s) => s.published && s.permissionVerified);

  return (
    <>
      <section className="mt-10 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-gray-900">{tk('frameworkTitle')}</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-gray-700">
          <li>{tk('frameworkProblem')}</li>
          <li>{tk('frameworkApproach')}</li>
          <li>{tk('frameworkUsage')}</li>
          <li>{tk('frameworkOutcome')}</li>
          <li>{tk('frameworkLessons')}</li>
          <li>{tk('frameworkManifest')}</li>
        </ul>
      </section>

      {published.length === 0 ? (
        <section className="mt-8 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6">
          <h2 className="text-lg font-semibold text-gray-900">{tk('emptyTitle')}</h2>
          <p className="mt-2 text-gray-700">{tk('emptyBody')}</p>
        </section>
      ) : (
        published.map((story) => (
          <article key={story.id} className="mt-8 rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold">{story.participantLabel}</h2>
          </article>
        ))
      )}
    </>
  );
}
