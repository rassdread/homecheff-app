'use client';

import Link from 'next/link';
import { WidgetCard, WidgetCta } from '@/components/operations/widgets/widget-ui';
import type { OperationsWidgetProps } from '@/components/operations/widgets/types';
import { useOperationsSidepanel } from '@/components/operations/OperationsSidepanelProvider';
import { useTranslation } from '@/hooks/useTranslation';
import { OPERATIONS_ROUTES } from '@/lib/operations/operations-entry';

export default function TodayContextWidget({ compact }: OperationsWidgetProps) {
  const { t } = useTranslation();
  const { actionCenter } = useOperationsSidepanel();

  const firstUrgent = (actionCenter?.items ?? []).find(
    (i) => i.severity === 'red' || i.severity === 'orange',
  );

  return (
    <WidgetCard title={t('operations.sidepanel.context.today.title')}>
      <p className="text-xs leading-relaxed text-gray-600">
        {t('operations.sidepanel.context.today.hint')}
      </p>
      {firstUrgent ? (
        <Link
          href={firstUrgent.actionHref}
          prefetch
          className="mt-2 block rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs font-semibold text-amber-950 hover:bg-amber-100"
        >
          {t('operations.sidepanel.context.today.continueTask')}
          <span className="mt-0.5 block font-normal text-amber-900/90 line-clamp-2">
            {firstUrgent.title}
          </span>
        </Link>
      ) : null}
      {!compact ? (
        <WidgetCta
          href={OPERATIONS_ROUTES.today.home}
          label={t('operations.sidepanel.context.today.viewAllTasks')}
        />
      ) : null}
    </WidgetCard>
  );
}
