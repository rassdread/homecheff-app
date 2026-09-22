'use client';

import { useState } from 'react';
import {
  formatCentsAsWholeEuroDisplay,
} from '@/lib/verdiencheck/domain/money';
import { isUnknown, type CentsOrUnknown } from '@/lib/verdiencheck/domain/unknown';
import type { PersonalVerdienRoute } from '@/lib/verdiencheck/personal-route';
import { PERSONAL_ROUTE_COPY } from '@/lib/verdiencheck/personal-route/copy';
import type { SimulatorAllowanceId } from '@/lib/verdiencheck/personal-route/types';
import type { VerdienCheckCopy } from '@/lib/verdiencheck/i18n/copy';
import { VERDIENCHECK_STEP_HEADING_ID } from '@/lib/verdiencheck/wizard/active-step-focus';
import VerdienCheckInfoDialog from '@/components/verdiencheck/VerdienCheckInfoDialog';

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
  onRequestPayslipAccuracy?: () => void;
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
  const extraPayCents = baseline?.employmentExtrasCents ?? 0;
  const showExtraPayAmount = extraPayCents > 0;
  const extraPayHasDetail =
    [
      baseline?.thirteenthMonthCents ?? 0,
      baseline?.bonusCommissionCents ?? 0,
      baseline?.overtimeOtherPayCents ?? 0,
    ].filter((cents) => cents > 0).length > 0;
  // UNKNOWN extra pay is not a factual €0, so the card says it was left out.
  const extraPayUnknown =
    !showExtraPayAmount &&
    baseline?.employmentExtrasStatus === 'UNKNOWN' &&
    incomeAnnual != null;
  const ownerHome = baseline?.ownerHome ?? null;
  const ownerActive =
    ownerHome != null &&
    (ownerHome.status === 'COMPLETE' || ownerHome.status === 'PARTIAL');
  const [housingInfoOpen, setHousingInfoOpen] = useState(false);
  const [payslipOpen, setPayslipOpen] = useState(false);
  const [extraPayOpen, setExtraPayOpen] = useState(false);
  const pensionStatus = baseline?.pensionStatus ?? null;
  const pensionKnown =
    pensionStatus === 'AMOUNT' || baseline?.pensionExplicitZero === true;
  const bankNet = baseline?.bankNetMonthlyCents ?? baseline?.statutoryNetMonthlyCents ?? null;
  const showPayslipNet =
    !incomeIsNetEstimate &&
    baseline?.payrollUsed &&
    bankNet != null &&
    baseline.enteredNetMonthlyCents == null;

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
        {incomeIsNetEstimate && baseline?.estimatedGrossMonthlyCents != null ? (
          <div className="flex justify-between gap-4 text-base text-stone-800">
            <span>
              {props.copy.estimatedGrossMonthlyLabel}
              <span
                data-verdiencheck-estimate=""
                className="ml-2 text-xs font-normal uppercase tracking-wide text-amber-800"
              >
                {props.copy.estimateLabel}
              </span>
            </span>
            <span className="text-right font-medium tabular-nums">
              €{whole(baseline.estimatedGrossMonthlyCents)} {props.copy.perMonthShort}
            </span>
          </div>
        ) : null}
        {showPayslipNet ? (
          <div data-verdiencheck-payslip="" className="space-y-2">
            <div className="flex justify-between gap-4 text-base text-stone-800">
              <span>
                {pensionKnown ? props.copy.bankNetEstimateLabel : props.copy.statutoryNetEstimateLabel}
                <span
                  data-verdiencheck-estimate=""
                  className="ml-2 text-xs font-normal uppercase tracking-wide text-amber-800"
                >
                  {props.copy.estimateLabel}
                </span>
              </span>
              <span
                data-verdiencheck-bank-net=""
                className="text-right font-medium tabular-nums"
              >
                €{whole(bankNet ?? 0)} {props.copy.perMonthShort}
              </span>
            </div>
            {pensionKnown ? null : (
              <p className="text-sm leading-relaxed text-stone-600">
                {props.copy.statutoryNetEstimateInfo}
              </p>
            )}
            {!pensionKnown ? (
              <p data-verdiencheck-pension-unknown="" className="text-sm text-stone-700">
                {props.copy.pensionNotIncluded}
              </p>
            ) : null}
            <button
              type="button"
              className="text-sm font-medium text-emerald-800 underline-offset-2 hover:underline"
              onClick={() => setPayslipOpen((open) => !open)}
            >
              {props.copy.viewPayslipBreakdown}
            </button>
            {payslipOpen ? (
              <div data-verdiencheck-payslip-details="" className="space-y-1 text-sm text-stone-700">
                {baseline?.enteredGrossMonthlyCents != null ||
                baseline?.estimatedGrossMonthlyCents != null ? (
                  <div className="flex justify-between gap-4">
                    <span>{props.copy.payslipGrossLabel}</span>
                    <span className="tabular-nums">
                      €
                      {whole(
                        baseline.enteredGrossMonthlyCents ??
                          baseline.estimatedGrossMonthlyCents ??
                          0,
                      )}
                    </span>
                  </div>
                ) : null}
                {baseline?.withheldPayrollTaxCents != null ? (
                  <div className="flex justify-between gap-4">
                    <span>{props.copy.payslipWithholdingLabel}</span>
                    <span className="tabular-nums">
                      − €{whole(baseline.withheldPayrollTaxCents)}
                    </span>
                  </div>
                ) : null}
                {baseline?.pensionExplicitZero ? (
                  <div className="flex justify-between gap-4">
                    <span>{props.copy.payslipPensionLabel}</span>
                    <span className="tabular-nums">€0</span>
                  </div>
                ) : pensionStatus === 'AMOUNT' && baseline?.employeePensionCents != null ? (
                  <div className="flex justify-between gap-4">
                    <span>{props.copy.payslipPensionLabel}</span>
                    <span className="tabular-nums">− €{whole(baseline.employeePensionCents)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between gap-4">
                    <span>{props.copy.payslipPensionLabel}</span>
                    <span>{props.copy.pensionNotIncluded}</span>
                  </div>
                )}
                {(baseline?.otherBankDeductionCents ?? 0) > 0 ? (
                  <div className="flex justify-between gap-4">
                    <span>{props.copy.payslipOtherDeductionsLabel}</span>
                    <span className="tabular-nums">
                      − €{whole(baseline?.otherBankDeductionCents ?? 0)}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between gap-4 font-medium text-stone-800">
                  <span>{props.copy.payslipBankNetLabel}</span>
                  <span className="tabular-nums">€{whole(bankNet ?? 0)}</span>
                </div>
              </div>
            ) : null}
            {props.onRequestPayslipAccuracy ? (
              <button
                type="button"
                className="text-sm font-medium text-emerald-800 underline-offset-2 hover:underline"
                onClick={props.onRequestPayslipAccuracy}
              >
                {props.copy.payslipAccuracyCta}
              </button>
            ) : null}
          </div>
        ) : null}
        {!(incomeIsNetEstimate && baseline?.estimatedGrossMonthlyCents != null) ? (
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
        ) : null}
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
        {showExtraPayAmount ? (
          <div data-verdiencheck-extra-pay="" className="space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm text-stone-700">
              <span>{props.copy.extraPayLabel}</span>
              <span className="tabular-nums">
                €{whole(extraPayCents)} {props.copy.extraPayPerYear}
              </span>
            </div>
            {extraPayHasDetail ? (
              <>
                <button
                  type="button"
                  className="text-sm font-medium text-emerald-800 underline-offset-2 hover:underline"
                  aria-expanded={extraPayOpen}
                  onClick={() => setExtraPayOpen((open) => !open)}
                >
                  {props.copy.viewExtraPayBreakdown}
                </button>
                {extraPayOpen ? (
                  <div
                    data-verdiencheck-extra-pay-details=""
                    className="space-y-1 rounded-xl bg-stone-50 p-3"
                  >
                    {(
                      [
                        [props.copy.thirteenthMonthLabel, baseline?.thirteenthMonthCents ?? 0],
                        [props.copy.bonusCommissionRowLabel, baseline?.bonusCommissionCents ?? 0],
                        [props.copy.overtimeOtherPayRowLabel, baseline?.overtimeOtherPayCents ?? 0],
                      ] as const
                    )
                      .filter(([, cents]) => cents > 0)
                      .map(([label, cents]) => (
                        <div
                          key={label}
                          className="flex justify-between gap-4 text-sm text-stone-700"
                        >
                          <span>{label}</span>
                          <span className="tabular-nums">€{whole(cents)}</span>
                        </div>
                      ))}
                    <p className="pt-1 text-sm leading-relaxed text-stone-600">
                      {props.copy.extraPaySpecialRateNote}
                    </p>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        ) : extraPayUnknown ? (
          <p data-verdiencheck-extra-pay-unknown="" className="text-sm text-stone-700">
            {props.copy.extraPayNotIncluded}
          </p>
        ) : null}
        {baseline?.payrollUsed || baseline?.payrollTaxCredit != null ? (
          <div
            data-verdiencheck-lhk=""
            className="flex justify-between gap-4 text-sm text-stone-700"
          >
            <span>{props.copy.payrollTaxCreditLabel}</span>
            <span>
              {baseline.payrollTaxCredit === 'NO'
                ? props.copy.payrollTaxCreditNo
                : baseline.payrollTaxCredit === 'YES'
                  ? props.copy.payrollTaxCreditYes
                  : baseline?.payrollTaxCreditAssumed
                    ? props.copy.payrollTaxCreditAssumedYes
                    : props.copy.payrollTaxCreditUnknown}
            </span>
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
        {incomeIsNetEstimate && baseline?.payrollUsed && !pensionKnown ? (
          <p data-verdiencheck-pension-unknown="" className="text-sm text-stone-700">
            {props.copy.pensionNotIncluded}
          </p>
        ) : null}
        {incomeIsNetEstimate && pensionStatus === 'AMOUNT' && baseline?.employeePensionCents != null ? (
          <div className="flex justify-between gap-4 text-sm text-stone-700">
            <span>{props.copy.payslipPensionLabel}</span>
            <span className="tabular-nums">− €{whole(baseline.employeePensionCents)}</span>
          </div>
        ) : null}
        {incomeIsNetEstimate ? (
          <p className="text-sm leading-relaxed text-stone-600">{props.copy.netToGrossPayslipNote}</p>
        ) : null}
      </div>

      {ownerActive ||
      baseline?.housingTenure === 'OWNER_OCCUPIED' ||
      baseline?.housingTenure === 'RENT' ||
      baseline?.housingTenure === 'OTHER' ? (
        <div data-verdiencheck-housing="" className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-wide text-stone-500">
            {props.copy.housingHeading}
          </p>
          <div className="flex justify-between gap-4 text-base text-stone-800">
            <span>
              {baseline?.housingTenure === 'RENT'
                ? props.copy.housingRentLabel
                : baseline?.housingTenure === 'OTHER'
                  ? props.copy.housingOtherLabel
                  : props.copy.housingOwnerLabel}
            </span>
            {ownerHome?.netOwnHomeBox1AdjustmentCents != null ? (
              <span className="text-right font-medium tabular-nums">
                {props.copy.housingNetEffectLabel}{' '}
                {ownerHome.netOwnHomeBox1AdjustmentCents < 0 ? '−' : '+'}€
                {whole(Math.abs(ownerHome.netOwnHomeBox1AdjustmentCents))}
              </span>
            ) : null}
          </div>
          {ownerHome?.status === 'PARTIAL' ? (
            <p className="text-sm leading-relaxed text-stone-600">{props.copy.housingPartialInterestNote}</p>
          ) : null}
          {ownerActive ? (
            <details className="rounded-xl border border-stone-100 bg-stone-50 px-3 py-2 text-sm text-stone-700">
              <summary className="min-h-11 cursor-pointer font-medium">
                {props.copy.housingViewCalculation}
              </summary>
              <div className="mt-2 space-y-1">
                {ownerHome.wozCents != null ? (
                  <div className="flex justify-between gap-3">
                    <span>{props.copy.housingWozLabel}</span>
                    <span className="tabular-nums">€{whole(ownerHome.wozCents)}</span>
                  </div>
                ) : null}
                {ownerHome.eigenwoningforfaitCents != null ? (
                  <div className="flex justify-between gap-3">
                    <span>{props.copy.housingEwfLabel}</span>
                    <span className="tabular-nums">+ €{whole(ownerHome.eigenwoningforfaitCents)}</span>
                  </div>
                ) : null}
                {ownerHome.interestKnown && ownerHome.deductibleInterestCents != null ? (
                  <div className="flex justify-between gap-3">
                    <span>{props.copy.housingInterestLabel}</span>
                    <span className="tabular-nums">− €{whole(ownerHome.deductibleInterestCents)}</span>
                  </div>
                ) : null}
                <p className="pt-1 leading-relaxed">{props.copy.housingOwnerIntro}</p>
                <p className="leading-relaxed">{props.copy.housingOwnerExplain}</p>
              </div>
            </details>
          ) : null}
          {ownerActive ? (
            <button
              type="button"
              className="min-h-11 text-left text-sm font-medium text-emerald-800 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
              aria-label={props.copy.housingHowCalculatedTitle}
              aria-haspopup="dialog"
              aria-expanded={housingInfoOpen}
              onClick={() => setHousingInfoOpen(true)}
            >
              {props.copy.housingHowCalculatedTitle}
            </button>
          ) : null}
          <VerdienCheckInfoDialog
            open={housingInfoOpen}
            title={props.copy.housingHowCalculatedTitle}
            body={props.copy.housingHowCalculatedBody}
            closeLabel="Sluiten"
            onClose={() => setHousingInfoOpen(false)}
          />
        </div>
      ) : null}

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
          {incomeIsNetEstimate || baseline?.payrollUsed ? (
            <p data-verdiencheck-how-gross="">
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
