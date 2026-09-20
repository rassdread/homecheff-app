import { formatCentsAsEuroDisplay } from '@/lib/verdiencheck/domain/money';
import { isUnknown } from '@/lib/verdiencheck/domain/unknown';
import type { PersonalVerdienRoute } from '@/lib/verdiencheck/personal-route';
import { PERSONAL_ROUTE_COPY } from '@/lib/verdiencheck/personal-route/copy';
import type { VerdienCheckCopy } from '@/lib/verdiencheck/i18n/copy';

function euro(cents: number): string {
  const sign = cents < 0 ? '- ' : cents > 0 ? '+ ' : '';
  return `${sign}€${formatCentsAsEuroDisplay(Math.abs(cents))}`;
}

export default function VerdienCheckFinancialImpact(props: {
  copy: VerdienCheckCopy;
  route: PersonalVerdienRoute;
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
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-stone-900">
        {copy.whatIf}
        {extra != null ? ` €${formatCentsAsEuroDisplay(extra)}` : ''}
      </h2>
      <p className="mt-1 text-sm text-stone-500">{impact.turnoverVsResultNote}</p>
      <dl className="mt-4 space-y-2 text-sm">
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
          <>
            <p className="border-t border-stone-100 pt-3 text-base font-medium text-stone-900">
              {copy.keepEstimatePrefix}
              {formatCentsAsEuroDisplay(extra ?? 0)}
              {copy.keepEstimateMiddle}
              {formatCentsAsEuroDisplay(net)}
              {copy.keepEstimateSuffix}
            </p>
            <div className="flex justify-between gap-4 font-semibold">
              <dt>{copy.netKeep}</dt>
              <dd>{euro(net)}</dd>
            </div>
          </>
        ) : (
          <p className="border-t border-stone-100 pt-2 text-stone-600">{impact.headline}</p>
        )}
      </dl>
      {exact && month != null && !isUnknown(month) && (
        <p className="mt-2 text-sm text-stone-600">
          Dat is ongeveer €{formatCentsAsEuroDisplay(month)} per maand extra.
        </p>
      )}
      <p className="mt-3 text-xs text-stone-400">{PERSONAL_ROUTE_COPY.estimateYear}</p>
    </section>
  );
}
