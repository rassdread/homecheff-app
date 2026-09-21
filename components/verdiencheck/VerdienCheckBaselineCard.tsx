import {
  formatCentsAsWholeEuroDisplay,
} from '@/lib/verdiencheck/domain/money';
import { isUnknown, type CentsOrUnknown } from '@/lib/verdiencheck/domain/unknown';
import type { PersonalVerdienRoute } from '@/lib/verdiencheck/personal-route';
import { PERSONAL_ROUTE_COPY } from '@/lib/verdiencheck/personal-route/copy';
import type { SimulatorAllowanceId } from '@/lib/verdiencheck/personal-route/types';
import type { VerdienCheckCopy } from '@/lib/verdiencheck/i18n/copy';
import { VERDIENCHECK_STEP_HEADING_ID } from '@/lib/verdiencheck/wizard/active-step-focus';

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

function allowanceDisplay(
  copy: VerdienCheckCopy,
  line: { unknown: boolean; notApplicable: boolean; currentCents: CentsOrUnknown | null },
): { text: string; exactZero: boolean } {
  if (line.notApplicable) return { text: copy.notApplicableShort, exactZero: false };
  if (line.unknown) return { text: copy.notYetCalculable, exactZero: false };
  const current = known(line.currentCents);
  if (current == null) return { text: copy.notYetCalculable, exactZero: false };
  return {
    text: `€${whole(monthly(current))} ${copy.perMonthShort}`,
    exactZero: current === 0,
  };
}

export default function VerdienCheckBaselineCard(props: {
  copy: VerdienCheckCopy;
  route: PersonalVerdienRoute;
  incomeAnnualCents: number | null;
  incomeIsNetEstimate: boolean;
  incomeUnknownReason: string | null;
  /** When the page h1 already is this title, omit the duplicate card heading. */
  showHeading?: boolean;
}) {
  const baseline = props.route.financialImpact.baseline;
  const lines = baseline?.allowances ?? [];
  const showHeading = props.showHeading !== false;
  const headingId = showHeading ? 'verdiencheck-baseline-title' : VERDIENCHECK_STEP_HEADING_ID;
  const incomeAnnual = baseline?.incomeAnnualCents ?? props.incomeAnnualCents;
  const incomeIsNetEstimate = baseline?.incomeIsNetEstimate ?? props.incomeIsNetEstimate;
  const incomeUnknownReason = baseline?.incomeUnknownReason ?? props.incomeUnknownReason;
  const incomeUnknown = baseline?.incomeUnknown === true || incomeAnnual == null;
  const taxAnnual = known(baseline?.incomeTaxAnnualCents ?? null);
  const totalExact = baseline?.allowanceTotalExact === true;
  const totalMonthly = known(baseline?.totalAllowancesMonthlyCents ?? null);
  const totalAnnual = known(baseline?.totalAllowancesAnnualCents ?? null);
  const showHolidayAmount = (baseline?.holidayPayCents ?? 0) > 0;
  const showHolidayIncluded =
    !showHolidayAmount && baseline?.holidayPayIncluded === true && incomeAnnual != null;

  return (
    <section
      aria-labelledby={headingId}
      data-verdiencheck-baseline=""
      className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
    >
      {showHeading ? (
        <h2 id="verdiencheck-baseline-title" className="text-lg font-semibold text-gray-900">
          {props.copy.situationNowTitle}
        </h2>
      ) : null}
      <p className="text-sm leading-relaxed text-stone-600">{props.copy.estimatedEntitlement}</p>

      <div data-verdiencheck-baseline-summary="" className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-wide text-stone-500">
          {props.copy.currentBasisSummary}
        </p>
        {incomeUnknown ? (
          <p className="text-base text-stone-700">
            {props.copy.notYetCalculable}
            {incomeUnknownReason ? (
              <span className="mt-1 block text-sm font-normal text-stone-600">
                {incomeUnknownReason}
              </span>
            ) : null}
          </p>
        ) : incomeAnnual != null ? (
          <p className="text-xl font-semibold tabular-nums text-stone-900">
            €{whole(incomeAnnual)}{' '}
            <span className="text-sm font-normal text-stone-600">
              {incomeIsNetEstimate ? props.copy.estimateLabel : props.copy.estimatedAnnualIncomeShort}
            </span>
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-stone-500">
          {props.copy.incomeHeading}
        </p>
        {incomeIsNetEstimate && baseline?.enteredNetMonthlyCents != null ? (
          <div className="flex justify-between gap-4 text-base text-stone-800">
            <span>{props.copy.netEnteredLabel}</span>
            <span className="text-right font-medium tabular-nums">
              €{whole(baseline.enteredNetMonthlyCents)} {props.copy.perMonthShort}
            </span>
          </div>
        ) : null}
        <div className="flex justify-between gap-4 text-base text-stone-800">
          <span>
            {incomeIsNetEstimate
              ? props.copy.estimatedGrossIncomeLabel
              : baseline?.contractualGrossCents == null &&
                  baseline?.fiscalWageCents != null &&
                  baseline.fiscalWageCents === incomeAnnual
                ? props.copy.fiscalIncomeLabel
                : baseline?.contractualGrossCents == null &&
                    baseline?.fiscalWageCents == null &&
                    baseline?.assessmentIncomeCents != null &&
                    baseline.assessmentIncomeCents === incomeAnnual
                  ? props.copy.assessmentIncomeLabel
                  : props.copy.grossIncomeLabel}
            {incomeIsNetEstimate ? (
              <span
                data-verdiencheck-estimate=""
                className="ml-2 text-xs font-normal uppercase tracking-wide text-amber-800"
              >
                {props.copy.estimateLabel}
              </span>
            ) : null}
          </span>
          {incomeAnnual != null ? (
            <span className="text-right font-medium tabular-nums">
              €{whole(incomeAnnual)} {props.copy.perYearShort}
              <span className="block text-sm font-normal text-stone-600">
                €{whole(monthly(incomeAnnual))} {props.copy.perMonthShort}
              </span>
            </span>
          ) : (
            <span className="text-right text-sm text-stone-600">
              {props.copy.notYetCalculable}
            </span>
          )}
        </div>
        {showHolidayAmount ? (
          <div className="flex justify-between gap-4 text-sm text-stone-700">
            <span>{props.copy.holidayPayAmountLabel}</span>
            <span className="tabular-nums">€{whole(baseline?.holidayPayCents ?? 0)}</span>
          </div>
        ) : null}
        {showHolidayIncluded ? (
          <div className="flex justify-between gap-4 text-sm text-stone-700">
            <span>{props.copy.holidayPayAmountLabel}</span>
            <span>{props.copy.holidayPayIncludedShort}</span>
          </div>
        ) : null}
        {incomeIsNetEstimate && incomeAnnual != null ? (
          <div className="flex justify-between gap-4 text-sm text-stone-700">
            <span>{props.copy.estimatedFiscalYearLabel}</span>
            <span className="tabular-nums">
              €{whole(baseline?.fiscalWageCents ?? incomeAnnual)} {props.copy.perYearShort}
            </span>
          </div>
        ) : null}
        {baseline?.showDistinctFiscal && baseline.fiscalWageCents != null ? (
          <div className="flex justify-between gap-4 text-sm text-stone-700">
            <span>{props.copy.fiscalIncomeLabel}</span>
            <span className="tabular-nums">
              €{whole(baseline.fiscalWageCents)} {props.copy.perYearShort}
            </span>
          </div>
        ) : null}
        {baseline?.showDistinctAssessment && baseline.assessmentIncomeCents != null ? (
          <div className="flex justify-between gap-4 text-sm text-stone-700">
            <span>{props.copy.assessmentIncomeLabel}</span>
            <span className="tabular-nums">
              €{whole(baseline.assessmentIncomeCents)} {props.copy.perYearShort}
            </span>
          </div>
        ) : null}
        {incomeIsNetEstimate ? (
          <p className="text-sm leading-relaxed text-stone-600">{props.copy.netToGrossPayslipNote}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-stone-500">
          {props.copy.taxAndAllowancesHeading}
        </p>
        <div className="flex justify-between gap-4 text-base text-stone-800">
          <span>
            {props.copy.currentIncomeTaxLabel}
            <span className="block text-xs font-normal text-stone-500">
              {props.copy.currentIncomeTaxHint}
            </span>
          </span>
          {taxAnnual != null ? (
            <span className="text-right font-medium tabular-nums">
              €{whole(taxAnnual)} {props.copy.perYearShort}
            </span>
          ) : (
            <span className="text-right text-sm text-stone-600">{props.copy.notYetCalculable}</span>
          )}
        </div>
        {lines.map((line) => {
          const display = allowanceDisplay(props.copy, line);
          return (
            <div key={line.id} className="flex justify-between gap-4 text-base text-stone-800">
              <span>{ALLOWANCE_NAME[line.id]}</span>
              <span
                className={`text-right ${display.exactZero || line.notApplicable || line.unknown ? 'text-sm text-stone-600' : 'font-medium tabular-nums'}`}
              >
                {display.text}
                {line.unknown && line.excludedReason ? (
                  <span className="block font-normal">{line.excludedReason}</span>
                ) : null}
              </span>
            </div>
          );
        })}
        {totalExact && totalMonthly != null ? (
          <div className="flex justify-between gap-4 border-t border-stone-100 pt-2 text-base font-semibold text-stone-900">
            <span>{props.copy.totalAllowances}</span>
            <span className="text-right tabular-nums">
              €{whole(totalMonthly)} {props.copy.perMonthShort}
              {totalAnnual != null ? (
                <span className="block text-sm font-normal text-stone-600">
                  €{whole(totalAnnual)} {props.copy.perYearShort}
                </span>
              ) : null}
            </span>
          </div>
        ) : lines.some((line) => line.unknown && !line.notApplicable) ? (
          <p className="text-sm text-stone-600">{props.copy.allowanceTotalIncomplete}</p>
        ) : null}
        {baseline?.showZvwEmployerNote ? (
          <p data-verdiencheck-zvw-note="" className="text-sm leading-relaxed text-stone-600">
            {props.copy.zvwEmployerNote}
          </p>
        ) : null}
      </div>

      <details className="rounded-xl border border-stone-100 bg-stone-50/70 px-3 py-2 text-sm text-stone-700">
        <summary className="cursor-pointer font-medium text-stone-800">
          {props.copy.moreExplanation}
        </summary>
        <div className="mt-2 space-y-2 leading-relaxed">
          <p>
            <span className="font-medium">{props.copy.incomeBasesDetailsTitle}. </span>
            {props.copy.incomeBasesDetailsBody}
          </p>
          {incomeIsNetEstimate ? (
            <p>
              <span className="font-medium">{props.copy.estimateProvenanceTitle} </span>
              {props.copy.estimateProvenanceBody}
            </p>
          ) : null}
          {baseline?.showZvwEmployerNote ? <p>{props.copy.zvwEmployerNote}</p> : null}
        </div>
      </details>
    </section>
  );
}
