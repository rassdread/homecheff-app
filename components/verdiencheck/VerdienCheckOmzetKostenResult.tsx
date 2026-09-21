import type { ReactNode } from 'react';
import type { VerdienCheckCopy } from '@/lib/verdiencheck/i18n/copy';
import { formatCentsAsWholeEuroDisplay } from '@/lib/verdiencheck/domain/money';
import {
  EXAMPLE_COSTS_CENTS,
  EXAMPLE_REVENUE_CENTS,
  EXAMPLE_RESULT_CENTS,
} from '@/lib/verdiencheck/domain/revenue-cost-helper';
import VerdienCheckKostenInfo from './VerdienCheckKostenInfo';

function euro(cents: number): string {
  return `€${formatCentsAsWholeEuroDisplay(cents)}`;
}

export default function VerdienCheckOmzetKostenResult(props: {
  copy: VerdienCheckCopy;
  variant: 'example' | 'live';
  revenueCents?: number | null;
  costsCents?: number | null;
  resultCents?: number | null;
  revenueSlot?: ReactNode;
  costsSlot?: ReactNode;
  showInfo?: boolean;
}) {
  const example = props.variant === 'example';
  const revenue = example ? EXAMPLE_REVENUE_CENTS : props.revenueCents ?? null;
  const costs = example ? EXAMPLE_COSTS_CENTS : props.costsCents ?? null;
  const result = example ? EXAMPLE_RESULT_CENTS : props.resultCents ?? null;

  return (
    <div
      data-verdiencheck-omzet-kosten-result={props.variant}
      className="space-y-2 rounded-2xl border border-emerald-100 bg-white p-4"
    >
      {example ? (
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
          {props.copy.resultExampleCaption}
        </p>
      ) : null}
      <div className="flex items-end justify-between gap-3">
        <p className="text-sm font-medium text-stone-800">{props.copy.youSellLabel}</p>
        {props.revenueSlot ?? (
          <p
            data-verdiencheck-revenue=""
            className="text-lg font-semibold tabular-nums text-stone-900"
          >
            {revenue != null ? euro(revenue) : '—'}
          </p>
        )}
      </div>
      <p aria-hidden="true" className="text-center text-xs font-medium text-stone-400">
        ↓ {props.copy.minusLabel}
      </p>
      <div className="flex items-end justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1">
          <p className="text-sm font-medium text-stone-800">{props.copy.helperCostsLabel}</p>
          {props.showInfo !== false ? <VerdienCheckKostenInfo copy={props.copy} compact /> : null}
        </div>
        {props.costsSlot ?? (
          <p
            data-verdiencheck-costs=""
            className="text-lg font-semibold tabular-nums text-stone-900"
          >
            {costs != null ? `− ${euro(costs)}` : '—'}
          </p>
        )}
      </div>
      <div className="border-t border-stone-200 pt-2">
        <div className="flex items-end justify-between gap-3">
          <p className="text-sm font-semibold text-stone-900">{props.copy.resultBeforeTaxLabel}</p>
          <p
            data-verdiencheck-result-before-tax=""
            className="text-xl font-semibold tabular-nums text-emerald-950"
          >
            {result != null ? euro(result) : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
