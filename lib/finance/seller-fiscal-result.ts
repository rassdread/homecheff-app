/**
 * PHASE 8C — partial fiscal result (pure core).
 *
 * Joins two independent sources that must never be blended:
 *
 *   deriveSellerFinancialYear   what HomeCheff knows happened   PLATFORM_TRANSACTION
 *   deriveSellerExpenseYear     what the seller told us          SELLER_ADMINISTERED
 *
 * The result is deliberately called PARTIAL. HomeCheff sees its own sales and
 * its own commission, and nothing else: no external revenue, no bank account,
 * no receipts, and only the costs a seller happened to type in. Calling that
 * "belastbare winst" would be wrong in a way that costs the seller money, so
 * the copy says "resultaat tot nu toe" and the completeness state says why.
 *
 * Pure by design: no Prisma, no clock, no env, no I/O.
 */
import type { SellerFinancialYear } from './seller-financial-year';
import type { SellerExpenseYear } from './seller-expense';
import { OFFICIAL_SOURCES } from './seller-expense';

export const SELLER_FISCAL_RESULT_SCHEMA_VERSION = '8c.1';

/**
 * The HomeCheff commission is a business cost, and it is already subtracted
 * inside sellerNetProceedsCents. So the result starts from net proceeds and
 * only user-entered costs come off it.
 *
 * That is the double-count protection, and it is structural rather than a
 * check: there is no code path that adds the platform fee a second time,
 * because the platform fee is never a term in this subtraction.
 */
export const PLATFORM_FEE_TREATMENT = {
  provenance: 'PLATFORM_DERIVED',
  ruleKey: 'NL_2026_ZAKELIJKE_KOSTEN_VOLLEDIG_AFTREKBAAR',
  sourceKey: 'ZAKELIJKE_KOSTEN' as keyof typeof OFFICIAL_SOURCES,
  alreadyDeductedInNetProceeds: true,
  sellerMustNotReEnter: true,
} as const;

export type SellerFiscalResultCompleteness =
  | 'PARTIAL_COSTS_RESOLVED'
  | 'PARTIAL_COSTS_UNRESOLVED'
  | 'PARTIAL_SALES_INCONSISTENT';

export type SellerFiscalResultNoticeCode =
  | 'COSTS_NEED_CLASSIFICATION'
  | 'INVESTMENT_NEEDS_DEPRECIATION'
  | 'SALES_DATA_INCONSISTENT'
  | 'UNSUPPORTED_EXPENSE_CURRENCY'
  | 'PLATFORM_COSTS_MAY_BE_DUPLICATED'
  | 'EXTERNAL_REVENUE_NOT_INCLUDED';

export type SellerFiscalResultNotice = {
  code: SellerFiscalResultNoticeCode;
  amountCents: number | null;
};

export type SellerFiscalResult = {
  schemaVersion: typeof SELLER_FISCAL_RESULT_SCHEMA_VERSION;
  sellerUserId: string;
  year: number;
  currency: 'EUR';

  /** Platform side — from the canonical financial year, unchanged. */
  grossSalesCents: number;
  refundCents: number;
  netSalesCents: number;
  platformFeeCents: number;
  sellerNetProceedsCents: number;

  /** Seller side — only what a verified rule resolved. */
  sellerDeductibleCostCents: number;

  /** sellerNetProceedsCents - sellerDeductibleCostCents. Never clamped. */
  partialResultCents: number;

  /** Excluded from the subtraction, reported so it is visible rather than lost. */
  unresolvedCostCents: number;
  investmentCostCents: number;

  completeness: SellerFiscalResultCompleteness;
  notices: SellerFiscalResultNotice[];
  /** Both inputs named, so no consumer can mistake this for one source. */
  sources: {
    sales: 'PLATFORM_TRANSACTION';
    costs: 'SELLER_ADMINISTERED';
    platformFee: typeof PLATFORM_FEE_TREATMENT;
  };
};

export function buildSellerFiscalResult(input: {
  financial: SellerFinancialYear;
  expenses: SellerExpenseYear;
  /** Spend the seller filed under PLATFORM, which may duplicate our own fee. */
  platformCategorySpendCents?: number;
}): SellerFiscalResult {
  const { financial, expenses } = input;
  const notices: SellerFiscalResultNotice[] = [];

  const sellerDeductibleCostCents = expenses.confirmedDeductibleCostCents;
  const partialResultCents = financial.sellerNetProceedsCents - sellerDeductibleCostCents;

  if (financial.completeness === 'DATA_INCONSISTENCY') {
    notices.push({ code: 'SALES_DATA_INCONSISTENT', amountCents: null });
  }
  if (expenses.completeness === 'UNSUPPORTED_CURRENCY') {
    notices.push({ code: 'UNSUPPORTED_EXPENSE_CURRENCY', amountCents: null });
  }

  // Unknown costs are surfaced, never subtracted. The seller is told the exact
  // amount that is sitting outside the result so the gap is not a mystery.
  const nonInvestmentUnresolved =
    expenses.unknownOrReviewAmountCents - expenses.investmentAmountCents;
  if (nonInvestmentUnresolved > 0) {
    notices.push({ code: 'COSTS_NEED_CLASSIFICATION', amountCents: nonInvestmentUnresolved });
  }
  if (expenses.investmentAmountCents > 0) {
    notices.push({
      code: 'INVESTMENT_NEEDS_DEPRECIATION',
      amountCents: expenses.investmentAmountCents,
    });
  }
  if ((input.platformCategorySpendCents ?? 0) > 0) {
    notices.push({
      code: 'PLATFORM_COSTS_MAY_BE_DUPLICATED',
      amountCents: input.platformCategorySpendCents ?? 0,
    });
  }

  // Always present: HomeCheff cannot see a seller's other income, so this
  // result is incomplete by construction even when every cost is classified.
  notices.push({ code: 'EXTERNAL_REVENUE_NOT_INCLUDED', amountCents: null });

  const completeness: SellerFiscalResultCompleteness =
    financial.completeness === 'DATA_INCONSISTENCY'
      ? 'PARTIAL_SALES_INCONSISTENT'
      : expenses.unresolvedCount > 0
        ? 'PARTIAL_COSTS_UNRESOLVED'
        : 'PARTIAL_COSTS_RESOLVED';

  return {
    schemaVersion: SELLER_FISCAL_RESULT_SCHEMA_VERSION,
    sellerUserId: financial.sellerUserId,
    year: financial.year,
    currency: 'EUR',
    grossSalesCents: financial.sellerGrossSalesCents,
    refundCents: financial.refundCents,
    netSalesCents: financial.netSalesCents,
    platformFeeCents: financial.netPlatformFeesCents,
    sellerNetProceedsCents: financial.sellerNetProceedsCents,
    sellerDeductibleCostCents,
    partialResultCents,
    unresolvedCostCents: expenses.unknownOrReviewAmountCents,
    investmentCostCents: expenses.investmentAmountCents,
    completeness,
    notices,
    sources: {
      sales: 'PLATFORM_TRANSACTION',
      costs: 'SELLER_ADMINISTERED',
      platformFee: PLATFORM_FEE_TREATMENT,
    },
  };
}
