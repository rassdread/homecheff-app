import {
  formatCentsAsWholeEuroDisplay,
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
  comparison: ScenarioComparisonRow[] | null;
  onSelectPreset: (euro: ScenarioPresetEuro) => void;
  onSelectCustom: () => void;
  onCustomChange: (value: string) => void;
}) {
  const { copy, route } = props;
  const impact = route.financialImpact;
  if (impact.status === 'NOT_APPLICABLE') return null;

  const sim = impact.simulator;
  const extra = sim.extraResultCents ?? impact.extraResultCents;
  const net = known(sim.netExtraCents);
  const month = known(sim.monthlyApproxCents);
  const exact = impact.status === 'EXACT' && net != null;
  if (!exact && (extra == null || extra === 0)) return null;

  const tax = known(sim.taxDeltaCents);
  const includedAllowances = sim.allowances.filter((line) => line.included);
  const perHundred =
    exact && extra != null && extra > 0 ? Math.round((net / extra) * 100) : null;

  return (
    <section
      id="verdiencheck-money-result"
      aria-labelledby={VERDIENCHECK_STEP_HEADING_ID}
      className="space-y-4 rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm"
    >
      <p className="text-sm leading-relaxed text-stone-600">{copy.scenarioSwitchHint}</p>
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
        <input
          inputMode="decimal"
          value={props.customScenarioEuro}
          onChange={(e) => props.onCustomChange(e.target.value)}
          className="min-h-12 w-full rounded-xl border border-gray-200 px-4 py-3 text-lg"
          placeholder="€"
        />
      ) : null}

      {exact && extra != null ? (
        <div className="space-y-2">
          <p className="text-xl font-semibold leading-snug text-stone-900">
            Met €{whole(extra)} extra resultaat houd je naar schatting €{whole(net)} extra over.
          </p>
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
