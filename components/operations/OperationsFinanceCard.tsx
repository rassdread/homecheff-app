'use client';

import Link from 'next/link';
import { ArrowRight, Wallet } from 'lucide-react';
import { useOperationsSidepanel } from '@/components/operations/OperationsSidepanelProvider';
import { useTranslation } from '@/hooks/useTranslation';
import {
  computePendingEarningsCents,
  hasMeaningfulEarnings,
} from '@/lib/operations/operations-sidepanel-helpers';
import { OPERATIONS_ROUTES } from '@/lib/operations/operations-entry';
import { cn } from '@/lib/utils';

type Props = {
  compact?: boolean;
  className?: string;
};

export default function OperationsFinanceCard({
  compact = false,
  className,
}: Props) {
  const { tOr, language } = useTranslation();
  const { totals, earnings, loading } = useOperationsSidepanel();

  const formatCurrency = (cents: number) => {
    const locale = language === 'en' ? 'en-GB' : 'nl-NL';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  const title = tOr(
    'operations.sidepanel.finance.title',
    'Finance',
    'Financiën',
  );
  const availableLabel = tOr(
    'operations.sidepanel.finance.available',
    'Available',
    'Beschikbaar',
  );
  const pendingLabel = tOr(
    'operations.sidepanel.finance.pending',
    'In processing',
    'In behandeling',
  );
  const totalLabel = tOr(
    'operations.sidepanel.finance.totalEarned',
    'Total earned',
    'Totaal verdiend',
  );
  const emptyLabel = tOr(
    'operations.sidepanel.finance.empty',
    'No earnings yet',
    'Nog geen inkomsten',
  );
  const payoutCta = tOr(
    'operations.sidepanel.finance.payoutCta',
    'Request payout',
    'Uitbetaling aanvragen',
  );

  if (loading) {
    return (
      <section
        className={cn(
          'hc-dorpsplein-card hc-dorpsplein-card-warm animate-pulse px-4 py-3',
          className,
        )}
        aria-label={title}
      >
        <div className="mb-3 h-3 w-24 rounded bg-amber-100" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-gray-100" />
          <div className="h-4 w-3/4 rounded bg-gray-100" />
        </div>
        <div className="mt-3 h-9 rounded-xl bg-gray-100" />
      </section>
    );
  }

  if (!hasMeaningfulEarnings(totals)) {
    return (
      <section
        className={cn(
          'hc-dorpsplein-card hc-dorpsplein-card-warm px-4 py-3',
          className,
        )}
        aria-label={title}
      >
        <div className="mb-2 flex items-center gap-2">
          <Wallet className="h-4 w-4 text-amber-700" aria-hidden />
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        </div>
        <p className="text-xs text-gray-600">{emptyLabel}</p>
        <Link
          href={OPERATIONS_ROUTES.finance.home}
          prefetch
          className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-50"
        >
          {tOr('operations.tabs.finance', 'Finance', 'Financiën')}
        </Link>
      </section>
    );
  }

  const pendingCents = computePendingEarningsCents(earnings);

  return (
    <section
      className={cn(
        'hc-dorpsplein-card hc-dorpsplein-card-warm px-4 py-3',
        className,
      )}
      aria-label={title}
    >
      <div className="mb-3 flex items-center gap-2">
        <Wallet className="h-4 w-4 text-amber-700" aria-hidden />
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      </div>

      <dl className={cn('space-y-2', compact && 'space-y-1.5')}>
        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-xs font-medium text-gray-600">{availableLabel}</dt>
          <dd className="text-base font-bold text-emerald-800">
            {formatCurrency(totals?.totalAvailable ?? 0)}
          </dd>
        </div>
        {!compact ? (
          <>
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-xs font-medium text-gray-600">{pendingLabel}</dt>
              <dd className="text-sm font-semibold text-gray-800">
                {formatCurrency(pendingCents)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-2 border-t border-amber-100/80 pt-2">
              <dt className="text-xs font-medium text-gray-600">{totalLabel}</dt>
              <dd className="text-sm font-semibold text-gray-900">
                {formatCurrency(totals?.totalEarnings ?? 0)}
              </dd>
            </div>
          </>
        ) : null}
      </dl>

      <Link
        href={OPERATIONS_ROUTES.finance.payout}
        prefetch
        className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
      >
        {payoutCta}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </section>
  );
}
