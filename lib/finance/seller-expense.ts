/**
 * PHASE 8C — seller expense administration (pure core).
 *
 * Records what a seller actually paid and keeps four things apart that are
 * routinely — and expensively — collapsed into one number:
 *
 *   ACTUAL SPEND      what left the seller's bank account
 *   BUSINESS SHARE    how much of that relates to the activity
 *   FISCAL TREATMENT  how the business part must be treated
 *   DEDUCTIBLE COST   what may actually enter a fiscal result
 *
 * €100 at 60% business use is €60 of business spend. It is NOT €60 of
 * deductible cost until the treatment says so, and for an investment it is
 * never the full amount in the year of purchase.
 *
 * This module decides deductibility ONLY where an official 2026 Dutch rule was
 * verified against a primary source (see OFFICIAL_SOURCES). Everywhere else it
 * returns UNKNOWN. UNKNOWN is not zero, and must never be silently treated as
 * zero — that is the difference between "this costs nothing" and "we don't know
 * yet", and only one of those is safe to subtract from a seller's result.
 *
 * Pure by design: no Prisma, no clock, no env, no I/O.
 */

export const SELLER_EXPENSE_SCHEMA_VERSION = '8c.1';

/**
 * Primary sources verified for tax year 2026. Every rule this module applies
 * cites one of these. Rules that could not be verified are not implemented.
 */
export const OFFICIAL_SOURCES = {
  ZAKELIJKE_KOSTEN:
    'https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/winst/inkomstenbelasting/inkomstenbelasting_voor_ondernemers/zakelijke_kosten/zakelijke_kosten',
  BEDRIJFSMIDDELEN:
    'https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/winst/inkomstenbelasting/inkomstenbelasting_voor_ondernemers/investeren_in_bedrijfsmiddelen',
  AFSCHRIJVING:
    'https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/winst/inkomstenbelasting/inkomstenbelasting_voor_ondernemers/afschrijving/',
  DREMPEL_BEPERKT_AFTREKBAAR_2026:
    'https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/winst/inkomstenbelasting/veranderingen-inkomstenbelasting-2026/drempel-beperkt-aftrekbare-kosten-2026',
  ADMINISTRATIE_BEWAARPLICHT:
    'https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/ondernemen/administratie/',
} as const;

/**
 * Verified 2026 facts. Present so the numbers are auditable, NOT so this module
 * can compute a tax return from them.
 */
export const OFFICIAL_FACTS_2026 = {
  /**
   * A bedrijfsmiddel below €450 may be deducted in full in the year of
   * purchase; at or above €450 it must normally be depreciated.
   * Source: BEDRIJFSMIDDELEN, AFSCHRIJVING.
   */
  INVESTMENT_THRESHOLD_CENTS: 45_000,
  /**
   * Threshold for beperkt aftrekbare kosten (representation, certain gifts).
   * An IB entrepreneur may instead elect to deduct 80%. Both are year-level
   * choices, which is exactly why this module refuses to resolve them per row.
   * Source: DREMPEL_BEPERKT_AFTREKBAAR_2026.
   */
  LIMITED_DEDUCTION_THRESHOLD_CENTS: 570_000,
  LIMITED_DEDUCTION_IB_PERCENT: 80,
  /** Basisgegevens must be retained 7 years. Source: ADMINISTRATIE_BEWAARPLICHT. */
  RECORD_RETENTION_YEARS: 7,
} as const;

/**
 * HomeCheff commerce is single-currency (see SELLER_FINANCIAL_CURRENCY). An
 * expense in another currency would need an FX rate and an FX policy, and
 * inventing either would quietly corrupt a fiscal result. So only EUR is
 * accepted, explicitly, rather than assumed.
 */
export const SELLER_EXPENSE_CURRENCY = 'EUR';
export const SUPPORTED_EXPENSE_CURRENCIES = [SELLER_EXPENSE_CURRENCY] as const;

/**
 * UX buckets, reused verbatim from lib/verdiencheck/domain/cost-categories.ts
 * so there is one taxonomy, not two. A category is what the seller bought.
 * It is NOT a tax verdict: EQUIPMENT is not automatically deductible and
 * DELIVERY is not automatically fully deductible.
 */
export const EXPENSE_CATEGORIES = [
  'MATERIALS',
  'PACKAGING',
  'PLATFORM',
  'DELIVERY',
  'EQUIPMENT',
  'MARKETING',
  'OTHER',
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

/**
 * Categories that plausibly hold durable assets, so the investment question is
 * worth asking. Mirrors categoryMayBeDurableAsset() in the VerdienCheck domain.
 */
const DURABLE_ASSET_CATEGORIES = new Set<ExpenseCategory>(['EQUIPMENT', 'OTHER']);

/**
 * How the business part must be treated fiscally. ORDINARY_EXPENSE and
 * INVESTMENT keep the names already used by COST_LINE_KINDS.
 */
export const EXPENSE_FISCAL_TREATMENTS = [
  /** Not yet classified. Deductible amount is UNKNOWN, never zero. */
  'UNKNOWN',
  /** Ordinary business cost, deductible in the year. Source: ZAKELIJKE_KOSTEN. */
  'ORDINARY_EXPENSE',
  /** Durable asset that must be depreciated. Source: BEDRIJFSMIDDELEN. */
  'INVESTMENT',
  /** Confirmed not deductible (private, fines, general clothing, …). */
  'NON_DEDUCTIBLE',
  /** Beperkt aftrekbaar — resolvable only at year level. */
  'LIMITED_DEDUCTIBLE',
] as const;
export type ExpenseFiscalTreatment = (typeof EXPENSE_FISCAL_TREATMENTS)[number];

/** Provenance. Manual entry is never dressed up as verified. */
export const EXPENSE_SOURCES = [
  'USER_PROVIDED',
  /** Reserved for later phases; nothing writes these yet. */
  'RECEIPT_CONFIRMED',
  'AI_SUGGESTED',
  'IMPORTED',
  'PLATFORM_DERIVED',
] as const;
export type ExpenseSource = (typeof EXPENSE_SOURCES)[number];

export const EXPENSE_CONFIRMATION_STATUSES = ['DRAFT', 'CONFIRMED', 'NEEDS_REVIEW'] as const;
export type ExpenseConfirmationStatus = (typeof EXPENSE_CONFIRMATION_STATUSES)[number];

/** Why a deductible amount could not be determined. */
export type DeductibleUnknownReason =
  | 'NOT_CLASSIFIED'
  | 'NOT_CONFIRMED'
  | 'NEEDS_DEPRECIATION'
  | 'YEAR_LEVEL_ELECTION'
  | 'FLAGGED_FOR_REVIEW';

/**
 * A resolved deductible amount, or an explicit statement that we do not know.
 * Modelled as a discriminated union precisely so a caller cannot read `.cents`
 * without first acknowledging the UNKNOWN case.
 */
export type DeductibleResolution =
  | { status: 'KNOWN'; cents: number; ruleKey: string; sourceKey: keyof typeof OFFICIAL_SOURCES }
  | { status: 'UNKNOWN'; reason: DeductibleUnknownReason };

/** Business-use share in basis points: 10_000 = 100.00%, two decimal places. */
export const FULL_BUSINESS_USE_BP = 10_000;

export type SellerExpenseInput = {
  id: string;
  sellerUserId: string;
  expenseDate: Date;
  amountCents: number;
  currency: string;
  category: ExpenseCategory;
  /** null means "not stated", which is treated as fully business. */
  businessUseBp: number | null;
  fiscalTreatment: ExpenseFiscalTreatment;
  source: ExpenseSource;
  confirmationStatus: ExpenseConfirmationStatus;
  merchantName?: string | null;
  description?: string | null;
  notes?: string | null;
  deletedAt?: Date | null;
};

export type ResolvedSellerExpense = SellerExpenseInput & {
  taxYear: number;
  businessUseBpEffective: number;
  businessAmountCents: number;
  deductible: DeductibleResolution;
  /** True when the amount and category make the investment question relevant. */
  investmentQuestionApplies: boolean;
};

/** Calendar year in UTC, matching the Phase-8B and DAC7 year-bound convention. */
export function taxYearOf(date: Date): number {
  return date.getUTCFullYear();
}

/**
 * Round half away from zero. Matches toCentsRoundHalfUp() in the VerdienCheck
 * tax engine so a seller sees the same cent in both places. Deterministic:
 * never Math.round, which rounds -0.5 towards zero and would make signed
 * amounts asymmetric.
 */
export function roundHalfAwayFromZero(value: number): number {
  return value < 0 ? -Math.floor(-value + 0.5) : Math.floor(value + 0.5);
}

/**
 * ACTUAL SPEND x BUSINESS SHARE. Basis points keep this exact to 0.01%, and the
 * multiplication happens before the division so no intermediate float is
 * rounded twice.
 */
export function businessAmountCentsFor(amountCents: number, businessUseBp: number): number {
  if (amountCents <= 0) return 0;
  const bp = clampBusinessUseBp(businessUseBp);
  if (bp === FULL_BUSINESS_USE_BP) return amountCents;
  return roundHalfAwayFromZero((amountCents * bp) / FULL_BUSINESS_USE_BP);
}

export function clampBusinessUseBp(bp: number): number {
  if (!Number.isFinite(bp)) return 0;
  return Math.min(FULL_BUSINESS_USE_BP, Math.max(0, Math.trunc(bp)));
}

/**
 * Should we ask whether this is an investment? Only advisory — crossing the
 * official €450 threshold prompts the question, it never answers it.
 */
export function investmentQuestionAppliesTo(input: {
  amountCents: number;
  category: ExpenseCategory;
}): boolean {
  return (
    DURABLE_ASSET_CATEGORIES.has(input.category) &&
    input.amountCents >= OFFICIAL_FACTS_2026.INVESTMENT_THRESHOLD_CENTS
  );
}

/**
 * FISCAL TREATMENT -> DEDUCTIBLE COST.
 *
 * Only two treatments produce a number, and only when the seller has confirmed
 * the row. Everything else is UNKNOWN with a reason, because:
 *
 *  - INVESTMENT needs a depreciation schedule (aanschafwaarde, useful life,
 *    residual value, first year of use). No such engine exists yet, and
 *    guessing one would put a full asset price into a single year.
 *  - LIMITED_DEDUCTIBLE depends on a year-level choice between the €5.700
 *    threshold and the 80% election, which cannot be decided from one row.
 */
export function resolveDeductible(input: {
  fiscalTreatment: ExpenseFiscalTreatment;
  confirmationStatus: ExpenseConfirmationStatus;
  businessAmountCents: number;
}): DeductibleResolution {
  if (input.confirmationStatus === 'NEEDS_REVIEW') {
    return { status: 'UNKNOWN', reason: 'FLAGGED_FOR_REVIEW' };
  }
  if (input.fiscalTreatment === 'UNKNOWN') {
    return { status: 'UNKNOWN', reason: 'NOT_CLASSIFIED' };
  }
  if (input.fiscalTreatment === 'INVESTMENT') {
    return { status: 'UNKNOWN', reason: 'NEEDS_DEPRECIATION' };
  }
  if (input.fiscalTreatment === 'LIMITED_DEDUCTIBLE') {
    return { status: 'UNKNOWN', reason: 'YEAR_LEVEL_ELECTION' };
  }
  if (input.confirmationStatus !== 'CONFIRMED') {
    return { status: 'UNKNOWN', reason: 'NOT_CONFIRMED' };
  }
  if (input.fiscalTreatment === 'NON_DEDUCTIBLE') {
    // A confirmed zero. Deliberately distinct from UNKNOWN: the seller told us
    // this is private, so it is a fact that it deducts nothing.
    return {
      status: 'KNOWN',
      cents: 0,
      ruleKey: 'NL_2026_NIET_AFTREKBAAR',
      sourceKey: 'ZAKELIJKE_KOSTEN',
    };
  }
  return {
    status: 'KNOWN',
    cents: input.businessAmountCents,
    ruleKey: 'NL_2026_ZAKELIJKE_KOSTEN_VOLLEDIG_AFTREKBAAR',
    sourceKey: 'ZAKELIJKE_KOSTEN',
  };
}

export function resolveSellerExpense(input: SellerExpenseInput): ResolvedSellerExpense {
  const businessUseBpEffective = clampBusinessUseBp(input.businessUseBp ?? FULL_BUSINESS_USE_BP);
  const businessAmountCents = businessAmountCentsFor(input.amountCents, businessUseBpEffective);
  return {
    ...input,
    taxYear: taxYearOf(input.expenseDate),
    businessUseBpEffective,
    businessAmountCents,
    deductible: resolveDeductible({
      fiscalTreatment: input.fiscalTreatment,
      confirmationStatus: input.confirmationStatus,
      businessAmountCents,
    }),
    investmentQuestionApplies: investmentQuestionAppliesTo({
      amountCents: input.amountCents,
      category: input.category,
    }),
  };
}

export type SellerExpenseYearCompleteness =
  | 'COMPLETE'
  | 'NEEDS_CLASSIFICATION'
  | 'UNSUPPORTED_CURRENCY';

export type SellerExpenseYear = {
  schemaVersion: typeof SELLER_EXPENSE_SCHEMA_VERSION;
  sellerUserId: string;
  year: number;
  currency: typeof SELLER_EXPENSE_CURRENCY;

  /** A. What the seller actually paid, whatever its treatment. */
  actualSpendCents: number;
  /** B. The part attributed to the activity. */
  businessRelatedSpendCents: number;
  /** D. Only amounts a verified rule resolved. Safe to subtract. */
  confirmedDeductibleCostCents: number;
  /** Business spend whose treatment is not resolved. NOT inside the above. */
  unknownOrReviewAmountCents: number;
  /** Business spend parked as investment, awaiting depreciation. */
  investmentAmountCents: number;

  expenseCount: number;
  unresolvedCount: number;
  investmentCount: number;
  byCategory: Array<{
    category: ExpenseCategory;
    actualSpendCents: number;
    businessRelatedSpendCents: number;
    confirmedDeductibleCostCents: number;
  }>;
  completeness: SellerExpenseYearCompleteness;
  provenance: 'SELLER_ADMINISTERED';
};

/**
 * Aggregate one tax year. Deleted rows never enter any total.
 *
 * investmentAmountCents is reported separately from unknownOrReviewAmountCents
 * even though both are unresolved, because they need different actions: an
 * investment needs a depreciation schedule, an unclassified row needs a seller
 * decision.
 */
export function buildSellerExpenseYear(input: {
  sellerUserId: string;
  year: number;
  expenses: readonly SellerExpenseInput[];
}): SellerExpenseYear {
  let actualSpendCents = 0;
  let businessRelatedSpendCents = 0;
  let confirmedDeductibleCostCents = 0;
  let unknownOrReviewAmountCents = 0;
  let investmentAmountCents = 0;
  let expenseCount = 0;
  let unresolvedCount = 0;
  let investmentCount = 0;
  let sawUnsupportedCurrency = false;

  const byCategory = new Map<
    ExpenseCategory,
    { actualSpendCents: number; businessRelatedSpendCents: number; confirmedDeductibleCostCents: number }
  >();

  for (const raw of input.expenses) {
    if (raw.deletedAt) continue;
    const e = resolveSellerExpense(raw);
    if (e.taxYear !== input.year) continue;

    // An unsupported currency must not silently join a EUR total. It is counted
    // as unresolved and flagged, not converted.
    if (e.currency !== SELLER_EXPENSE_CURRENCY) {
      sawUnsupportedCurrency = true;
      unresolvedCount += 1;
      continue;
    }

    expenseCount += 1;
    actualSpendCents += e.amountCents;
    businessRelatedSpendCents += e.businessAmountCents;

    if (e.deductible.status === 'KNOWN') {
      confirmedDeductibleCostCents += e.deductible.cents;
    } else {
      unresolvedCount += 1;
      unknownOrReviewAmountCents += e.businessAmountCents;
      if (e.deductible.reason === 'NEEDS_DEPRECIATION') {
        investmentCount += 1;
        investmentAmountCents += e.businessAmountCents;
      }
    }

    const bucket = byCategory.get(e.category) ?? {
      actualSpendCents: 0,
      businessRelatedSpendCents: 0,
      confirmedDeductibleCostCents: 0,
    };
    bucket.actualSpendCents += e.amountCents;
    bucket.businessRelatedSpendCents += e.businessAmountCents;
    if (e.deductible.status === 'KNOWN') {
      bucket.confirmedDeductibleCostCents += e.deductible.cents;
    }
    byCategory.set(e.category, bucket);
  }

  const completeness: SellerExpenseYearCompleteness = sawUnsupportedCurrency
    ? 'UNSUPPORTED_CURRENCY'
    : unresolvedCount > 0
      ? 'NEEDS_CLASSIFICATION'
      : 'COMPLETE';

  return {
    schemaVersion: SELLER_EXPENSE_SCHEMA_VERSION,
    sellerUserId: input.sellerUserId,
    year: input.year,
    currency: SELLER_EXPENSE_CURRENCY,
    actualSpendCents,
    businessRelatedSpendCents,
    confirmedDeductibleCostCents,
    unknownOrReviewAmountCents,
    investmentAmountCents,
    expenseCount,
    unresolvedCount,
    investmentCount,
    byCategory: EXPENSE_CATEGORIES.filter((c) => byCategory.has(c)).map((category) => ({
      category,
      ...byCategory.get(category)!,
    })),
    completeness,
    provenance: 'SELLER_ADMINISTERED',
  };
}
