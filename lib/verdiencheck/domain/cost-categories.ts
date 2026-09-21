/**
 * Optional cost-input categories. These are UX buckets, not deductibility promises.
 * Fiscal amounts still come from user-entered deductible figures, never from spend.
 * Does not run tax. Does not classify assets automatically.
 */

import { centsToPlainEuroInput, parseEuroInputToCents, type Cents } from './money';

export const COST_INPUT_CATEGORY_IDS = [
  'MATERIALS',
  'PACKAGING',
  'PLATFORM',
  'DELIVERY',
  'EQUIPMENT',
  'MARKETING',
  'OTHER',
] as const;

export type CostInputCategoryId = (typeof COST_INPUT_CATEGORY_IDS)[number];

export const COST_LINE_KINDS = ['ORDINARY', 'INVESTMENT'] as const;
export type CostLineKind = (typeof COST_LINE_KINDS)[number];

export type CostLineInput = {
  id: CostInputCategoryId;
  spendEuro: string;
  deductibleEuro: string;
  kind: CostLineKind | null;
};

export type CostBreakdownMapped =
  | { status: 'EMPTY'; deductibleEuro: ''; spendCents: null; deductibleCents: null }
  | { status: 'INCOMPLETE'; deductibleEuro: ''; spendCents: Cents | null; deductibleCents: null }
  | {
      status: 'INVESTMENT_UNKNOWN';
      deductibleEuro: '';
      spendCents: Cents | null;
      deductibleCents: null;
    }
  | { status: 'OK'; deductibleEuro: string; spendCents: Cents; deductibleCents: Cents };

export function emptyCostLines(): CostLineInput[] {
  return COST_INPUT_CATEGORY_IDS.map((id) => ({
    id,
    spendEuro: '',
    deductibleEuro: '',
    kind: null,
  }));
}

export function categoryMayBeDurableAsset(id: CostInputCategoryId): boolean {
  return id === 'EQUIPMENT' || id === 'OTHER';
}

/**
 * Spend is never treated as the fiscal deduction.
 * Investment purchase price is never subtracted in full unless the user
 * supplies a year-specific deductible amount.
 */
export function mapCostBreakdown(lines: readonly CostLineInput[]): CostBreakdownMapped {
  let spendTotal = 0;
  let deductibleTotal = 0;
  let sawLine = false;

  for (const line of lines) {
    const spendRaw = line.spendEuro.trim();
    const deductibleRaw = line.deductibleEuro.trim();
    if (spendRaw === '' && deductibleRaw === '') continue;

    const spend = spendRaw === '' ? 0 : parseEuroInputToCents(line.spendEuro);
    const deductible =
      deductibleRaw === '' ? null : parseEuroInputToCents(line.deductibleEuro);
    if (spend == null || (deductibleRaw !== '' && deductible == null)) {
      return {
        status: 'INCOMPLETE',
        deductibleEuro: '',
        spendCents: null,
        deductibleCents: null,
      };
    }

    const needsKind = categoryMayBeDurableAsset(line.id) && spend > 0;
    if (needsKind && line.kind == null) {
      return {
        status: 'INCOMPLETE',
        deductibleEuro: '',
        spendCents: spendTotal + spend,
        deductibleCents: null,
      };
    }
    if (line.kind === 'INVESTMENT' && deductible == null) {
      return {
        status: 'INVESTMENT_UNKNOWN',
        deductibleEuro: '',
        spendCents: spendTotal + spend,
        deductibleCents: null,
      };
    }
    if (deductible == null) {
      return {
        status: 'INCOMPLETE',
        deductibleEuro: '',
        spendCents: spendTotal + spend,
        deductibleCents: null,
      };
    }

    sawLine = true;
    spendTotal += spend;
    deductibleTotal += deductible;
  }

  if (!sawLine) {
    return { status: 'EMPTY', deductibleEuro: '', spendCents: null, deductibleCents: null };
  }
  return {
    status: 'OK',
    deductibleEuro: centsToPlainEuroInput(deductibleTotal),
    spendCents: spendTotal,
    deductibleCents: deductibleTotal,
  };
}
