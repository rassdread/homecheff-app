'use client';

import { useMemo, useState } from 'react';
import type { VerdienCheckCopy } from '@/lib/verdiencheck/i18n/copy';
import { formatCentsAsWholeEuroDisplay } from '@/lib/verdiencheck/domain/money';
import {
  COST_INPUT_CATEGORY_IDS,
  categoryMayBeDurableAsset,
  emptyCostLines,
  mapCostBreakdown,
  type CostInputCategoryId,
  type CostLineInput,
  type CostLineKind,
} from '@/lib/verdiencheck/domain/cost-categories';
import {
  helperFeedsCertifiedEngine,
  mapRevenueAndAllowableCosts,
  type ScenarioInputMode,
} from '@/lib/verdiencheck/domain/revenue-cost-helper';
import type { WizardState } from '@/lib/verdiencheck/wizard/schema';
import VerdienCheckOmzetKostenResult from './VerdienCheckOmzetKostenResult';

function whole(cents: number): string {
  return formatCentsAsWholeEuroDisplay(cents);
}

function categoryLabel(copy: VerdienCheckCopy, id: CostInputCategoryId): string {
  switch (id) {
    case 'MATERIALS':
      return copy.costCatMaterials;
    case 'PACKAGING':
      return copy.costCatPackaging;
    case 'PLATFORM':
      return copy.costCatPlatform;
    case 'DELIVERY':
      return copy.costCatDelivery;
    case 'EQUIPMENT':
      return copy.costCatEquipment;
    case 'MARKETING':
      return copy.costCatMarketing;
    case 'OTHER':
      return copy.costCatOther;
  }
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
  const [splitOpen, setSplitOpen] = useState(false);
  const [lines, setLines] = useState<CostLineInput[]>(emptyCostLines);
  const mapped = mapRevenueAndAllowableCosts({
    revenueEuro: props.helperRevenueEuro,
    costsEuro: props.helperCostsEuro,
    costsUnknown: props.helperCostsUnknown,
  });
  const breakdown = useMemo(() => mapCostBreakdown(lines), [lines]);
  const helperActive = props.mode === 'REVENUE_COST';
  const liveResult =
    helperFeedsCertifiedEngine(mapped) || mapped.status === 'ZERO' || mapped.status === 'NEGATIVE'
      ? mapped.resultCents
      : null;
  const liveRevenue = mapped.revenueCents;
  const liveCosts = typeof mapped.costsCents === 'number' ? mapped.costsCents : null;

  function applyLines(next: CostLineInput[]) {
    setLines(next);
    const nextMapped = mapCostBreakdown(next);
    if (nextMapped.status === 'OK') {
      props.onHelperCostsUnknown(false);
      props.onHelperCostsChange(nextMapped.deductibleEuro);
      return;
    }
    if (nextMapped.status === 'EMPTY') return;
    props.onHelperCostsChange('');
  }

  function patchLine(id: CostInputCategoryId, patch: Partial<CostLineInput>) {
    applyLines(lines.map((line) => (line.id === id ? { ...line, ...patch } : line)));
  }

  return (
    <div className="space-y-3" data-verdiencheck-cost-advantage="">
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
        <p className="text-sm font-medium text-stone-900">{copy.costsCountTitle}</p>
        <p className="mt-1 text-sm leading-relaxed text-stone-700">{copy.costsCountBody}</p>
        <p className="mt-1 text-sm leading-relaxed text-stone-600">{copy.keepRecordsEarn}</p>
      </div>

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
        <div
          className="space-y-3 rounded-xl border border-emerald-100 bg-white p-3"
          data-verdiencheck-revenue-cost-helper=""
        >
          <VerdienCheckOmzetKostenResult
            copy={copy}
            variant="live"
            revenueCents={liveRevenue}
            costsCents={liveCosts}
            resultCents={typeof liveResult === 'number' ? liveResult : null}
            revenueSlot={
              <label className="block w-44 max-w-full">
                <span className="sr-only">{copy.helperRevenueLabel}</span>
                <input
                  inputMode="decimal"
                  value={props.helperRevenueEuro}
                  onChange={(e) => props.onHelperRevenueChange(e.target.value)}
                  className="min-h-12 w-full rounded-xl border border-gray-200 px-3 py-2 text-lg tabular-nums"
                  placeholder="€"
                  aria-label={copy.helperRevenueLabel}
                />
              </label>
            }
            costsSlot={
              <label className="block w-44 max-w-full">
                <span className="sr-only">{copy.helperCostsLabel}</span>
                <input
                  inputMode="decimal"
                  value={props.helperCostsEuro}
                  onChange={(e) => props.onHelperCostsChange(e.target.value)}
                  disabled={props.helperCostsUnknown || splitOpen}
                  className="min-h-12 w-full rounded-xl border border-gray-200 px-3 py-2 text-lg tabular-nums disabled:bg-stone-100"
                  placeholder="€"
                  aria-label={copy.helperCostsLabel}
                />
              </label>
            }
          />
          <p className="text-sm leading-relaxed text-stone-600">{copy.helperCostsHint}</p>
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
          <button
            type="button"
            aria-expanded={splitOpen}
            onClick={() => setSplitOpen((open) => !open)}
            className="min-h-11 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800"
          >
            {splitOpen ? copy.hideSplitCostsCta : copy.splitCostsCta}
          </button>
          {splitOpen ? (
            <div className="space-y-3" data-verdiencheck-cost-split="">
              {COST_INPUT_CATEGORY_IDS.map((id) => {
                const line = lines.find((item) => item.id === id);
                if (!line) return null;
                const showInvestment = categoryMayBeDurableAsset(id) && line.spendEuro.trim() !== '';
                return (
                  <fieldset key={id} className="space-y-2 rounded-xl border border-stone-100 p-3">
                    <legend className="px-1 text-sm font-medium text-stone-800">
                      {categoryLabel(copy, id)}
                    </legend>
                    <label className="block">
                      <span className="text-sm text-stone-600">{copy.userSpendLabel}</span>
                      <input
                        inputMode="decimal"
                        value={line.spendEuro}
                        onChange={(e) => patchLine(id, { spendEuro: e.target.value })}
                        className="mt-1 min-h-11 w-full rounded-xl border border-gray-200 px-3 py-2"
                        placeholder="€"
                      />
                    </label>
                    {showInvestment ? (
                      <div className="space-y-2">
                        <p className="text-sm text-stone-700">{copy.investmentQuestion}</p>
                        <p className="text-sm leading-relaxed text-stone-600">{copy.investmentExplain}</p>
                        <div className="flex flex-wrap gap-2">
                          {(['ORDINARY', 'INVESTMENT'] as const).map((kind: CostLineKind) => (
                            <button
                              key={kind}
                              type="button"
                              aria-pressed={line.kind === kind}
                              onClick={() => patchLine(id, { kind })}
                              className={`min-h-11 rounded-xl border px-3 py-2 text-sm ${
                                line.kind === kind
                                  ? 'border-emerald-700 bg-emerald-50 font-medium text-emerald-950'
                                  : 'border-gray-200 bg-white text-gray-800'
                              }`}
                            >
                              {kind === 'ORDINARY' ? copy.ordinaryCostLabel : copy.investmentCostLabel}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <label className="block">
                      <span className="text-sm text-stone-600">
                        {line.kind === 'INVESTMENT' ? copy.investmentYearAsk : copy.deductibleAmountLabel}
                      </span>
                      <input
                        inputMode="decimal"
                        value={line.deductibleEuro}
                        onChange={(e) => patchLine(id, { deductibleEuro: e.target.value })}
                        className="mt-1 min-h-11 w-full rounded-xl border border-gray-200 px-3 py-2"
                        placeholder="€"
                      />
                    </label>
                  </fieldset>
                );
              })}
            </div>
          ) : null}
          {breakdown.status === 'INVESTMENT_UNKNOWN' ? (
            <p className="text-sm text-stone-700">{copy.investmentUnknownNote}</p>
          ) : null}
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
          <div className="rounded-xl border border-stone-100 bg-stone-50 p-3">
            <p className="text-sm font-medium text-stone-800">{copy.receiptsCalloutTitle}</p>
            <p className="mt-1 text-sm leading-relaxed text-stone-600">{copy.receiptsCalloutBody}</p>
          </div>
          <p className="text-xs leading-relaxed text-stone-500">{copy.vatSeparationNote}</p>
        </div>
      ) : props.showExample !== false ? (
        <VerdienCheckOmzetKostenResult copy={copy} variant="example" />
      ) : null}

      <details className="rounded-xl border border-stone-200 bg-stone-50 p-3">
        <summary className="cursor-pointer min-h-11 text-sm font-medium text-stone-800">
          {copy.moreExplanation}
        </summary>
        <div className="mt-3 space-y-2 text-sm leading-relaxed text-stone-600">
          <p className="font-medium text-stone-800">{copy.whatIsResultTitle}</p>
          <p>{copy.whatIsResultBody}</p>
          <p>{copy.helperCostExamples}</p>
          <p>{copy.helperPartialCostsNote}</p>
          <p>{copy.helperInvestmentNote}</p>
          <p>{copy.costsAreRealExpenses}</p>
        </div>
      </details>
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
