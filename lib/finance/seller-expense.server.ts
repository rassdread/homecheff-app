/**
 * PHASE 8C — database-backed seller expense derivation.
 *
 * Thin loader over the pure core in seller-expense.ts. All arithmetic and every
 * fiscal decision lives there; this file only fetches rows.
 */
import { prisma } from '@/lib/prisma';
import {
  buildSellerExpenseYear,
  resolveSellerExpense,
  type ExpenseCategory,
  type ExpenseConfirmationStatus,
  type ExpenseFiscalTreatment,
  type ExpenseSource,
  type ResolvedSellerExpense,
  type SellerExpenseInput,
  type SellerExpenseYear,
} from './seller-expense';
import {
  buildSellerFiscalResult,
  type SellerFiscalResult,
} from './seller-fiscal-result';
import { deriveSellerFinancialYear } from './seller-financial-year.server';

type Row = {
  id: string;
  sellerUserId: string;
  expenseDate: Date;
  amountCents: number;
  currency: string;
  category: string;
  businessUseBp: number | null;
  fiscalTreatment: string;
  source: string;
  confirmationStatus: string;
  merchantName: string | null;
  description: string | null;
  notes: string | null;
  deletedAt: Date | null;
};

function toInput(row: Row): SellerExpenseInput {
  return {
    id: row.id,
    sellerUserId: row.sellerUserId,
    expenseDate: row.expenseDate,
    amountCents: row.amountCents,
    currency: row.currency,
    category: row.category as ExpenseCategory,
    businessUseBp: row.businessUseBp,
    fiscalTreatment: row.fiscalTreatment as ExpenseFiscalTreatment,
    source: row.source as ExpenseSource,
    confirmationStatus: row.confirmationStatus as ExpenseConfirmationStatus,
    merchantName: row.merchantName,
    description: row.description,
    notes: row.notes,
    deletedAt: row.deletedAt,
  };
}

const SELECT = {
  id: true,
  sellerUserId: true,
  expenseDate: true,
  amountCents: true,
  currency: true,
  category: true,
  businessUseBp: true,
  fiscalTreatment: true,
  source: true,
  confirmationStatus: true,
  merchantName: true,
  description: true,
  notes: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

/** One seller's live rows for a tax year, newest spend first. */
export async function listSellerExpenses(
  sellerUserId: string,
  year: number,
): Promise<Array<ResolvedSellerExpense & { createdAt: Date; updatedAt: Date }>> {
  const rows = await prisma.sellerExpense.findMany({
    where: { sellerUserId, taxYear: year, deletedAt: null },
    orderBy: [{ expenseDate: 'desc' }, { createdAt: 'desc' }],
    select: SELECT,
  });
  return rows.map((r) => ({
    ...resolveSellerExpense(toInput(r as Row)),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

export async function deriveSellerExpenseYear(
  sellerUserId: string,
  year: number,
): Promise<SellerExpenseYear> {
  const rows = await prisma.sellerExpense.findMany({
    where: { sellerUserId, taxYear: year, deletedAt: null },
    select: SELECT,
  });
  return buildSellerExpenseYear({
    sellerUserId,
    year,
    expenses: rows.map((r) => toInput(r as Row)),
  });
}

/**
 * Sales and costs joined into a partial result. The two derivations stay
 * independent — adding an expense can never change a sales figure.
 */
export async function deriveSellerFiscalResult(
  sellerUserId: string,
  year: number,
): Promise<SellerFiscalResult> {
  const [financial, expenses] = await Promise.all([
    deriveSellerFinancialYear(sellerUserId, year),
    deriveSellerExpenseYear(sellerUserId, year),
  ]);
  const platformCategorySpendCents =
    expenses.byCategory.find((c) => c.category === 'PLATFORM')?.businessRelatedSpendCents ?? 0;
  return buildSellerFiscalResult({ financial, expenses, platformCategorySpendCents });
}
