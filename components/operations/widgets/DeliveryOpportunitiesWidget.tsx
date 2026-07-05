'use client';

import {
  WidgetCard,
  WidgetCta,
  WidgetLine,
  WidgetSkeleton,
} from '@/components/operations/widgets/widget-ui';
import type { OperationsWidgetProps } from '@/components/operations/widgets/types';
import { useOperationsSidepanel } from '@/components/operations/OperationsSidepanelProvider';
import { useTranslation } from '@/hooks/useTranslation';
import { OPERATIONS_ROUTES } from '@/lib/operations/operations-entry';

export default function DeliveryOpportunitiesWidget({
  compact,
}: OperationsWidgetProps) {
  const { t } = useTranslation();
  const { sectionExtras } = useOperationsSidepanel();
  const d = sectionExtras.delivery;

  if (sectionExtras.loadingSection && !d) {
    return <WidgetSkeleton />;
  }

  return (
    <WidgetCard title={t('operations.sidepanel.context.delivery.title')}>
      {d ? (
        <>
          {d.hasActiveDelivery ? (
            <p className="text-xs font-semibold text-blue-800">
              {t('operations.sidepanel.context.delivery.activeRide')}
            </p>
          ) : null}
          {d.availableOrders > 0 ? (
            <WidgetLine
              label={t('operations.sidepanel.context.delivery.available')}
              value={d.availableOrders}
            />
          ) : null}
        </>
      ) : (
        <p className="text-xs text-gray-600">
          {t('operations.sidepanel.context.delivery.fallback')}
        </p>
      )}
      <WidgetCta
        href={OPERATIONS_ROUTES.delivery.home}
        label={t('operations.sidepanel.context.delivery.dashboard')}
        primary
      />
      {!compact ? (
        <WidgetCta
          href={OPERATIONS_ROUTES.delivery.settings}
          label={t('operations.sidepanel.context.delivery.settings')}
        />
      ) : null}
    </WidgetCard>
  );
}
