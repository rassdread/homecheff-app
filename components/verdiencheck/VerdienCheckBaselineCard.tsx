import {
  formatCentsAsWholeEuroDisplay,
} from '@/lib/verdiencheck/domain/money';
import { isUnknown, type CentsOrUnknown } from '@/lib/verdiencheck/domain/unknown';
import type { PersonalVerdienRoute } from '@/lib/verdiencheck/personal-route';
import { PERSONAL_ROUTE_COPY } from '@/lib/verdiencheck/personal-route/copy';
import type { SimulatorAllowanceId } from '@/lib/verdiencheck/personal-route/types';
import type { VerdienCheckCopy } from '@/lib/verdiencheck/i18n/copy';

function whole(cents: number): string {
  return formatCentsAsWholeEuroDisplay(cents);
}

function known(value: CentsOrUnknown | null | undefined): number | null {
  if (value == null || isUnknown(value)) return null;
  return value;
}

function monthly(annual: number): number {
  return Math.round(annual / 12);
}

const ALLOWANCE_NAME: Record<SimulatorAllowanceId, string> = {
  HEALTHCARE: PERSONAL_ROUTE_COPY.healthcareName,
  RENT: PERSONAL_ROUTE_COPY.rentName,
  CHILD_BUDGET: PERSONAL_ROUTE_COPY.childBudgetName,
  CHILDCARE: PERSONAL_ROUTE_COPY.childcareName,
};

export default function VerdienCheckBaselineCard(props: {
  copy: VerdienCheckCopy;
  route: PersonalVerdienRoute;
  incomeAnnualCents: number | null;
  incomeIsNetEstimate: boolean;
  incomeUnknownReason: string | null;
}) {
  const baseline = props.route.financialImpact.baseline;
  const lines = baseline?.allowances ?? [];

  return (
    <section
      aria-labelledby="verdiencheck-baseline-title"
      className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
    >
      <h2 id="verdiencheck-baseline-title" className="text-lg font-semibold text-gray-900">
        {props.copy.situationNowTitle}
      </h2>
      <p className="text-sm leading-relaxed text-stone-600">{props.copy.estimatedEntitlement}</p>

      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-stone-500">
          {props.copy.incomeHeading}
        </p>
        <div className="flex justify-between gap-4 text-base text-stone-800">
          <span>{props.copy.grossIncomeLabel}</span>
          {props.incomeAnnualCents != null ? (
            <span className="text-right font-medium">
              €{whole(props.incomeAnnualCents)} {props.copy.perYearShort}
              <span className="block text-sm font-normal text-stone-600">
                €{whole(monthly(props.incomeAnnualCents))} {props.copy.perMonthShort}
              </span>
            </span>
          ) : (
            <span className="text-right text-sm text-stone-600">
              {props.copy.notYetCalculable}
              {props.incomeUnknownReason ? (
                <span className="block font-normal">{props.incomeUnknownReason}</span>
              ) : null}
            </span>
          )}
        </div>
        {props.incomeIsNetEstimate ? (
          <p className="text-sm leading-relaxed text-stone-600">{props.copy.netInputEstimateNote}</p>
        ) : null}
      </div>

      {lines.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-wide text-stone-500">
            {props.copy.allowancesHeading}
          </p>
          {lines.map((line) => {
            const current = known(line.currentCents);
            const name = ALLOWANCE_NAME[line.id];
            return (
              <div key={line.id} className="flex justify-between gap-4 text-base text-stone-800">
                <span>{name}</span>
                {current != null && !line.unknown ? (
                  <span className="text-right font-medium">
                    €{whole(monthly(current))} {props.copy.perMonthShort}
                  </span>
                ) : (
                  <span className="text-right text-sm text-stone-600">
                    {props.copy.notYetCalculable}
                    {line.excludedReason ? (
                      <span className="block font-normal">{line.excludedReason}</span>
                    ) : null}
                  </span>
                )}
              </div>
            );
          })}
          {baseline && known(baseline.totalAllowancesMonthlyCents) != null ? (
            <div className="flex justify-between gap-4 border-t border-stone-100 pt-2 text-base font-semibold text-stone-900">
              <span>{props.copy.totalAllowances}</span>
              <span className="text-right">
                €{whole(known(baseline.totalAllowancesMonthlyCents) ?? 0)} {props.copy.perMonthShort}
                {known(baseline.totalAllowancesAnnualCents) != null ? (
                  <span className="block text-sm font-normal text-stone-600">
                    €{whole(known(baseline.totalAllowancesAnnualCents) ?? 0)} {props.copy.perYearShort}
                  </span>
                ) : null}
              </span>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
