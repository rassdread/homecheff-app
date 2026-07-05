'use client';

import {
  WidgetCard,
  WidgetCta,
  WidgetLine,
} from '@/components/operations/widgets/widget-ui';
import type { OperationsWidgetProps } from '@/components/operations/widgets/types';
import { useOperationsSidepanel } from '@/components/operations/OperationsSidepanelProvider';
import { useTranslation } from '@/hooks/useTranslation';
import { computePendingEarningsCents } from '@/lib/operations/operations-sidepanel-helpers';
import { OPERATIONS_ROUTES } from '@/lib/operations/operations-entry';

export default function FinanceContextWidget({ compact }: OperationsWidgetProps) {
  const { t, language } = useTranslation();
  const { actionCenter, earnings, totals } = useOperationsSidepanel();

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat(language === 'en' ? 'en-GB' : 'nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);

  const stripeBlocked = (actionCenter?.items ?? []).some((i) =>
    i.id.startsWith('stripe-'),
  );

  return (
    <WidgetCard title={t('operations.sidepanel.context.finance.title')}>
      <WidgetLine
        label={t('operations.sidepanel.finance.available')}
        value={formatCurrency(totals?.totalAvailable ?? 0)}
      />
      {!compact ? (
        <WidgetLine
          label={t('operations.sidepanel.finance.pending')}
          value={formatCurrency(computePendingEarningsCents(earnings))}
        />
      ) : null}
      {stripeBlocked ? (
        <p className="text-xs font-medium text-amber-800">
          {t('operations.sidepanel.context.finance.stripeAttention')}
        </p>
      ) : null}
      <WidgetCta
        href={OPERATIONS_ROUTES.finance.payout}
        label={t('operations.sidepanel.finance.payoutCta')}
        primary
      />
      {!compact ? (
        <WidgetCta
          href={OPERATIONS_ROUTES.finance.home}
          label={t('operations.sidepanel.context.finance.viewFinance')}
        />
      ) : null}
    </WidgetCard>
  );
}
