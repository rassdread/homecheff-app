import type { VerdienCheckCopy } from '@/lib/verdiencheck/i18n/copy';
import { formatCentsAsWholeEuroDisplay } from '@/lib/verdiencheck/domain/money';
import {
  helperFeedsCertifiedEngine,
  mapRevenueAndAllowableCosts,
  type ScenarioInputMode,
} from '@/lib/verdiencheck/domain/revenue-cost-helper';
import type { WizardState } from '@/lib/verdiencheck/wizard/schema';

function whole(cents: number): string {
  return formatCentsAsWholeEuroDisplay(cents);
}

export default function VerdienCheckCostAdvantage(props: {
  copy: VerdienCheckCopy;
  mode: ScenarioInputMode;
  helperRevenueEuro: string;
  helperCostsEuro: string;
  helperCostsUnknown: boolean;
  onSelectResultMode: () => void;
  onSelectHelperMode: () => void;
  onHelperRevenueChange: (value: string) => void;
  onHelperCostsChange: (value: string) => void;
  onHelperCostsUnknown: (unknown: boolean) => void;
  showExample?: boolean;
}) {
  const { copy } = props;
  const mapped = mapRevenueAndAllowableCosts({
    revenueEuro: props.helperRevenueEuro,
    costsEuro: props.helperCostsEuro,
    costsUnknown: props.helperCostsUnknown,
  });
  const helperActive = props.mode === 'REVENUE_COST';

  return (
    <div className="space-y-3" data-verdiencheck-cost-advantage="">
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
        <p className="text-sm font-medium text-stone-900">{copy.costsCountTitle}</p>
        <p className="mt-1 text-sm leading-relaxed text-stone-700">{copy.costsCountBody}</p>
        <p className="mt-1 text-sm leading-relaxed text-stone-600">{copy.costsCountEngine}</p>
      </div>

      <details className="rounded-xl border border-stone-200 bg-stone-50 p-3">
        <summary className="cursor-pointer min-h-11 text-sm font-medium text-stone-800">
          {copy.moreExplanation}
        </summary>
        <div className="mt-3 space-y-2 text-sm leading-relaxed text-stone-600">
          <p className="font-medium text-stone-800">{copy.whatIsResultTitle}</p>
          <p>{copy.whatIsResultBody}</p>
          {props.showExample !== false ? (
            <>
              <p className="text-stone-500">{copy.resultExampleCaption}</p>
              <ul className="space-y-1">
                <li className="flex justify-between gap-4">
                  <span>{copy.exampleRevenueLabel}</span>
                  <span>{copy.exampleRevenueAmount}</span>
                </li>
                <li className="flex justify-between gap-4">
                  <span>{copy.exampleCostsLabel}</span>
                  <span>{copy.exampleCostsAmount}</span>
                </li>
                <li className="flex justify-between gap-4 font-medium text-stone-800">
                  <span>{copy.exampleResultLabel}</span>
                  <span>{copy.exampleResultAmount}</span>
                </li>
              </ul>
            </>
          ) : null}
          <p>{copy.helperCostExamples}</p>
          <p>{copy.helperPartialCostsNote}</p>
          <p>{copy.helperInvestmentNote}</p>
          <p>{copy.costsAreRealExpenses}</p>
          <p>{copy.receiptsNote}</p>
        </div>
      </details>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={!helperActive}
          onClick={props.onSelectResultMode}
          className={`min-h-11 rounded-xl border px-3 py-2 text-sm ${
            !helperActive
              ? 'border-emerald-700 bg-emerald-50 font-medium text-emerald-950'
              : 'border-gray-200 bg-white text-gray-800'
          }`}
        >
          {copy.knowMyResult}
        </button>
        <button
          type="button"
          aria-pressed={helperActive}
          onClick={props.onSelectHelperMode}
          className={`min-h-11 rounded-xl border px-3 py-2 text-sm ${
            helperActive
              ? 'border-emerald-700 bg-emerald-50 font-medium text-emerald-950'
              : 'border-gray-200 bg-white text-gray-800'
          }`}
        >
          {copy.calculateFromRevenueCosts}
        </button>
      </div>

      {helperActive ? (
        <div className="space-y-3 rounded-xl border border-emerald-100 bg-white p-3" data-verdiencheck-revenue-cost-helper="">
          <label className="block">
            <span className="text-sm text-stone-700">{copy.helperRevenueLabel}</span>
            <input
              inputMode="decimal"
              value={props.helperRevenueEuro}
              onChange={(e) => props.onHelperRevenueChange(e.target.value)}
              className="mt-1 min-h-12 w-full rounded-xl border border-gray-200 px-4 py-3 text-lg"
              placeholder="€"
            />
          </label>
          <label className="block">
            <span className="text-sm text-stone-700">{copy.helperCostsLabel}</span>
            <input
              inputMode="decimal"
              value={props.helperCostsEuro}
              onChange={(e) => props.onHelperCostsChange(e.target.value)}
              disabled={props.helperCostsUnknown}
              className="mt-1 min-h-12 w-full rounded-xl border border-gray-200 px-4 py-3 text-lg disabled:bg-stone-100"
              placeholder="€"
            />
          </label>
          <button
            type="button"
            aria-pressed={props.helperCostsUnknown}
            onClick={() => props.onHelperCostsUnknown(!props.helperCostsUnknown)}
            className={`min-h-11 rounded-xl border px-3 py-2 text-sm ${
              props.helperCostsUnknown
                ? 'border-emerald-700 bg-emerald-50 font-medium text-emerald-950'
                : 'border-gray-200 bg-white text-gray-800'
            }`}
          >
            {copy.helperCostsUnknown}
          </button>
          {mapped.status === 'UNKNOWN_COSTS' ? (
            <p className="text-sm text-stone-700">{copy.helperUnknownCostsNote}</p>
          ) : null}
          {mapped.status === 'NEGATIVE' ? (
            <p className="text-sm text-stone-700">{copy.helperNegativeNote}</p>
          ) : null}
          {mapped.status === 'ZERO' ? (
            <p className="text-sm text-stone-700">{copy.helperZeroNote}</p>
          ) : null}
          {helperFeedsCertifiedEngine(mapped) ? (
            <p className="text-base font-medium text-stone-900">
              {copy.helperResultLabel}: €{whole(mapped.resultCents)}
            </p>
          ) : mapped.status === 'INCOMPLETE' ? (
            <p className="text-sm text-stone-600">{copy.helperAwaiting}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function helperChainFromState(
  state: Pick<
    WizardState,
    'helperRevenueEuro' | 'helperCostsEuro' | 'helperCostsUnknown' | 'scenarioInputMode'
  >,
) {
  if (state.scenarioInputMode !== 'REVENUE_COST') return null;
  const mapped = mapRevenueAndAllowableCosts({
    revenueEuro: state.helperRevenueEuro,
    costsEuro: state.helperCostsEuro,
    costsUnknown: state.helperCostsUnknown,
  });
  if (!helperFeedsCertifiedEngine(mapped)) return null;
  return mapped;
}
