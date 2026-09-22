/**
 * PHASE 8C — request validation for seller expenses (pure).
 *
 * Nothing about ownership is validated here: sellerUserId is never accepted
 * from a client, it is taken from the session in the route. This module only
 * decides whether the *content* of a request is a coherent expense.
 */
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CONFIRMATION_STATUSES,
  EXPENSE_FISCAL_TREATMENTS,
  FULL_BUSINESS_USE_BP,
  SUPPORTED_EXPENSE_CURRENCIES,
  taxYearOf,
  type ExpenseCategory,
  type ExpenseConfirmationStatus,
  type ExpenseFiscalTreatment,
} from './seller-expense';

/** Guards against a typo turning into an absurd year, and against overflow. */
export const MAX_EXPENSE_AMOUNT_CENTS = 100_000_000; // €1,000,000
export const MIN_EXPENSE_YEAR = 2015;
export const MAX_NOTES_LENGTH = 2_000;
export const MAX_TEXT_LENGTH = 200;

export type ExpenseWriteFields = {
  expenseDate: Date;
  taxYear: number;
  amountCents: number;
  currency: string;
  category: ExpenseCategory;
  businessUseBp: number | null;
  fiscalTreatment: ExpenseFiscalTreatment;
  confirmationStatus: ExpenseConfirmationStatus;
  merchantName: string | null;
  description: string | null;
  notes: string | null;
};

export type ValidationResult =
  | { ok: true; value: ExpenseWriteFields }
  | { ok: false; errors: string[] };

function cleanText(value: unknown, max: number): string | null | 'INVALID' {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') return 'INVALID';
  const trimmed = value.trim();
  if (trimmed === '') return null;
  if (trimmed.length > max) return 'INVALID';
  return trimmed;
}

/**
 * Parse a calendar date without letting a timezone shift it into another tax
 * year. A bare YYYY-MM-DD is anchored at UTC midnight so 2026-12-31 stays in
 * 2026 for a seller in Amsterdam, where a local-midnight parse would land in
 * 2026-12-30T23:00Z and still read as 2026 — but the reverse case, 2027-01-01,
 * would read as 2026. Anchoring removes the whole class of error.
 */
export function parseExpenseDate(value: unknown): Date | null {
  if (typeof value !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const [, y, m, d] = match;
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  // Rejects 2026-02-30, which Date.UTC would silently roll into March.
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

export function validateExpenseWrite(body: unknown): ValidationResult {
  const errors: string[] = [];
  const b = (body ?? {}) as Record<string, unknown>;

  const expenseDate = parseExpenseDate(b.expenseDate);
  if (!expenseDate) {
    errors.push('expenseDate must be a calendar date formatted YYYY-MM-DD');
  }

  const taxYear = expenseDate ? taxYearOf(expenseDate) : Number.NaN;
  if (expenseDate && (taxYear < MIN_EXPENSE_YEAR || taxYear > new Date().getUTCFullYear() + 1)) {
    errors.push(`expenseDate year must be between ${MIN_EXPENSE_YEAR} and next year`);
  }

  const amountCents = b.amountCents;
  if (typeof amountCents !== 'number' || !Number.isInteger(amountCents)) {
    errors.push('amountCents must be an integer number of cents');
  } else if (amountCents <= 0) {
    // Zero is rejected too: an expense of nothing is a data-entry mistake, and
    // a refund of an expense is not modelled in this phase.
    errors.push('amountCents must be greater than 0');
  } else if (amountCents > MAX_EXPENSE_AMOUNT_CENTS) {
    errors.push(`amountCents must not exceed ${MAX_EXPENSE_AMOUNT_CENTS}`);
  }

  const currency = typeof b.currency === 'string' ? b.currency.toUpperCase() : 'EUR';
  if (!(SUPPORTED_EXPENSE_CURRENCIES as readonly string[]).includes(currency)) {
    errors.push(`currency must be one of ${SUPPORTED_EXPENSE_CURRENCIES.join(', ')}`);
  }

  const category = b.category;
  if (!(EXPENSE_CATEGORIES as readonly unknown[]).includes(category)) {
    errors.push(`category must be one of ${EXPENSE_CATEGORIES.join(', ')}`);
  }

  let businessUseBp: number | null = null;
  if (b.businessUseBp !== undefined && b.businessUseBp !== null) {
    if (typeof b.businessUseBp !== 'number' || !Number.isInteger(b.businessUseBp)) {
      errors.push('businessUseBp must be an integer in basis points');
    } else if (b.businessUseBp < 0 || b.businessUseBp > FULL_BUSINESS_USE_BP) {
      errors.push(`businessUseBp must be between 0 and ${FULL_BUSINESS_USE_BP}`);
    } else {
      businessUseBp = b.businessUseBp;
    }
  }

  const fiscalTreatment = (b.fiscalTreatment ?? 'UNKNOWN') as ExpenseFiscalTreatment;
  if (!(EXPENSE_FISCAL_TREATMENTS as readonly unknown[]).includes(fiscalTreatment)) {
    errors.push(`fiscalTreatment must be one of ${EXPENSE_FISCAL_TREATMENTS.join(', ')}`);
  }

  const confirmationStatus = (b.confirmationStatus ?? 'DRAFT') as ExpenseConfirmationStatus;
  if (!(EXPENSE_CONFIRMATION_STATUSES as readonly unknown[]).includes(confirmationStatus)) {
    errors.push(`confirmationStatus must be one of ${EXPENSE_CONFIRMATION_STATUSES.join(', ')}`);
  }

  // A row cannot claim to be confirmed while still unclassified — that is the
  // combination that would otherwise silently deduct an unknown amount.
  if (confirmationStatus === 'CONFIRMED' && fiscalTreatment === 'UNKNOWN') {
    errors.push('confirmationStatus CONFIRMED requires a fiscalTreatment other than UNKNOWN');
  }

  const merchantName = cleanText(b.merchantName, MAX_TEXT_LENGTH);
  if (merchantName === 'INVALID') errors.push(`merchantName must be text up to ${MAX_TEXT_LENGTH} characters`);
  const description = cleanText(b.description, MAX_TEXT_LENGTH);
  if (description === 'INVALID') errors.push(`description must be text up to ${MAX_TEXT_LENGTH} characters`);
  const notes = cleanText(b.notes, MAX_NOTES_LENGTH);
  if (notes === 'INVALID') errors.push(`notes must be text up to ${MAX_NOTES_LENGTH} characters`);

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      expenseDate: expenseDate!,
      taxYear,
      amountCents: amountCents as number,
      currency,
      category: category as ExpenseCategory,
      businessUseBp,
      fiscalTreatment,
      confirmationStatus,
      merchantName: merchantName as string | null,
      description: description as string | null,
      notes: notes as string | null,
    },
  };
}
