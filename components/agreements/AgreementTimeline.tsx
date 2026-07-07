'use client';

import type { AgreementTimelineStep } from '@/lib/agreements/agreements-hub-types';
import { useTranslation } from '@/hooks/useTranslation';

export default function AgreementTimeline({
  steps,
  compact = false,
}: {
  steps: AgreementTimelineStep[];
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const visible = steps.filter((s) => s.state !== 'skipped');

  if (visible.length === 0) return null;

  return (
    <ol
      className={`flex gap-1 overflow-x-auto pb-1 ${compact ? '' : 'sm:gap-2'}`}
      aria-label={t('marketplace.agreements.timeline.aria')}
    >
      {visible.map((step, index) => {
        const isLast = index === visible.length - 1;
        const dotClass =
          step.state === 'done'
            ? 'bg-emerald-600 border-emerald-600'
            : step.state === 'active'
              ? 'bg-white border-emerald-600 ring-2 ring-emerald-200'
              : 'bg-white border-gray-300';

        const textClass =
          step.state === 'done'
            ? 'text-emerald-800'
            : step.state === 'active'
              ? 'text-emerald-900 font-semibold'
              : 'text-gray-500';

        return (
          <li
            key={step.id}
            className={`flex min-w-0 shrink-0 items-center gap-1 ${isLast ? '' : 'pr-1'}`}
          >
            <div className="flex min-w-[4.5rem] flex-col items-center gap-1">
              <span
                className={`h-2.5 w-2.5 rounded-full border-2 ${dotClass}`}
                aria-hidden
              />
              <span className={`text-center text-[9px] leading-tight ${textClass}`}>
                {t(step.labelKey)}
              </span>
            </div>
            {!isLast ? (
              <span
                className={`mb-4 h-px w-3 shrink-0 sm:w-5 ${
                  step.state === 'done' ? 'bg-emerald-400' : 'bg-gray-200'
                }`}
                aria-hidden
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
