'use client';

import Link from 'next/link';
import { ArrowRight, Wallet } from 'lucide-react';
import { useOperationsSidepanel } from '@/components/operations/OperationsSidepanelProvider';
import { useTranslation } from '@/hooks/useTranslation';
import { OPERATIONS_ROUTES } from '@/lib/operations/operations-entry';
import { computePendingDisplayCents } from '@/lib/operations/operations-today-helpers';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  compact?: boolean;
};

export default function OperationsFinanceHero({
  className,
  compact = false,
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

  const availableLabel = tOr(
    'operations.today.finance.available',
    'available',
    'beschikbaar',
  );
  const pendingLabel = tOr(
    'operations.sidepanel.finance.pending',
    'In processing',
    'In behandeling',
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
          'hc-dorpsplein-card hc-dorpsplein-card-warm animate-pulse px-5 py-6 sm:px-6',
          className,
        )}
        aria-label="Financiën"
      >
        <div className="mb-2 h-4 w-32 rounded bg-amber-100" />
        <div className="h-10 w-40 rounded bg-gray-100" />
        <div className="mt-4 h-11 rounded-xl bg-gray-100" />
      </section>
    );
  }

  const available = totals?.totalAvailable ?? 0;
  const pending = computePendingDisplayCents(earnings);
  const hasEarnings = available > 0 || pending > 0 || (totals?.totalEarnings ?? 0) > 0;

  if (!hasEarnings) {
    return (
      <section
        className={cn(
          'hc-dorpsplein-card hc-dorpsplein-card-warm px-5 py-5 sm:px-6',
          className,
        )}
      >
        <div className="flex items-center gap-2 text-amber-800">
          <Wallet className="h-5 w-5" aria-hidden />
          <p className="text-sm font-medium text-gray-600">{emptyLabel}</p>
        </div>
        <Link
          href={OPERATIONS_ROUTES.finance.home}
          prefetch
          className="mt-3 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-900"
        >
          {tOr('operations.tabs.finance', 'Finance', 'Financiën')} →
        </Link>
      </section>
    );
  }

  return (
    <section
      className={cn(
        'hc-dorpsplein-card hc-dorpsplein-card-warm px-5 py-6 sm:px-6',
        className,
      )}
    >
      <p className="text-sm font-medium capitalize text-gray-600">
        {availableLabel}
      </p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-emerald-900 sm:text-4xl">
        {formatCurrency(available)}
      </p>
      {!compact && pending > 0 ? (
        <p className="mt-2 text-sm text-gray-600">
          {pendingLabel}{' '}
          <span className="font-semibold text-gray-800">
            {formatCurrency(pending)}
          </span>
        </p>
      ) : null}

      <Link
        href={OPERATIONS_ROUTES.finance.payout}
        prefetch
        className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 sm:w-auto sm:min-w-[220px]"
      >
        {payoutCta}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </section>
  );
}
