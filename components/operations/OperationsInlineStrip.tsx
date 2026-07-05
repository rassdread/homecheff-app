'use client';

import { useMemo } from 'react';
import { ChevronRight, Wallet } from 'lucide-react';
import { useOperationsSidepanel } from '@/components/operations/OperationsSidepanelProvider';
import OperationsTasksSection from '@/components/operations/OperationsTasksSection';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

type Props = {
  onOpenOverview: () => void;
  className?: string;
};

export default function OperationsInlineStrip({
  onOpenOverview,
  className,
}: Props) {
  const { tOr, language } = useTranslation();
  const { totals, loading } = useOperationsSidepanel();

  const formatCurrency = (cents: number) => {
    const locale = language === 'en' ? 'en-GB' : 'nl-NL';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  const overviewLabel = tOr(
    'operations.sidepanel.overview',
    'Overview',
    'Overzicht',
  );
  const availableLabel = tOr(
    'operations.sidepanel.finance.available',
    'Available',
    'Beschikbaar',
  );

  const financeLine = useMemo(() => {
    if (loading) return '…';
    return formatCurrency(totals?.totalAvailable ?? 0);
  }, [loading, totals?.totalAvailable, formatCurrency]);

  return (
    <button
      type="button"
      onClick={onOpenOverview}
      className={cn(
        'w-full rounded-2xl border border-emerald-200/60 bg-white/95 p-3 text-left shadow-sm transition active:scale-[0.99]',
        className,
      )}
      aria-label={overviewLabel}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          {overviewLabel}
        </span>
        <ChevronRight className="h-4 w-4 text-emerald-600" aria-hidden />
      </div>

      <OperationsTasksSection surface="inline" compactHeader className="mb-2 border-0 bg-transparent p-0 shadow-none" />

      <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-200/50 bg-gradient-to-r from-[#faf8f4] to-primary-50/30 px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <Wallet className="h-4 w-4 shrink-0 text-amber-700" aria-hidden />
          <span className="text-xs font-medium text-gray-600">{availableLabel}</span>
        </div>
        <span className="text-sm font-bold text-emerald-800">{financeLine}</span>
      </div>
    </button>
  );
}
