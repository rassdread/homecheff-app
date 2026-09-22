/**
 * PHASE 8C — seller expense update and delete.
 *
 * Every write is scoped by BOTH the row id and the session user id, so a
 * request for someone else's expense cannot match and is reported as 404
 * rather than 403 — a 403 would confirm the row exists.
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateExpenseWrite } from '@/lib/finance/seller-expense-input';

export const dynamic = 'force-dynamic';

async function sessionUserId(): Promise<string | null> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  return user?.id ?? null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> },
) {
  try {
    const sellerUserId = await sessionUserId();
    if (!sellerUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { expenseId } = await params;

    const parsed = validateExpenseWrite(await req.json().catch(() => null));
    if (!parsed.ok) {
      return NextResponse.json({ error: 'Invalid expense', details: parsed.errors }, { status: 400 });
    }

    // Ownership is part of the WHERE, not a prior read: no window exists in
    // which the row could change hands between the check and the write.
    // taxYear is recomputed from the submitted date, so moving an expense
    // across a year boundary reclassifies it deterministically.
    const updated = await prisma.sellerExpense.updateMany({
      where: { id: expenseId, sellerUserId, deletedAt: null },
      data: { ...parsed.value, source: 'USER_PROVIDED' },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json({ id: expenseId, taxYear: parsed.value.taxYear });
  } catch (error) {
    console.error('seller expense PATCH failed:', error);
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> },
) {
  try {
    const sellerUserId = await sessionUserId();
    if (!sellerUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { expenseId } = await params;

    // Soft delete: a tax year that has already been looked at must stay
    // reproducible. Deleted rows are excluded from every total and every list.
    const deleted = await prisma.sellerExpense.updateMany({
      where: { id: expenseId, sellerUserId, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json({ id: expenseId, deleted: true });
  } catch (error) {
    console.error('seller expense DELETE failed:', error);
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}
