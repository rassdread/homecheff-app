import {
  formatCentsAsWholeEuroDisplay,
  parseEuroInputToCents,
  roundCentsToWholeEuroCents,
  SCENARIO_PRESET_EUROS,
} from '@/lib/verdiencheck/domain/money';
import { isUnknown, type CentsOrUnknown } from '@/lib/verdiencheck/domain/unknown';
import type { PersonalVerdienRoute } from '@/lib/verdiencheck/personal-route';
import { PERSONAL_ROUTE_COPY } from '@/lib/verdiencheck/personal-route/copy';
import type { SimulatorAllowanceId } from '@/lib/verdiencheck/personal-route/types';
import type { ScenarioPresetEuro } from '@/lib/verdiencheck/domain/money';
import type { VerdienCheckCopy } from '@/lib/verdiencheck/i18n/copy';
import type { ScenarioComparisonRow } from '@/lib/verdiencheck/wizard/scenario-comparison';
import { VERDIENCHECK_STEP_HEADING_ID } from '@/lib/verdiencheck/wizard/active-step-focus';
import type { WizardState } from '@/lib/verdiencheck/wizard/schema';
import VerdienCheckCostAdvantage, {
  helperChainFromState,
} from '@/components/verdiencheck/VerdienCheckCostAdvantage';
import type { ScenarioInputMode } from '@/lib/verdiencheck/domain/revenue-cost-helper';

function whole(cents: number): string {
  return formatCentsAsWholeEuroDisplay(cents);
}

function signedWhole(cents: number): string {
  const rounded = roundCentsToWholeEuroCents(cents);
  if (rounded > 0) return `+ €${whole(rounded)}`;
  if (rounded < 0) return `− €${whole(Math.abs(rounded))}`;
  return '€0';
}

function known(value: CentsOrUnknown | null | undefined): number | null {
  if (value == null || isUnknown(value)) return null;
  return value;
}

const ALLOWANCE_NAME: Record<SimulatorAllowanceId, string> = {
  HEALTHCARE: PERSONAL_ROUTE_COPY.healthcareName,
  RENT: PERSONAL_ROUTE_COPY.rentName,
  CHILD_BUDGET: PERSONAL_ROUTE_COPY.childBudgetName,
  CHILDCARE: PERSONAL_ROUTE_COPY.childcareName,
};

export default function VerdienCheckFinancialImpact(props: {
  copy: VerdienCheckCopy;
  route: PersonalVerdienRoute;
  scenarioPreset: WizardState['scenarioPreset'];
  customScenarioEuro: string;
  scenarioInputMode: ScenarioInputMode;
  helperRevenueEuro: string;
  helperCostsEuro: string;
  helperCostsUnknown: boolean;
  comparison: ScenarioComparisonRow[] | null;
  onSelectPreset: (euro: ScenarioPresetEuro) => void;
  onSelectCustom: () => void;
  onCustomChange: (value: string) => void;
  onApplyCustom: () => void;
  onSelectResultMode: () => void;
  onSelectHelperMode: () => void;
  onHelperRevenueChange: (value: string) => void;
  onHelperCostsChange: (value: string) => void;
  onHelperCostsUnknown: (unknown: boolean) => void;
}) {
  const { copy, route } = props;
  const impact = route.financialImpact;
  if (impact.status === 'NOT_APPLICABLE') return null;

  const sim = impact.simulator;
  const extra = sim.extraResultCents ?? impact.extraResultCents;
  const net = known(sim.netExtraCents);
  const month = known(sim.monthlyApproxCents);
  const helperChain = helperChainFromState({
    scenarioInputMode: props.scenarioInputMode,
    helperRevenueEuro: props.helperRevenueEuro,
    helperCostsEuro: props.helperCostsEuro,
    helperCostsUnknown: props.helperCostsUnknown,
  });
  const helperActive = props.scenarioInputMode === 'REVENUE_COST';
  const exact = impact.status === 'EXACT' && net != null;
  const parsedCustom = parseEuroInputToCents(props.customScenarioEuro);
  const awaitingCustom =
    !helperActive && props.scenarioPreset === 'custom' && parsedCustom == null;
  const awaitingHelper = helperActive && helperChain == null;

  const tax = known(sim.taxDeltaCents);
  const incomeTax = known(sim.incomeTaxDeltaCents);
  const zvw = known(sim.zvwDeltaCents);
  const includedAllowances = sim.allowances.filter((line) => line.included || line.unknown);
  const allowanceDeltaTotal = includedAllowances.reduce((sum, line) => {
    const delta = known(line.deltaCents);
    return delta == null ? sum : (sum ?? 0) + delta;
  }, null as number | null);
  const perHundred =
    exact && extra != null && extra > 0 ? Math.round((net / extra) * 100) : null;

  return (
    <section
      id="verdiencheck-money-result"
      aria-labelledby={VERDIENCHECK_STEP_HEADING_ID}
      className="space-y-4 rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm"
    >
      <p className="text-lg font-semibold text-gray-900">{copy.whatIf}</p>
      <p className="text-sm leading-relaxed text-stone-600">{copy.scenarioSwitchHint}</p>
      <VerdienCheckCostAdvantage
        copy={copy}
        mode={props.scenarioInputMode}
        helperRevenueEuro={props.helperRevenueEuro}
        helperCostsEuro={props.helperCostsEuro}
        helperCostsUnknown={props.helperCostsUnknown}
        onSelectResultMode={props.onSelectResultMode}
        onSelectHelperMode={props.onSelectHelperMode}
        onHelperRevenueChange={props.onHelperRevenueChange}
        onHelperCostsChange={props.onHelperCostsChange}
        onHelperCostsUnknown={props.onHelperCostsUnknown}
      />
      {!helperActive ? (
        <>
          <p className="text-sm leading-relaxed text-stone-600">{copy.scenarioResultHint}</p>
          <div className="flex flex-wrap gap-2">
            {SCENARIO_PRESET_EUROS.map((euroAmount) => (
              <button
                key={euroAmount}
                type="button"
                aria-pressed={props.scenarioPreset === euroAmount}
                onClick={() => props.onSelectPreset(euroAmount)}
                className={`min-h-11 rounded-xl border px-3 py-2 text-base ${
                  props.scenarioPreset === euroAmount
                    ? 'border-emerald-700 bg-emerald-50 font-medium text-emerald-950'
                    : 'border-gray-200 bg-white text-gray-800'
                }`}
              >
                €{euroAmount.toLocaleString('nl-NL')}
              </button>
            ))}
            <button
              type="button"
              aria-pressed={props.scenarioPreset === 'custom'}
              onClick={props.onSelectCustom}
              className={`min-h-11 rounded-xl border px-3 py-2 text-base ${
                props.scenarioPreset === 'custom'
                  ? 'border-emerald-700 bg-emerald-50 font-medium text-emerald-950'
                  : 'border-gray-200 bg-white text-gray-800'
              }`}
            >
              {copy.customAmount}
            </button>
          </div>
          {props.scenarioPreset === 'custom' ? (
            <div className="space-y-2">
              <input
                inputMode="decimal"
                enterKeyHint="done"
                value={props.customScenarioEuro}
                onChange={(e) => props.onCustomChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    props.onApplyCustom();
                  }
                }}
                className="min-h-12 w-full rounded-xl border border-gray-200 px-4 py-3 text-lg"
                placeholder="€"
                aria-label={copy.customAmount}
              />
              <button
                type="button"
                onClick={props.onApplyCustom}
                className="min-h-11 w-full rounded-xl bg-emerald-800 px-4 py-2 text-base font-semibold text-white"
              >
                {copy.applyCustomAmount}
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {awaitingCustom || awaitingHelper ? (
        <p className="text-base leading-relaxed text-stone-700">
          {helperActive ? copy.helperAwaiting : 'Vul een extra resultaat in. Je huidige situatie blijft staan.'}
        </p>
      ) : exact && extra != null ? (
        <div className="space-y-2">
          {helperChain ? (
            <div className="space-y-2 rounded-xl border border-stone-100 bg-stone-50 p-3">
              <p className="text-sm font-medium text-stone-800">{copy.fromSaleToKeptTitle}</p>
              <ul className="space-y-1 text-sm">
                <li className="flex justify-between gap-4">
                  <span>{copy.helperRevenueLabel}</span>
                  <span>€{whole(helperChain.revenueCents)}</span>
                </li>
                <li className="flex justify-between gap-4">
                  <span>{copy.helperCostsLabel}</span>
                  <span>− €{whole(helperChain.costsCents)}</span>
                </li>
                <li className="flex justify-between gap-4 font-medium text-stone-800">
                  <span>{copy.helperResultLabel}</span>
                  <span>€{whole(helperChain.resultCents)}</span>
                </li>
              </ul>
            </div>
          ) : null}
          <p className="text-lg font-semibold leading-snug text-stone-900">{copy.moneyResultTitle}</p>
          {helperChain ? (
            <p className="text-xl font-semibold leading-snug text-stone-900">
              {copy.helperProgressLead} €{whole(helperChain.revenueCents)} {copy.helperProgressMid} €
              {whole(net)} {copy.helperProgressEnd}
            </p>
          ) : (
            <p className="text-xl font-semibold leading-snug text-stone-900">
              Met €{whole(extra)} extra resultaat houd je naar schatting €{whole(net)} extra over.
            </p>
          )}
          {month != null ? (
            <p className="text-base text-stone-700">
              Dat is ongeveer €{whole(month)} per maand extra.
            </p>
          ) : null}
          <p className="text-sm leading-relaxed text-stone-600">
            {PERSONAL_ROUTE_COPY.taxAndAllowancesIncluded}
          </p>
          {perHundred != null && Number.isFinite(perHundred) ? (
            <p className="text-sm text-stone-600">
              Van iedere €100 extra resultaat houd je in dit scenario ongeveer €{perHundred} extra
              over.
            </p>
          ) : null}

          {includedAllowances.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-stone-100">
              <table className="w-full min-w-[16rem] text-left text-sm">
                <caption className="sr-only">{copy.allowancesHeading}</caption>
                <thead>
                  <tr className="border-b border-stone-100 text-stone-500">
                    <th className="px-3 py-2 font-medium">{copy.allowancesHeading}</th>
                    <th className="px-3 py-2 font-medium">{PERSONAL_ROUTE_COPY.nowLabel}</th>
                    <th className="px-3 py-2 font-medium">
                      {PERSONAL_ROUTE_COPY.scenarioLabel}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {includedAllowances.map((line) => {
                    const currentN = known(line.currentCents);
                    const scenarioN = known(line.scenarioCents);
                    return (
                      <tr key={line.id} className="border-b border-stone-50">
                        <td className="px-3 py-2">{ALLOWANCE_NAME[line.id]}</td>
                        <td className="px-3 py-2">
                          {currentN != null && !line.unknown
                            ? `€${whole(Math.round(currentN / 12))} ${copy.perMonthShort}`
                            : copy.notYetCalculable}
                        </td>
                        <td className="px-3 py-2">
                          {scenarioN != null && !line.unknown
                            ? `€${whole(Math.round(scenarioN / 12))} ${copy.perMonthShort}`
                            : copy.notYetCalculable}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}

          {allowanceDeltaTotal != null ? (
            <p className="text-sm font-medium text-stone-800">
              {copy.allowanceChange} {signedWhole(Math.round(allowanceDeltaTotal / 12))} {copy.perMonthShort}
            </p>
          ) : null}

          <p className="text-base font-semibold text-stone-900">{copy.netExtraKeepTitle}</p>
          {exact && net != null ? (
            <p className="text-lg font-semibold text-stone-900">
              €{whole(net)} {copy.perYearShort}
              {month != null ? (
                <span className="block text-base font-normal text-stone-700">
                  €{whole(month)} {copy.perMonthShort}
                </span>
              ) : null}
            </p>
          ) : null}

          {incomeTax != null || zvw != null ? (
            <div className="space-y-1 rounded-xl border border-stone-100 bg-stone-50 p-3 text-sm">
              <p className="font-medium text-stone-800">{copy.extraTaxReserveTitle}</p>
              {incomeTax != null ? (
                <div className="flex justify-between gap-4">
                  <span>{copy.extraIncomeTax}</span>
                  <span>€{whole(incomeTax)}</span>
                </div>
              ) : null}
              {zvw != null ? (
                <div className="flex justify-between gap-4">
                  <span>{copy.zvwContributionLabel}</span>
                  <span>€{whole(zvw)}</span>
                </div>
              ) : null}
              {tax != null ? (
                <>
                  <div className="flex justify-between gap-4 border-t border-stone-200 pt-1 font-medium">
                    <span>Totaal</span>
                    <span>€{whole(tax)}</span>
                  </div>
                  <p className="pt-1 text-stone-600">
                    {copy.setAsidePrefix}
                    {whole(tax)}
                    {copy.setAsideSuffix}
                  </p>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-base leading-relaxed text-stone-700">
          {sim.uncertaintyWhy ?? impact.headline}
        </p>
      )}

      <p className="text-sm leading-relaxed text-stone-600">{impact.turnoverVsResultNote}</p>

      <details className="rounded-xl border border-stone-200 bg-stone-50 p-4">
        <summary className="cursor-pointer min-h-11 text-base font-medium text-stone-800">
          {PERSONAL_ROUTE_COPY.viewCalculation}
        </summary>
        <div className="mt-4 space-y-4 text-sm">
          {extra != null ? (
            <div className="flex justify-between gap-4">
              <span>{copy.extraResult}</span>
              <span className="font-medium">{signedWhole(extra)}</span>
            </div>
          ) : null}
          {tax != null ? (
            <div className="flex justify-between gap-4">
              <span>{PERSONAL_ROUTE_COPY.extraTax}</span>
              <span>{signedWhole(-tax)}</span>
            </div>
          ) : null}
          {includedAllowances.map((line) => {
            const currentN = known(line.currentCents);
            const scenarioN = known(line.scenarioCents);
            const name = ALLOWANCE_NAME[line.id];
            return (
              <div key={line.id} className="space-y-1 border-t border-stone-100 pt-3">
                <p className="font-medium text-stone-800">{name}</p>
                {currentN != null && scenarioN != null ? (
                  <p className="text-stone-600">
                    {PERSONAL_ROUTE_COPY.nowLabel}: €{whole(currentN)} per jaar →{' '}
                    {PERSONAL_ROUTE_COPY.scenarioLabel}: €{whole(scenarioN)} per jaar
                    {known(line.deltaCents) != null ? ` (${signedWhole(known(line.deltaCents) ?? 0)})` : ''}
                  </p>
                ) : null}
                {line.rightLost ? (
                  <p className="text-stone-600">{PERSONAL_ROUTE_COPY.rightAtZero}</p>
                ) : null}
                {line.unchanged ? (
                  <p className="text-stone-600">{PERSONAL_ROUTE_COPY.unchangedAllowance}</p>
                ) : null}
              </div>
            );
          })}
          {exact && net != null ? (
            <p className="border-t border-stone-200 pt-3 text-base font-semibold text-stone-900">
              {PERSONAL_ROUTE_COPY.netProgress}: {signedWhole(net)}
            </p>
          ) : null}
          {sim.excludedNotes.length > 0 ? (
            <ul className="space-y-1 text-stone-600">
              {sim.excludedNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </details>

      {props.comparison ? (
        <div className="overflow-x-auto rounded-xl border border-stone-100">
          <table className="w-full min-w-[18rem] text-left text-sm">
            <caption className="sr-only">{copy.comparisonHeading}</caption>
            <thead>
              <tr className="border-b border-stone-100 text-stone-500">
                <th className="px-3 py-2 font-medium">{copy.extraResult}</th>
                <th className="px-3 py-2 font-medium">{copy.comparisonNet}</th>
                <th className="px-3 py-2 font-medium">{copy.comparisonMonth}</th>
              </tr>
            </thead>
            <tbody>
              {props.comparison.map((row) => (
                <tr
                  key={row.euro}
                  className={props.scenarioPreset === row.euro ? 'bg-emerald-50' : undefined}
                >
                  <td className="px-3 py-2">€{row.euro.toLocaleString('nl-NL')}</td>
                  <td className="px-3 py-2">
                    {row.comparable && !isUnknown(row.netExtraCents)
                      ? `€${whole(row.netExtraCents)}`
                      : copy.notCalculated}
                  </td>
                  <td className="px-3 py-2">
                    {row.comparable && !isUnknown(row.monthlyApproxCents)
                      ? `€${whole(row.monthlyApproxCents)}`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <details className="text-sm text-stone-600">
        <summary className="cursor-pointer min-h-11 font-medium text-stone-800">
          {PERSONAL_ROUTE_COPY.whyTaxTitle}
        </summary>
        <p className="mt-2 leading-relaxed">{PERSONAL_ROUTE_COPY.whyTaxBody}</p>
      </details>
      <details className="text-sm text-stone-600">
        <summary className="cursor-pointer min-h-11 font-medium text-stone-800">
          {PERSONAL_ROUTE_COPY.whyAllowancesTitle}
        </summary>
        <p className="mt-2 leading-relaxed">{PERSONAL_ROUTE_COPY.whyAllowancesBody}</p>
      </details>

      {exact && sim.includedNotes.includes('Berekening compleet.') ? (
        <p className="text-xs text-stone-500">{PERSONAL_ROUTE_COPY.calculationComplete}</p>
      ) : null}
      {copy.monthlyFromYearNote ? (
        <p className="text-xs text-stone-500">{copy.monthlyFromYearNote}</p>
      ) : null}
      <p className="text-xs text-stone-400">{PERSONAL_ROUTE_COPY.estimateOnRules}</p>
    </section>
  );
}
