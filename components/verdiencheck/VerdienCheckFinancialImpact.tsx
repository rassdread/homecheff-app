import { formatCentsAsEuroDisplay, SCENARIO_PRESET_EUROS } from '@/lib/verdiencheck/domain/money';
import { isUnknown } from '@/lib/verdiencheck/domain/unknown';
import type { PersonalVerdienRoute } from '@/lib/verdiencheck/personal-route';
import { PERSONAL_ROUTE_COPY } from '@/lib/verdiencheck/personal-route/copy';
import type { ScenarioPresetEuro } from '@/lib/verdiencheck/domain/money';
import type { VerdienCheckCopy } from '@/lib/verdiencheck/i18n/copy';
import type { ScenarioComparisonRow } from '@/lib/verdiencheck/wizard/scenario-comparison';
import type { WizardState } from '@/lib/verdiencheck/wizard/schema';

function euro(cents: number): string {
  const sign = cents < 0 ? '- ' : cents > 0 ? '+ ' : '';
  return `${sign}€${formatCentsAsEuroDisplay(Math.abs(cents))}`;
}

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

  const extra = impact.extraResultCents;
  const net = impact.netExtraCents;
  const month = impact.monthlyApproxCents;
  const exact = impact.status === 'EXACT' && net != null && !isUnknown(net);
  if (!exact && (extra == null || extra === 0)) return null;

  return (
    <section
      id="verdiencheck-money-result"
      className="space-y-4 rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm"
    >
      <h2 className="text-2xl font-semibold tracking-tight text-stone-900">{copy.moneyResultTitle}</h2>
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
                      ? `€${formatCentsAsEuroDisplay(row.netExtraCents)}`
                      : copy.notCalculated}
                  </td>
                  <td className="px-3 py-2">
                    {row.comparable && !isUnknown(row.monthlyApproxCents)
                      ? `€${formatCentsAsEuroDisplay(row.monthlyApproxCents)}`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <p className="text-base leading-relaxed text-stone-700">{impact.turnoverVsResultNote}</p>
      <dl className="space-y-2 text-sm">
        {extra != null && (
          <div className="flex justify-between gap-4">
            <dt>{copy.extraResult}</dt>
            <dd className="font-medium">{euro(extra)}</dd>
          </div>
        )}
        {impact.taxDeltaCents != null && !isUnknown(impact.taxDeltaCents) && (
          <div className="flex justify-between gap-4">
            <dt>{copy.taxChanges}</dt>
            <dd>{euro(-impact.taxDeltaCents)}</dd>
          </div>
        )}
        {impact.allowanceDeltaCents != null &&
          !isUnknown(impact.allowanceDeltaCents) &&
          impact.allowanceDeltaCents !== 0 && (
            <div className="flex justify-between gap-4">
              <dt>{copy.healthcareChanges}</dt>
              <dd>{euro(impact.allowanceDeltaCents)}</dd>
            </div>
          )}
        {exact ? (
          <p className="border-t border-stone-100 pt-3 text-base font-medium text-stone-900">
            {copy.keepEstimatePrefix}
            {formatCentsAsEuroDisplay(extra ?? 0)}
            {copy.keepEstimateMiddle}
            {formatCentsAsEuroDisplay(net)}
            {copy.keepEstimateSuffix}
          </p>
        ) : (
          <p className="border-t border-stone-100 pt-2 text-stone-600">{impact.headline}</p>
        )}
      </dl>
      {exact && month != null && !isUnknown(month) && (
        <p className="text-sm text-stone-600">
          Gemiddeld is dat ongeveer €{formatCentsAsEuroDisplay(month)} per maand extra over.
        </p>
      )}
      {exact ? <p className="text-xs text-stone-500">{copy.monthlyFromYearNote}</p> : null}
      <p className="text-xs text-stone-400">{PERSONAL_ROUTE_COPY.estimateYear}</p>
    </section>
  );
}
