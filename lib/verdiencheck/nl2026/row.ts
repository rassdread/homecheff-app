import { UNKNOWN, isUnknown, type CentsOrUnknown } from '../domain/unknown';
import type { Cents } from '../domain/money';

export const ADDITIONAL_INCOME_CLASSIFICATION = {
  RESULT_FROM_OTHER_WORK: 'RESULT_FROM_OTHER_WORK',
} as const;

export type AdditionalIncomeClassification =
  (typeof ADDITIONAL_INCOME_CLASSIFICATION)[keyof typeof ADDITIONAL_INCOME_CLASSIFICATION];

export type RowResolution =
  | {
      status: 'OK';
      taxableROWResultCents: Cents;
      assumptions: readonly string[];
    }
  | { status: 'UNKNOWN'; taxableROWResultCents: typeof UNKNOWN; assumptions: readonly string[] }
  | {
      status: 'SOURCE_OF_INCOME_REVIEW_REQUIRED';
      taxableROWResultCents: typeof UNKNOWN;
      assumptions: readonly string[];
    };

/**
 * commercialResult is never silently taxable.
 * Costs are deductible only with explicit assumption.
 */
export function resolveTaxableRowResult(input: {
  classification: AdditionalIncomeClassification | null | undefined;
  commercialResultCents: Cents;
  assumeEstimatedCostsTaxDeductible: boolean | null | undefined;
}): RowResolution {
  const assumptions: string[] = [];
  if (input.classification !== 'RESULT_FROM_OTHER_WORK') {
    return {
      status: 'UNKNOWN',
      taxableROWResultCents: UNKNOWN,
      assumptions,
    };
  }
  assumptions.push('ADDITIONAL_INCOME_CLASSIFICATION=RESULT_FROM_OTHER_WORK');

  if (input.commercialResultCents <= 0) {
    return {
      status: 'SOURCE_OF_INCOME_REVIEW_REQUIRED',
      taxableROWResultCents: UNKNOWN,
      assumptions,
    };
  }

  if (input.assumeEstimatedCostsTaxDeductible !== true) {
    return {
      status: 'UNKNOWN',
      taxableROWResultCents: UNKNOWN,
      assumptions,
    };
  }

  assumptions.push('assumeEstimatedCostsTaxDeductible=true');
  return {
    status: 'OK',
    taxableROWResultCents: input.commercialResultCents,
    assumptions,
  };
}

export function isCents(value: CentsOrUnknown): value is Cents {
  return typeof value === 'number' && Number.isInteger(value) && !isUnknown(value);
}
