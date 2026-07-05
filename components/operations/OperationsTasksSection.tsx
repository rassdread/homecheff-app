'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { ActionCenterRow } from '@/components/home/UserActionCenter';
import { useOperationsSidepanel } from '@/components/operations/OperationsSidepanelProvider';
import { useTranslation } from '@/hooks/useTranslation';
import { partitionUserActionItems } from '@/lib/user/user-action-center';
import { cn } from '@/lib/utils';

export type OperationsTasksSurface =
  | 'desktop'
  | 'drawer'
  | 'inline'
  | 'tablet';

const MAX_BY_SURFACE: Record<OperationsTasksSurface, number> = {
  desktop: 5,
  drawer: 3,
  tablet: 3,
  inline: 2,
};

type Props = {
  surface?: OperationsTasksSurface;
  className?: string;
  /** Inline: hide section title */
  compactHeader?: boolean;
};

export default function OperationsTasksSection({
  surface = 'desktop',
  className,
  compactHeader = false,
}: Props) {
  const { tOr } = useTranslation();
  const { actionCenter, loading } = useOperationsSidepanel();
  const [expanded, setExpanded] = useState(false);

  const maxVisible = MAX_BY_SURFACE[surface];
  const compact = surface !== 'desktop';

  const title = tOr(
    'operations.sidepanel.tasks.title',
    'Taken',
    'Taken',
  );
  const healthyTitle = tOr(
    'operations.sidepanel.tasks.healthy',
    'Everything looks good',
    'Alles ziet er goed uit',
  );
  const viewMoreLabel = tOr(
    'operations.sidepanel.tasks.viewMore',
    'View more',
    'Bekijk meer',
  );
  const showLessLabel = tOr(
    'operations.sidepanel.tasks.showLess',
    'Show less',
    'Minder tonen',
  );

  if (loading) {
    return (
      <section
        className={cn(
          'hc-dorpsplein-card animate-pulse px-3 py-3',
          className,
        )}
        aria-label={title}
      >
        <div className="mb-2 h-3 w-20 rounded bg-gray-200" />
        <div className="h-12 rounded-lg bg-gray-100" />
        {surface === 'inline' ? (
          <div className="mt-2 h-8 rounded-lg bg-gray-100" />
        ) : null}
      </section>
    );
  }

  const items = (actionCenter?.items ?? []).filter(
    (item) => item.id !== 'messages-unread',
  );
  const { visible, hidden, hasMore } = partitionUserActionItems(items, maxVisible);
  const showHidden = expanded ? hidden : [];

  if (actionCenter?.healthy || items.length === 0) {
    if (surface === 'inline') {
      return (
        <div
          className={cn(
            'flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/60 px-3 py-2',
            className,
          )}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
          <p className="text-xs font-semibold text-emerald-950">{healthyTitle}</p>
        </div>
      );
    }

    return (
      <section
        className={cn(
          'hc-dorpsplein-card border border-emerald-200/80 bg-emerald-50/50 px-3 py-2.5',
          className,
        )}
        aria-label={title}
      >
        {!compactHeader ? (
          <h3 className="hc-section-title mb-2 text-sm">{title}</h3>
        ) : null}
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
          <p className="text-xs font-semibold text-emerald-950">{healthyTitle}</p>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn('hc-dorpsplein-card px-3 py-3', className)}
      aria-label={title}
    >
      {!compactHeader ? (
        <div className="mb-2 flex items-start gap-2">
          <AlertCircle
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600"
            aria-hidden
          />
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        </div>
      ) : null}

      <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
        {[...visible, ...showHidden].map((item) => (
          <ActionCenterRow
            key={item.id}
            item={item}
            compact={compact}
            showDescription={surface !== 'inline'}
          />
        ))}
      </div>

      {hasMore ? (
        expanded ? (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="mt-2 flex w-full items-center justify-center gap-1 text-[11px] font-semibold text-secondary-brand hover:text-secondary-700"
          >
            <ChevronUp className="h-3 w-3" aria-hidden />
            {showLessLabel}
          </button>
        ) : surface === 'drawer' || surface === 'desktop' || surface === 'tablet' ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mt-2 flex w-full items-center justify-center gap-1 text-[11px] font-semibold text-secondary-brand hover:text-secondary-700"
          >
            <ChevronDown className="h-3 w-3" aria-hidden />
            {viewMoreLabel}
          </button>
        ) : (
          <Link
            href="/operations/vandaag"
            prefetch
            className="mt-2 flex w-full items-center justify-center gap-1 text-[11px] font-semibold text-secondary-brand hover:text-secondary-700"
          >
            <ChevronDown className="h-3 w-3" aria-hidden />
            {viewMoreLabel}
          </Link>
        )
      ) : null}
    </section>
  );
}
