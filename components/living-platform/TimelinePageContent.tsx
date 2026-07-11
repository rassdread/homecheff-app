'use client';

import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import { PLATFORM_TIMELINE } from '@/lib/living-platform/registry';

export default function TimelinePageContent() {
  const { t } = useTranslation();
  const ns = 'livingPlatformTimeline';
  const tk = (key: string) => t(`${ns}.${key}`);

  return (
    <ol className="mt-10 space-y-6 border-l-2 border-emerald-200 pl-6">
      {PLATFORM_TIMELINE.map((event) => (
        <li key={event.id} className="relative">
          <span
            className={`absolute -left-[1.65rem] top-1 h-3 w-3 rounded-full ${
              event.kind === 'planned' ? 'bg-amber-400' : 'bg-emerald-600'
            }`}
            aria-hidden
          />
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {event.date} · {event.kind === 'planned' ? tk('plannedLabel') : tk('shippedLabel')}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-gray-900">{tk(event.titleKey)}</h2>
          <p className="mt-2 text-gray-700 leading-relaxed">{tk(event.bodyKey)}</p>
        </li>
      ))}
    </ol>
  );
}
