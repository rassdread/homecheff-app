'use client';

import { useOperationsSidepanel } from '@/components/operations/OperationsSidepanelProvider';
import { useTranslation } from '@/hooks/useTranslation';
import { deriveOperationsStatusChips } from '@/lib/operations/operations-sidepanel-helpers';
import { cn } from '@/lib/utils';

const toneClasses = {
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  amber: 'border-amber-200 bg-amber-50 text-amber-900',
  gray: 'border-gray-200 bg-gray-50 text-gray-700',
  blue: 'border-blue-200 bg-blue-50 text-blue-800',
  red: 'border-red-200 bg-red-50 text-red-800',
} as const;

type Props = {
  className?: string;
};

export default function OperationsStatusChips({ className }: Props) {
  const { t, tOr } = useTranslation();
  const { actionCenter, ctx, loading } = useOperationsSidepanel();

  const title = tOr(
    'operations.sidepanel.status.title',
    'Status',
    'Status',
  );

  const chips = deriveOperationsStatusChips(actionCenter, ctx);

  if (loading) {
    return (
      <section
        className={cn('hc-dorpsplein-card px-3 py-3', className)}
        aria-label={title}
      >
        <div className="mb-2 h-3 w-16 animate-pulse rounded bg-gray-200" />
        <div className="flex flex-wrap gap-1.5">
          <div className="h-6 w-16 animate-pulse rounded-full bg-gray-100" />
          <div className="h-6 w-24 animate-pulse rounded-full bg-gray-100" />
        </div>
      </section>
    );
  }

  if (chips.length === 0) return null;

  return (
    <section
      className={cn('hc-dorpsplein-card px-3 py-3', className)}
      aria-label={title}
    >
      <h3 className="hc-section-title mb-2 text-sm">{title}</h3>
      <div className="flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <span
            key={chip.id}
            className={cn(
              'inline-flex max-w-full items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold leading-snug',
              toneClasses[chip.tone],
            )}
          >
            <span className="truncate">
              {chip.labelKey
                ? t(chip.labelKey, chip.labelParams)
                : chip.label}
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}
