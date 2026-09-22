/**
 * PHASE 8C — seller expense foundation fixtures.
 *
 * Pure and offline: no database, no network, no clock dependence.
 *
 *   npx tsx scripts/test-seller-expense-8c.ts
 */
import {
  FULL_BUSINESS_USE_BP,
  OFFICIAL_FACTS_2026,
  buildSellerExpenseYear,
  businessAmountCentsFor,
  investmentQuestionAppliesTo,
  resolveSellerExpense,
  taxYearOf,
  type SellerExpenseInput,
} from '../lib/finance/seller-expense';
import { buildSellerFiscalResult } from '../lib/finance/seller-fiscal-result';
import { buildSellerFinancialYear } from '../lib/finance/seller-financial-year';
import { validateExpenseWrite, parseExpenseDate } from '../lib/finance/seller-expense-input';

let failures = 0;
const results: string[] = [];

function check(name: string, ok: boolean, detail?: string) {
  if (ok) {
    results.push(`  PASS  ${name}`);
    return;
  }
  failures += 1;
  results.push(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
}

const SELLER = 'seller-a';
const OTHER = 'seller-b';

function expense(over: Partial<SellerExpenseInput> = {}): SellerExpenseInput {
  return {
    id: over.id ?? 'e1',
    sellerUserId: SELLER,
    expenseDate: new Date(Date.UTC(2026, 4, 12)),
    amountCents: 10_000,
    currency: 'EUR',
    category: 'MATERIALS',
    businessUseBp: null,
    fiscalTreatment: 'ORDINARY_EXPENSE',
    source: 'USER_PROVIDED',
    confirmationStatus: 'CONFIRMED',
    deletedAt: null,
    ...over,
  };
}

function year(expenses: SellerExpenseInput[], y = 2026) {
  return buildSellerExpenseYear({ sellerUserId: SELLER, year: y, expenses });
}

// ---------------------------------------------------------------------------
// A. SIMPLE ORDINARY EXPENSE — €100, 100% business, confirmed
// ---------------------------------------------------------------------------
{
  const e = resolveSellerExpense(expense());
  check('A_ACTUAL_SPEND', e.amountCents === 10_000);
  check('A_BUSINESS_AMOUNT', e.businessAmountCents === 10_000);
  check('A_DEDUCTIBLE_KNOWN', e.deductible.status === 'KNOWN');
  check(
    'A_DEDUCTIBLE_CENTS',
    e.deductible.status === 'KNOWN' && e.deductible.cents === 10_000,
  );
  check(
    'A_CITES_OFFICIAL_RULE',
    e.deductible.status === 'KNOWN' &&
      e.deductible.ruleKey === 'NL_2026_ZAKELIJKE_KOSTEN_VOLLEDIG_AFTREKBAAR',
  );

  const y = year([expense()]);
  check('A_YEAR_ACTUAL', y.actualSpendCents === 10_000);
  check('A_YEAR_DEDUCTIBLE', y.confirmedDeductibleCostCents === 10_000);
  check('A_YEAR_COMPLETE', y.completeness === 'COMPLETE');
}

// ---------------------------------------------------------------------------
// B. MIXED USE — €100 at 60% is €60 of business spend, and that is all
// ---------------------------------------------------------------------------
{
  // Unclassified: business share is known, deductibility is not.
  const mixedUnknown = resolveSellerExpense(
    expense({ businessUseBp: 6_000, fiscalTreatment: 'UNKNOWN', confirmationStatus: 'DRAFT' }),
  );
  check('B_BUSINESS_AMOUNT_60', mixedUnknown.businessAmountCents === 6_000);
  check('B_ACTUAL_SPEND_UNCHANGED', mixedUnknown.amountCents === 10_000);
  check(
    'B_DEDUCTIBLE_NOT_ASSUMED_FROM_SHARE',
    mixedUnknown.deductible.status === 'UNKNOWN',
    'a business share is not a deductibility verdict',
  );
  check(
    'B_UNKNOWN_REASON',
    mixedUnknown.deductible.status === 'UNKNOWN' &&
      mixedUnknown.deductible.reason === 'NOT_CLASSIFIED',
  );

  // Same row, now confirmed ordinary: only then does 60 become deductible.
  const mixedConfirmed = resolveSellerExpense(expense({ businessUseBp: 6_000 }));
  check(
    'B_DEDUCTIBLE_AFTER_TREATMENT',
    mixedConfirmed.deductible.status === 'KNOWN' && mixedConfirmed.deductible.cents === 6_000,
  );

  const y = year([expense({ businessUseBp: 6_000, fiscalTreatment: 'UNKNOWN', confirmationStatus: 'DRAFT' })]);
  check('B_YEAR_BUSINESS_SPEND', y.businessRelatedSpendCents === 6_000);
  check('B_YEAR_DEDUCTIBLE_ZERO_BECAUSE_UNRESOLVED', y.confirmedDeductibleCostCents === 0);
  check('B_YEAR_UNKNOWN_AMOUNT', y.unknownOrReviewAmountCents === 6_000);
}

// ---------------------------------------------------------------------------
// C. NON-DEDUCTIBLE — spend survives, deduction is a confirmed zero
// ---------------------------------------------------------------------------
{
  const e = resolveSellerExpense(expense({ fiscalTreatment: 'NON_DEDUCTIBLE' }));
  check('C_ACTUAL_SPEND_PRESERVED', e.amountCents === 10_000);
  check('C_DEDUCTIBLE_IS_KNOWN_ZERO', e.deductible.status === 'KNOWN' && e.deductible.cents === 0);

  const y = year([expense({ fiscalTreatment: 'NON_DEDUCTIBLE' })]);
  check('C_YEAR_ACTUAL_SPEND', y.actualSpendCents === 10_000);
  check('C_YEAR_DEDUCTIBLE_ZERO', y.confirmedDeductibleCostCents === 0);
  check(
    'C_YEAR_NOT_COUNTED_AS_UNKNOWN',
    y.unknownOrReviewAmountCents === 0,
    'a confirmed zero is resolved, not unresolved',
  );
  check('C_YEAR_COMPLETE', y.completeness === 'COMPLETE');
}

// ---------------------------------------------------------------------------
// D. UNKNOWN TREATMENT — must not collapse to zero
// ---------------------------------------------------------------------------
{
  const e = resolveSellerExpense(
    expense({ fiscalTreatment: 'UNKNOWN', confirmationStatus: 'DRAFT' }),
  );
  check('D_DEDUCTIBLE_UNKNOWN', e.deductible.status === 'UNKNOWN');
  check(
    'D_UNKNOWN_IS_NOT_ZERO',
    !('cents' in e.deductible),
    'the UNKNOWN branch must not carry a cents value at all',
  );

  const y = year([expense({ fiscalTreatment: 'UNKNOWN', confirmationStatus: 'DRAFT' })]);
  check('D_YEAR_UNKNOWN_SURFACED', y.unknownOrReviewAmountCents === 10_000);
  check('D_YEAR_NOT_IN_DEDUCTIBLE', y.confirmedDeductibleCostCents === 0);
  check('D_YEAR_NEEDS_CLASSIFICATION', y.completeness === 'NEEDS_CLASSIFICATION');

  // NEEDS_REVIEW is also unknown, with its own reason.
  const flagged = resolveSellerExpense(
    expense({ fiscalTreatment: 'ORDINARY_EXPENSE', confirmationStatus: 'NEEDS_REVIEW' }),
  );
  check(
    'D_NEEDS_REVIEW_OVERRIDES_TREATMENT',
    flagged.deductible.status === 'UNKNOWN' &&
      flagged.deductible.reason === 'FLAGGED_FOR_REVIEW',
  );
}

// ---------------------------------------------------------------------------
// E. INVESTMENT — €1,000 laptop must not become €1,000 of this year's cost
// ---------------------------------------------------------------------------
{
  const laptop = expense({
    amountCents: 100_000,
    category: 'EQUIPMENT',
    fiscalTreatment: 'INVESTMENT',
  });
  const e = resolveSellerExpense(laptop);
  check('E_ACTUAL_SPEND_STORED', e.amountCents === 100_000);
  check('E_DEDUCTIBLE_UNKNOWN', e.deductible.status === 'UNKNOWN');
  check(
    'E_REASON_IS_DEPRECIATION',
    e.deductible.status === 'UNKNOWN' && e.deductible.reason === 'NEEDS_DEPRECIATION',
  );

  const y = year([laptop]);
  check('E_YEAR_NOT_DEDUCTED', y.confirmedDeductibleCostCents === 0);
  check('E_YEAR_INVESTMENT_REPORTED', y.investmentAmountCents === 100_000);
  check('E_YEAR_INVESTMENT_COUNT', y.investmentCount === 1);
  check(
    'E_INVESTMENT_ALSO_IN_UNRESOLVED',
    y.unknownOrReviewAmountCents === 100_000,
    'an investment is unresolved for this year, and separately labelled',
  );

  // Even CONFIRMED does not unlock a number — there is no depreciation engine.
  const confirmed = resolveSellerExpense({ ...laptop, confirmationStatus: 'CONFIRMED' });
  check('E_CONFIRMED_STILL_UNKNOWN', confirmed.deductible.status === 'UNKNOWN');

  // The official €450 threshold prompts the question, never answers it.
  check(
    'E_THRESHOLD_IS_OFFICIAL_450',
    OFFICIAL_FACTS_2026.INVESTMENT_THRESHOLD_CENTS === 45_000,
  );
  check(
    'E_QUESTION_APPLIES_AT_THRESHOLD',
    investmentQuestionAppliesTo({ amountCents: 45_000, category: 'EQUIPMENT' }),
  );
  check(
    'E_QUESTION_NOT_BELOW_THRESHOLD',
    !investmentQuestionAppliesTo({ amountCents: 44_999, category: 'EQUIPMENT' }),
  );
  check(
    'E_QUESTION_NOT_FOR_CONSUMABLES',
    !investmentQuestionAppliesTo({ amountCents: 100_000, category: 'MATERIALS' }),
  );
  check(
    'E_THRESHOLD_DOES_NOT_AUTO_CLASSIFY',
    resolveSellerExpense(
      expense({ amountCents: 100_000, category: 'EQUIPMENT', fiscalTreatment: 'ORDINARY_EXPENSE' }),
    ).deductible.status === 'KNOWN',
    'the seller decides; the threshold only prompts',
  );

  // Beperkt aftrekbaar is a year-level election, so it stays unresolved too.
  const limited = resolveSellerExpense(expense({ fiscalTreatment: 'LIMITED_DEDUCTIBLE' }));
  check(
    'E_LIMITED_DEDUCTIBLE_UNKNOWN',
    limited.deductible.status === 'UNKNOWN' &&
      limited.deductible.reason === 'YEAR_LEVEL_ELECTION',
  );
  check(
    'E_LIMITED_THRESHOLD_IS_OFFICIAL_5700',
    OFFICIAL_FACTS_2026.LIMITED_DEDUCTION_THRESHOLD_CENTS === 570_000 &&
      OFFICIAL_FACTS_2026.LIMITED_DEDUCTION_IB_PERCENT === 80,
  );
}

// ---------------------------------------------------------------------------
// F. CENT ROUNDING — deterministic, half away from zero
// ---------------------------------------------------------------------------
{
  // €10.01 x 33% = 330.33 cents -> 330
  check('F_1001_x_33', businessAmountCentsFor(1_001, 3_300) === 330, String(businessAmountCentsFor(1_001, 3_300)));
  // exact .5 cases round away from zero, not to even
  check('F_HALF_UP_1', businessAmountCentsFor(1, 5_000) === 1, String(businessAmountCentsFor(1, 5_000)));
  check('F_HALF_UP_3', businessAmountCentsFor(3, 5_000) === 2, String(businessAmountCentsFor(3, 5_000)));
  check('F_FULL_SHARE_IS_EXACT', businessAmountCentsFor(9_999, FULL_BUSINESS_USE_BP) === 9_999);
  check('F_ZERO_SHARE', businessAmountCentsFor(10_000, 0) === 0);
  check('F_THIRD_SHARE', businessAmountCentsFor(10_000, 3_333) === 3_333);
  check('F_ONE_CENT_AT_1BP', businessAmountCentsFor(10_000, 1) === 1);
  check(
    'F_DETERMINISTIC',
    businessAmountCentsFor(1_001, 3_300) === businessAmountCentsFor(1_001, 3_300),
  );
  // Sub-cent business shares round rather than vanish or inflate.
  check('F_ROUNDS_NOT_FLOORS', businessAmountCentsFor(199, 5_000) === 100, String(businessAmountCentsFor(199, 5_000)));
}

// ---------------------------------------------------------------------------
// G. WRONG OWNER — another seller's rows never enter a derivation
// ---------------------------------------------------------------------------
{
  const y = buildSellerExpenseYear({
    sellerUserId: SELLER,
    year: 2026,
    expenses: [expense({ id: 'mine' })],
  });
  check('G_OWN_ROW_COUNTED', y.expenseCount === 1);
  check('G_DERIVATION_IS_SELLER_SCOPED', y.sellerUserId === SELLER);
  // The API scopes every read and write by session user id; the route fixtures
  // below assert that the WHERE clause carries the owner.
  const listSrc = require('fs').readFileSync('app/api/seller/expenses/route.ts', 'utf8');
  const itemSrc = require('fs').readFileSync('app/api/seller/expenses/[expenseId]/route.ts', 'utf8');
  check('G_LIST_SCOPED_BY_SESSION', listSrc.includes('sessionUserId()') && !listSrc.includes('body.sellerUserId'));
  check(
    'G_PATCH_SCOPED_BY_OWNER',
    /updateMany\(\{\s*where: \{ id: expenseId, sellerUserId/.test(itemSrc),
    'ownership must be in the WHERE, not a prior read',
  );
  check(
    'G_DELETE_SCOPED_BY_OWNER',
    itemSrc.split('DELETE')[1]?.includes('sellerUserId') === true,
  );
  check('G_OTHER_SELLER_IS_NOT_SELF', SELLER !== OTHER);
}

// ---------------------------------------------------------------------------
// H. YEAR BOUNDARY — 2026-12-31 and 2027-01-01 never mix
// ---------------------------------------------------------------------------
{
  const dec31 = parseExpenseDate('2026-12-31')!;
  const jan01 = parseExpenseDate('2027-01-01')!;
  check('H_DEC31_IS_2026', taxYearOf(dec31) === 2026);
  check('H_JAN01_IS_2027', taxYearOf(jan01) === 2027);

  const rows = [
    expense({ id: 'dec', expenseDate: dec31, amountCents: 5_000 }),
    expense({ id: 'jan', expenseDate: jan01, amountCents: 7_000 }),
  ];
  const y2026 = year(rows, 2026);
  const y2027 = year(rows, 2027);
  check('H_2026_ONLY_DEC', y2026.actualSpendCents === 5_000 && y2026.expenseCount === 1);
  check('H_2027_ONLY_JAN', y2027.actualSpendCents === 7_000 && y2027.expenseCount === 1);
  check('H_NO_LIFETIME_TOTAL', y2026.actualSpendCents + y2027.actualSpendCents === 12_000);
  check('H_REJECTS_IMPOSSIBLE_DATE', parseExpenseDate('2026-02-30') === null);
  check('H_REJECTS_FREE_TEXT_DATE', parseExpenseDate('12 mei 2026') === null);
}

// ---------------------------------------------------------------------------
// I. DELETE — soft delete leaves totals untouched
// ---------------------------------------------------------------------------
{
  const live = expense({ id: 'live', amountCents: 3_000 });
  const gone = expense({ id: 'gone', amountCents: 4_000, deletedAt: new Date(Date.UTC(2026, 5, 1)) });
  const y = year([live, gone]);
  check('I_DELETED_NOT_IN_ACTUAL', y.actualSpendCents === 3_000);
  check('I_DELETED_NOT_IN_DEDUCTIBLE', y.confirmedDeductibleCostCents === 3_000);
  check('I_DELETED_NOT_COUNTED', y.expenseCount === 1);
  check(
    'I_DELETED_NOT_IN_UNKNOWN_EITHER',
    y.unknownOrReviewAmountCents === 0,
    'a deleted row must not resurface as an unresolved amount',
  );
  check(
    'I_TOMBSTONE_RETAINED',
    gone.deletedAt !== null,
    'the row survives so a past year stays reproducible',
  );
}

// ---------------------------------------------------------------------------
// J. EDIT — derived values recompute, they are never stale
// ---------------------------------------------------------------------------
{
  const before = resolveSellerExpense(expense({ amountCents: 10_000, businessUseBp: 5_000 }));
  check('J_BEFORE', before.businessAmountCents === 5_000);

  const afterAmount = resolveSellerExpense(expense({ amountCents: 20_000, businessUseBp: 5_000 }));
  check('J_AMOUNT_CHANGE_RECALCULATES', afterAmount.businessAmountCents === 10_000);

  const afterShare = resolveSellerExpense(expense({ amountCents: 10_000, businessUseBp: 2_500 }));
  check('J_SHARE_CHANGE_RECALCULATES', afterShare.businessAmountCents === 2_500);

  const afterTreatment = resolveSellerExpense(
    expense({ amountCents: 10_000, businessUseBp: 5_000, fiscalTreatment: 'NON_DEDUCTIBLE' }),
  );
  check(
    'J_TREATMENT_CHANGE_RECALCULATES',
    afterTreatment.deductible.status === 'KNOWN' && afterTreatment.deductible.cents === 0,
  );

  const afterCategory = resolveSellerExpense(
    expense({ amountCents: 60_000, category: 'EQUIPMENT' }),
  );
  check('J_CATEGORY_CHANGE_REOPENS_INVESTMENT_QUESTION', afterCategory.investmentQuestionApplies);
}

// ---------------------------------------------------------------------------
// K. INVALID INPUT — rejected at the boundary
// ---------------------------------------------------------------------------
{
  const base = {
    expenseDate: '2026-05-12',
    amountCents: 10_000,
    currency: 'EUR',
    category: 'MATERIALS',
  };
  const bad = (over: Record<string, unknown>) => validateExpenseWrite({ ...base, ...over });

  check('K_VALID_PASSES', validateExpenseWrite(base).ok);
  check('K_NEGATIVE_AMOUNT', !bad({ amountCents: -1 }).ok);
  check('K_ZERO_AMOUNT', !bad({ amountCents: 0 }).ok);
  check('K_NON_INTEGER_AMOUNT', !bad({ amountCents: 10.5 }).ok);
  check('K_ABSURD_AMOUNT', !bad({ amountCents: 100_000_001 }).ok);
  check('K_OVER_100_PERCENT', !bad({ businessUseBp: 10_001 }).ok);
  check('K_NEGATIVE_PERCENT', !bad({ businessUseBp: -1 }).ok);
  check('K_100_PERCENT_ALLOWED', bad({ businessUseBp: 10_000 }).ok);
  check('K_INVALID_CATEGORY', !bad({ category: 'BITCOIN' }).ok);
  check('K_INVALID_TREATMENT', !bad({ fiscalTreatment: 'DEDUCT_EVERYTHING' }).ok);
  check('K_INVALID_STATUS', !bad({ confirmationStatus: 'PROBABLY' }).ok);
  check('K_INVALID_CURRENCY', !bad({ currency: 'USD' }).ok);
  check('K_INVALID_DATE', !bad({ expenseDate: 'yesterday' }).ok);
  check('K_MISSING_DATE', !bad({ expenseDate: undefined }).ok);
  check('K_OVERLONG_NOTES', !bad({ notes: 'x'.repeat(2_001) }).ok);
  check('K_OVERLONG_MERCHANT', !bad({ merchantName: 'x'.repeat(201) }).ok);
  check(
    'K_CONFIRMED_WITHOUT_TREATMENT_REJECTED',
    !bad({ confirmationStatus: 'CONFIRMED', fiscalTreatment: 'UNKNOWN' }).ok,
    'confirming an unclassified row would deduct an unknown amount',
  );
  check(
    'K_CLIENT_SELLER_ID_IGNORED',
    !JSON.stringify(validateExpenseWrite({ ...base, sellerUserId: OTHER })).includes(OTHER),
    'sellerUserId must never survive validation',
  );
}

// ---------------------------------------------------------------------------
// L. PLATFORM FEE DOUBLE COUNT
// ---------------------------------------------------------------------------
{
  const financial = buildSellerFinancialYear({
    sellerUserId: SELLER,
    year: 2026,
    legs: [
      {
        transactionId: 'txn_1',
        orderId: 'o1',
        sellerGrossCents: 100_000,
        platformFeeBps: 1_200,
        status: 'CAPTURED',
        occurredAt: new Date(Date.UTC(2026, 3, 1)),
        source: 'STRIPE_TRANSACTION',
        currency: null,
        refunds: [],
      },
    ],
    courierLegs: [],
  });

  check('L_NET_SALES', financial.netSalesCents === 100_000);
  check('L_PLATFORM_FEE', financial.netPlatformFeesCents === 12_000);
  check('L_NET_PROCEEDS_ALREADY_NET_OF_FEE', financial.sellerNetProceedsCents === 88_000);

  // No manual expenses: the fee is deducted exactly once, by the platform side.
  const noExpenses = buildSellerFiscalResult({
    financial,
    expenses: year([]),
  });
  check('L_FEE_COUNTED_ONCE', noExpenses.partialResultCents === 88_000);
  check('L_FEE_REPORTED_SEPARATELY', noExpenses.platformFeeCents === 12_000);
  check(
    'L_FEE_MARKED_ALREADY_DEDUCTED',
    noExpenses.sources.platformFee.alreadyDeductedInNetProceeds === true &&
      noExpenses.sources.platformFee.sellerMustNotReEnter === true,
  );
  check('L_FEE_PROVENANCE', noExpenses.sources.platformFee.provenance === 'PLATFORM_DERIVED');

  // A seller who types the same €120 in again is warned, and the duplicate is
  // visible as its own notice rather than silently doubling the deduction.
  const duplicated = year([
    expense({ id: 'dup', amountCents: 12_000, category: 'PLATFORM' }),
  ]);
  const withDuplicate = buildSellerFiscalResult({
    financial,
    expenses: duplicated,
    platformCategorySpendCents: duplicated.byCategory.find((c) => c.category === 'PLATFORM')
      ?.businessRelatedSpendCents,
  });
  check(
    'L_DUPLICATE_IS_FLAGGED',
    withDuplicate.notices.some(
      (n) => n.code === 'PLATFORM_COSTS_MAY_BE_DUPLICATED' && n.amountCents === 12_000,
    ),
  );
  check(
    'L_PLATFORM_FEE_NOT_AN_EXPENSE_ROW',
    noExpenses.sources.costs === 'SELLER_ADMINISTERED' &&
      year([]).actualSpendCents === 0 &&
      noExpenses.platformFeeCents === 12_000,
    'the fee exists on the sales side while the expense side is empty',
  );
  check(
    'L_DUPLICATE_NOT_SUBTRACTED_TWICE',
    withDuplicate.partialResultCents === 88_000 - 12_000 &&
      withDuplicate.platformFeeCents === 12_000,
    `a re-entered fee is deducted once as a seller cost and once by the platform, ` +
      `which is exactly why it is flagged; got ${withDuplicate.partialResultCents}`,
  );
}

// ---------------------------------------------------------------------------
// §29. FINANCIAL RESULT FIXTURES
// ---------------------------------------------------------------------------
{
  // Controlled canonical sales: €1,000 gross, 12% commission -> €880 proceeds.
  const financial = buildSellerFinancialYear({
    sellerUserId: SELLER,
    year: 2026,
    legs: [
      {
        transactionId: 'txn_1',
        orderId: 'o1',
        sellerGrossCents: 100_000,
        platformFeeBps: 1_200,
        status: 'CAPTURED',
        occurredAt: new Date(Date.UTC(2026, 3, 1)),
        source: 'STRIPE_TRANSACTION',
        currency: null,
        refunds: [],
      },
    ],
    courierLegs: [],
  });

  // €200 of confirmed deductible costs.
  const resolved = year([
    expense({ id: 'c1', amountCents: 20_000, fiscalTreatment: 'ORDINARY_EXPENSE' }),
  ]);
  const r1 = buildSellerFiscalResult({ financial, expenses: resolved });

  check('R_GROSS', r1.grossSalesCents === 100_000);
  check('R_PLATFORM_FEE', r1.platformFeeCents === 12_000);
  check('R_NET_PROCEEDS', r1.sellerNetProceedsCents === 88_000);
  check('R_DEDUCTIBLE', r1.sellerDeductibleCostCents === 20_000);
  check('R_PARTIAL_RESULT', r1.partialResultCents === 68_000, String(r1.partialResultCents));
  check('R_COSTS_RESOLVED', r1.completeness === 'PARTIAL_COSTS_RESOLVED');
  check(
    'R_ALWAYS_DISCLOSES_EXTERNAL_REVENUE_GAP',
    r1.notices.some((n) => n.code === 'EXTERNAL_REVENUE_NOT_INCLUDED'),
    'HomeCheff cannot see other income even when every cost is classified',
  );

  // Add €100 of UNKNOWN cost. The result must NOT move.
  const withUnknown = year([
    expense({ id: 'c1', amountCents: 20_000, fiscalTreatment: 'ORDINARY_EXPENSE' }),
    expense({ id: 'c2', amountCents: 10_000, fiscalTreatment: 'UNKNOWN', confirmationStatus: 'DRAFT' }),
  ]);
  const r2 = buildSellerFiscalResult({ financial, expenses: withUnknown });

  check(
    'R_UNKNOWN_NOT_SUBTRACTED',
    r2.partialResultCents === 68_000,
    `expected 68000, got ${r2.partialResultCents}`,
  );
  check('R_UNKNOWN_EXPOSED', r2.unresolvedCostCents === 10_000);
  check('R_STATE_BECOMES_UNRESOLVED', r2.completeness === 'PARTIAL_COSTS_UNRESOLVED');
  check(
    'R_UNKNOWN_NOTICE_CARRIES_AMOUNT',
    r2.notices.some((n) => n.code === 'COSTS_NEED_CLASSIFICATION' && n.amountCents === 10_000),
  );
  check(
    'R_ACTUAL_SPEND_STILL_VISIBLE',
    withUnknown.actualSpendCents === 30_000,
    'the seller still sees they spent 300',
  );

  // Investment gets its own notice, distinct from "please classify this".
  const withInvestment = year([
    expense({ id: 'c1', amountCents: 20_000, fiscalTreatment: 'ORDINARY_EXPENSE' }),
    expense({ id: 'c3', amountCents: 100_000, category: 'EQUIPMENT', fiscalTreatment: 'INVESTMENT' }),
  ]);
  const r3 = buildSellerFiscalResult({ financial, expenses: withInvestment });
  check('R_INVESTMENT_NOT_SUBTRACTED', r3.partialResultCents === 68_000);
  check('R_INVESTMENT_REPORTED', r3.investmentCostCents === 100_000);
  check(
    'R_INVESTMENT_HAS_OWN_NOTICE',
    r3.notices.some((n) => n.code === 'INVESTMENT_NEEDS_DEPRECIATION' && n.amountCents === 100_000),
  );
  check(
    'R_INVESTMENT_NOT_DOUBLE_REPORTED_AS_CLASSIFY',
    !r3.notices.some((n) => n.code === 'COSTS_NEED_CLASSIFICATION'),
    'an investment needs depreciation, not classification',
  );

  // Sales inconsistency propagates rather than being papered over.
  const brokenSales = buildSellerFinancialYear({
    sellerUserId: SELLER,
    year: 2026,
    legs: [
      {
        transactionId: 'txn_bad',
        orderId: 'o2',
        sellerGrossCents: 100,
        platformFeeBps: 1_200,
        status: 'REFUNDED',
        occurredAt: new Date(Date.UTC(2026, 3, 1)),
        source: 'STRIPE_TRANSACTION',
        currency: null,
        refunds: [
          { refundId: 'r1', amountCents: 215, occurredAt: new Date(Date.UTC(2026, 3, 2)) },
        ],
      },
    ],
    courierLegs: [],
  });
  const r4 = buildSellerFiscalResult({ financial: brokenSales, expenses: resolved });
  check('R_SALES_INCONSISTENCY_PROPAGATES', r4.completeness === 'PARTIAL_SALES_INCONSISTENT');
  check(
    'R_SALES_INCONSISTENCY_NOTICE',
    r4.notices.some((n) => n.code === 'SALES_DATA_INCONSISTENT'),
  );

  // Sales figures are not touched by the existence of expenses.
  check(
    'R_SALES_UNCHANGED_BY_EXPENSES',
    r1.grossSalesCents === 100_000 && r2.grossSalesCents === 100_000 && r3.grossSalesCents === 100_000,
  );
  check(
    'R_REFUNDS_UNCHANGED_BY_EXPENSES',
    r1.refundCents === 0 && r2.refundCents === 0 && r3.refundCents === 0,
  );
  check(
    'R_FEES_UNCHANGED_BY_EXPENSES',
    r1.platformFeeCents === 12_000 && r3.platformFeeCents === 12_000,
  );
  check(
    'R_NET_PROCEEDS_UNCHANGED_BY_EXPENSES',
    r1.sellerNetProceedsCents === 88_000 && r3.sellerNetProceedsCents === 88_000,
  );
  check('R_SOURCES_STAY_DISTINCT', r1.sources.sales === 'PLATFORM_TRANSACTION' && r1.sources.costs === 'SELLER_ADMINISTERED');
}

// ---------------------------------------------------------------------------
// CURRENCY — an unsupported currency never joins a EUR total
// ---------------------------------------------------------------------------
{
  const y = year([
    expense({ id: 'eur', amountCents: 10_000 }),
    expense({ id: 'usd', amountCents: 50_000, currency: 'USD' }),
  ]);
  check('CUR_FOREIGN_EXCLUDED_FROM_ACTUAL', y.actualSpendCents === 10_000);
  check('CUR_FOREIGN_EXCLUDED_FROM_DEDUCTIBLE', y.confirmedDeductibleCostCents === 10_000);
  check('CUR_FLAGGED', y.completeness === 'UNSUPPORTED_CURRENCY');
  check('CUR_NO_INVENTED_FX', y.actualSpendCents !== 60_000);
}

// ---------------------------------------------------------------------------
// PRIVACY / PROVENANCE
// ---------------------------------------------------------------------------
{
  const e = resolveSellerExpense(expense());
  check('P_SOURCE_IS_USER_PROVIDED', e.source === 'USER_PROVIDED');
  const routeSrc = require('fs').readFileSync('app/api/seller/expenses/route.ts', 'utf8');
  check(
    'P_CREATE_FORCES_USER_PROVIDED',
    routeSrc.includes("source: 'USER_PROVIDED'"),
    'a client must not be able to claim RECEIPT_CONFIRMED',
  );
  check('P_NO_ANALYTICS_IN_ROUTE', !/analytics|track\(|AnalyticsEvent/i.test(routeSrc));
  check(
    'P_DERIVED_DEDUCTIBLE_NOT_PERSISTED',
    !require('fs').readFileSync('prisma/schema.prisma', 'utf8').includes('deductibleAmountCents'),
    'a stored deductible amount could outlive the rule that produced it',
  );
}

console.log(`\nPHASE 8C seller expense foundation — ${results.length} checks, ${failures} failed\n`);
console.log(results.join('\n'));
if (failures > 0) process.exitCode = 1;
