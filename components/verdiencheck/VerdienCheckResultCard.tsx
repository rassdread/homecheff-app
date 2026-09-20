import type { CalculatorResult } from '@/lib/verdiencheck/calculator/types';
import { formatCentsAsEuroDisplay } from '@/lib/verdiencheck/domain/money';
import { isUnknown, type CentsOrUnknown } from '@/lib/verdiencheck/domain/unknown';
import type { VerdienCheckCopy } from '@/lib/verdiencheck/i18n/copy';

function formatSigned(cents: number): string {
  const abs = formatCentsAsEuroDisplay(Math.abs(cents));
  if (cents > 0) return `+ €${abs}`;
  if (cents < 0) return `- €${abs}`;
  return `€${abs}`;
}

function pocketFromCost(cents: number): string {
  return formatSigned(-cents);
}

function displayBlocked(copy: VerdienCheckCopy, result: CalculatorResult): string {
  if (result.status === 'PACK_NOT_CERTIFIED') return copy.packUnavailable;
  if (result.status === 'ASK_JURISDICTION') return copy.needMore;
  if (result.status === 'JURISDICTION_NOT_SUPPORTED') return copy.otherCountry;
  if (result.status === 'TAX_REGIME_NOT_YET_SUPPORTED') return copy.taxRegimeUnsupported;
  if (result.status === 'SOURCE_OF_INCOME_REVIEW_REQUIRED') return copy.sourceOfIncomeReview;
  if (result.status === 'INCOME_SOURCE_DISABLED') return copy.needMore;
  return copy.notCalculated;
}

function displayValue(
  copy: VerdienCheckCopy,
  result: CalculatorResult,
  value: CentsOrUnknown | undefined,
  mode: 'pocket-cost' | 'signed',
): string {
  if (result.status !== 'READY') return displayBlocked(copy, result);
  if (value == null || isUnknown(value)) return copy.notCalculated;
  return mode === 'pocket-cost' ? pocketFromCost(value) : formatSigned(value);
}

function showAllowanceRow(value: CentsOrUnknown | undefined): boolean {
  if (value == null) return false;
  if (typeof value === 'number' && value === 0) return false;
  return true;
}

export default function VerdienCheckResultCard(props: {
  copy: VerdienCheckCopy;
  result: CalculatorResult;
  scenarioLabel: string;
  allowanceKinkDetected?: boolean;
  midYearUnsupported?: boolean;
}) {
  const { copy, result } = props;
  const extra = `€${formatCentsAsEuroDisplay(result.commercialAdditionalResultCents)}`;
  const ready = result.status === 'READY' ? result : null;
  const provisional =
    result.status !== 'READY' ||
    !result.netExtraIsDefinitive ||
    result.completeness !== 'COMPLETE_FOR_CORE';
  const unimplementedAllowances =
    ready?.completeness === 'PARTIAL_UNIMPLEMENTED_ALLOWANCES';
  const incompleteCredits =
    ready != null && ready.unsupportedTaxCredits.length > 0;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">
        {copy.whatIf} {props.scenarioLabel}
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        {provisional ? copy.provisionalTitle : copy.steps.result.title}
      </p>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt>{copy.extraResult}</dt>
          <dd className="font-medium">+ {extra}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>{copy.taxChanges}</dt>
          <dd className="text-right text-gray-600">
            {displayValue(copy, result, ready?.deltas.incomeTax, 'pocket-cost')}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>{copy.zvwChanges}</dt>
          <dd className="text-right text-gray-600">
            {displayValue(copy, result, ready?.deltas.zvw, 'pocket-cost')}
          </dd>
        </div>
        {showAllowanceRow(ready?.deltas.healthcareAllowance) && (
          <div className="flex justify-between gap-4">
            <dt>{copy.healthcareChanges}</dt>
            <dd className="text-right text-gray-600">
              {displayValue(copy, result, ready?.deltas.healthcareAllowance, 'signed')}
            </dd>
          </div>
        )}
        {showAllowanceRow(ready?.deltas.rentAllowance) && (
          <div className="flex justify-between gap-4">
            <dt>{copy.rentChanges}</dt>
            <dd className="text-right text-gray-600">
              {displayValue(copy, result, ready?.deltas.rentAllowance, 'signed')}
            </dd>
          </div>
        )}
        {showAllowanceRow(ready?.deltas.childBudget) && (
          <div className="flex justify-between gap-4">
            <dt>{copy.childBudgetChanges}</dt>
            <dd className="text-right text-gray-600">
              {displayValue(copy, result, ready?.deltas.childBudget, 'signed')}
            </dd>
          </div>
        )}
        {showAllowanceRow(ready?.deltas.childcareAllowance) && (
          <div className="flex justify-between gap-4">
            <dt>{copy.childcareChanges}</dt>
            <dd className="text-right text-gray-600">
              {displayValue(copy, result, ready?.deltas.childcareAllowance, 'signed')}
            </dd>
          </div>
        )}
        {ready?.netExtraIsDefinitive && !isUnknown(ready.netExtraCents) ? (
          <div className="flex justify-between gap-4 border-t border-gray-100 pt-2 font-semibold">
            <dt>{copy.netKeep}</dt>
            <dd>{formatSigned(ready.netExtraCents)}</dd>
          </div>
        ) : (
          <div className="border-t border-gray-100 pt-2 text-sm text-gray-600">
            <p>{copy.notFullCalculation}</p>
            {unimplementedAllowances && <p>{copy.otherAllowancesExcluded}</p>}
            {incompleteCredits && <p>{copy.incompleteCredits}</p>}
            {ready && !isUnknown(ready.netExtraCents) && (
              <p className="mt-1 text-gray-500">
                {copy.provisionalTitle}: {formatSigned(ready.netExtraCents)}
              </p>
            )}
            {(!ready || isUnknown(ready.netExtraCents)) && (
              <p className="mt-1">{displayBlocked(copy, result)}</p>
            )}
          </div>
        )}
      </dl>
      {props.midYearUnsupported && (
        <p className="mt-3 text-sm text-gray-600">{copy.midYearNote}</p>
      )}
      {props.allowanceKinkDetected && (
        <p className="mt-3 text-sm text-gray-600">{copy.allowanceKink}</p>
      )}
      {ready && ready.assumptions.length > 0 && (
        <div className="mt-4 space-y-1 text-xs text-gray-500">
          {ready.assumptions.includes(
            'ADDITIONAL_INCOME_CLASSIFICATION=RESULT_FROM_OTHER_WORK',
          ) && <p>{copy.rowAssumptionNote}</p>}
          {ready.assumptions.includes('assumeEstimatedCostsTaxDeductible=true') && (
            <p>{copy.costAssumptionNote}</p>
          )}
        </div>
      )}
    </section>
  );
}
