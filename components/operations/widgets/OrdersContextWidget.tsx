'use client';

import { WidgetCard, WidgetCta, WidgetLine } from '@/components/operations/widgets/widget-ui';
import type { OperationsWidgetProps } from '@/components/operations/widgets/types';
import { useOperationsSidepanel } from '@/components/operations/OperationsSidepanelProvider';
import { useTranslation } from '@/hooks/useTranslation';
import { parsePendingOrdersCount } from '@/lib/operations/operations-today-helpers';
import { OPERATIONS_ROUTES } from '@/lib/operations/operations-entry';

export default function OrdersContextWidget(_props: OperationsWidgetProps) {
  const { t } = useTranslation();
  const { actionCenter } = useOperationsSidepanel();
  const pendingOrders = parsePendingOrdersCount(actionCenter?.items ?? []);

  return (
    <WidgetCard title={t('operations.sidepanel.context.orders.title')}>
      {pendingOrders > 0 ? (
        <WidgetLine
          label={t('operations.sidepanel.context.orders.pending')}
          value={pendingOrders}
        />
      ) : (
        <p className="text-xs text-gray-600">
          {t('operations.sidepanel.context.orders.noPending')}
        </p>
      )}
      <WidgetCta
        href={OPERATIONS_ROUTES.seller.orders}
        label={t('operations.sidepanel.context.orders.openOrders')}
        primary
      />
    </WidgetCard>
  );
}
