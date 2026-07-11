'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { TRANSPARENCY_REPORT_SLOTS } from '@/lib/living-platform/registry';

export default function ReportsPageContent() {
  const { t } = useTranslation();
  const ns = 'livingPlatformReports';
  const tk = (key: string) => t(`${ns}.${key}`);
  const hasPublished = TRANSPARENCY_REPORT_SLOTS.some((r) => r.publishedAt && r.href);

  return (
    <>
      {!hasPublished ? (
        <section className="mt-10 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6">
          <h2 className="text-lg font-semibold text-gray-900">{tk('emptyTitle')}</h2>
          <p className="mt-2 text-gray-700">{tk('emptyBody')}</p>
        </section>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {TRANSPARENCY_REPORT_SLOTS.map((slot) => (
          <section key={slot.id} className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="font-semibold text-gray-900">{tk(slot.titleKey)}</h2>
            <p className="mt-2 text-sm text-gray-700">{tk(slot.descriptionKey)}</p>
            <p className="mt-3 text-xs text-gray-500">
              {slot.publishedAt ? slot.publishedAt : tk('statusUnpublished')}
            </p>
          </section>
        ))}
      </div>
    </>
  );
}
