'use client';

import type { SidepanelLayout } from '@/components/operations/OperationsSidepanelContent';
import { resolveOperationsOpportunityWidgets } from '@/components/operations/widgets/resolver';
import { useOperationsSidepanel } from '@/components/operations/OperationsSidepanelProvider';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

type Props = {
  layout: SidepanelLayout;
  compact?: boolean;
  className?: string;
};

export default function OperationsOpportunityZone({
  layout,
  compact = false,
  className,
}: Props) {
  const { tOr } = useTranslation();
  const { ctx, activeSection, actionCenter, sectionExtras } =
    useOperationsSidepanel();

  const hasUrgentTasks = (actionCenter?.items ?? []).some(
    (item) => item.severity === 'red' || item.severity === 'orange',
  );

  const widgets = resolveOperationsOpportunityWidgets({
    ctx,
    activeSection,
    layout,
    hasUrgentTasks,
    loadingSection: sectionExtras.loadingSection,
    partnerExtras: sectionExtras.partner,
  });

  if (widgets.length === 0) return null;

  const zoneLabel = tOr(
    'operations.widgets.zoneLabel',
    'Opportunities',
    'Kansen',
  );

  return (
    <div
      className={cn('space-y-3', className)}
      aria-label={zoneLabel}
      data-zone="opportunity"
    >
      {widgets.map((widget) => {
        const Component = widget.Component;
        return <Component key={widget.id} compact={compact} />;
      })}
    </div>
  );
}
