/**
 * PHASE 8C — seller expense list and create.
 *
 * Ownership is never negotiable: sellerUserId comes from the session and a
 * sellerUserId in the request body is ignored outright.
 */
import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  deriveSellerExpenseYear,
  deriveSellerFiscalResult,
  listSellerExpenses,
} from '@/lib/finance/seller-expense.server';
import { validateExpenseWrite } from '@/lib/finance/seller-expense-input';

export const dynamic = 'force-dynamic';

function requestedYear(req: NextRequest): number {
  const raw = new URL(req.url).searchParams.get('year');
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed < 2000 || parsed > 2200) {
    return new Date().getUTCFullYear();
  }
  return parsed;
}

async function sessionUserId(): Promise<string | null> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  return user?.id ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const sellerUserId = await sessionUserId();
    if (!sellerUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const year = requestedYear(req);
    const [expenses, expenseYear, fiscalResult] = await Promise.all([
      listSellerExpenses(sellerUserId, year),
      deriveSellerExpenseYear(sellerUserId, year),
      deriveSellerFiscalResult(sellerUserId, year),
    ]);

    return NextResponse.json({
      year,
      expenses: expenses.map((e) => ({
        id: e.id,
        expenseDate: e.expenseDate.toISOString().slice(0, 10),
        amountCents: e.amountCents,
        currency: e.currency,
        category: e.category,
        businessUseBp: e.businessUseBp,
        businessAmountCents: e.businessAmountCents,
        fiscalTreatment: e.fiscalTreatment,
        deductible: e.deductible,
        source: e.source,
        confirmationStatus: e.confirmationStatus,
        investmentQuestionApplies: e.investmentQuestionApplies,
        merchantName: e.merchantName,
        description: e.description,
        notes: e.notes,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      })),
      expenseYear,
      fiscalResult,
    });
  } catch (error) {
    console.error('seller expenses GET failed:', error);
    return NextResponse.json({ error: 'Failed to load expenses' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sellerUserId = await sessionUserId();
    if (!sellerUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = validateExpenseWrite(await req.json().catch(() => null));
    if (!parsed.ok) {
      return NextResponse.json({ error: 'Invalid expense', details: parsed.errors }, { status: 400 });
    }

    const created = await prisma.sellerExpense.create({
      data: {
        id: randomUUID(),
        sellerUserId,
        ...parsed.value,
        // Manual entry is exactly that. Nothing here was checked by HomeCheff.
        source: 'USER_PROVIDED',
      },
      select: { id: true, taxYear: true },
    });

    return NextResponse.json({ id: created.id, taxYear: created.taxYear }, { status: 201 });
  } catch (error) {
    console.error('seller expenses POST failed:', error);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}
