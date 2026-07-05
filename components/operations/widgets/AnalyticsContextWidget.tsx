'use client';

import { WidgetCard, WidgetCta } from '@/components/operations/widgets/widget-ui';
import type { OperationsWidgetProps } from '@/components/operations/widgets/types';
import { useTranslation } from '@/hooks/useTranslation';
import { OPERATIONS_ROUTES } from '@/lib/operations/operations-entry';

export default function AnalyticsContextWidget(_props: OperationsWidgetProps) {
  const { t } = useTranslation();

  return (
    <WidgetCard title={t('operations.sidepanel.context.analytics.title')}>
      <p className="text-xs text-gray-600">
        {t('operations.sidepanel.context.analytics.hint')}
      </p>
      <WidgetCta
        href={OPERATIONS_ROUTES.seller.analytics}
        label={t('operations.sidepanel.context.analytics.cta')}
        primary
      />
    </WidgetCard>
  );
}
