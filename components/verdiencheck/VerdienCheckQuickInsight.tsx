import type { VerdienCheckCopy } from '@/lib/verdiencheck/i18n/copy';
import { formatCentsAsWholeEuroDisplay } from '@/lib/verdiencheck/domain/money';
import {
  EXAMPLE_COSTS_CENTS,
  EXAMPLE_RESULT_CENTS,
  EXAMPLE_REVENUE_CENTS,
} from '@/lib/verdiencheck/domain/revenue-cost-helper';

function euro(cents: number): string {
  return `€${formatCentsAsWholeEuroDisplay(cents)}`;
}

export default function VerdienCheckQuickInsight(props: {
  copy: VerdienCheckCopy;
  onStart?: () => void;
  startHref?: string;
}) {
  const en = props.copy.quickInsightTitle.startsWith('What');
  const example = en
    ? `${euro(EXAMPLE_REVENUE_CENTS)} revenue − ${euro(EXAMPLE_COSTS_CENTS)} costs = ${euro(EXAMPLE_RESULT_CENTS)} before tax`
    : `${euro(EXAMPLE_REVENUE_CENTS)} omzet − ${euro(EXAMPLE_COSTS_CENTS)} kosten = ${euro(EXAMPLE_RESULT_CENTS)} vóór belasting`;
  return (
    <section
      data-verdiencheck-quick-insight=""
      className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2.5"
    >
      <h2 className="text-sm font-semibold text-emerald-950">{props.copy.quickInsightTitle}</h2>
      <p
        data-verdiencheck-omzet-kosten-result="example"
        className="mt-1 text-sm font-medium leading-snug text-stone-900"
      >
        {example}
      </p>
      <p className="mt-0.5 text-[11px] leading-snug text-stone-500">{props.copy.resultExampleCaption}</p>
      <p className="mt-1 text-sm leading-snug text-stone-700">{props.copy.quickInsightAfterResult}</p>
      {props.onStart ? (
        <button
          type="button"
          data-verdiencheck-quick-insight-cta=""
          onClick={props.onStart}
          className="mt-2 inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-800 px-3 py-2 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        >
          {props.copy.startForMySituation}
        </button>
      ) : null}
      {props.startHref ? (
        <a
          href={props.startHref}
          data-verdiencheck-quick-insight-cta=""
          className="mt-2 inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-800 px-3 py-2 text-sm font-semibold text-white"
        >
          {props.copy.startForMySituation}
        </a>
      ) : null}
    </section>
  );
}
