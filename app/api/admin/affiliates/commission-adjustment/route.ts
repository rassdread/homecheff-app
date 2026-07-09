import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/admin-guard';
import { logAdminAction } from '@/lib/admin-audit';
import { LEDGER_PENDING_DAYS } from '@/lib/affiliate-config';

export const dynamic = 'force-dynamic';

const LARGE_ADJUSTMENT_CENTS = 5000;

/**
 * POST manual commission adjustment (ledger entry, non-destructive).
 * body: { affiliateId, amountCents, direction: 'credit'|'debit', reason, orderId?, subscriptionId? }
 */
export async function POST(req: NextRequest) {
  const guard = await requireSuperAdmin();
  if (!guard.ok) return guard.response;

  const body = await req.json();
  const affiliateId = body.affiliateId as string;
  const amountCents = Math.abs(Number(body.amountCents) || 0);
  const direction = body.direction as 'credit' | 'debit';
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';

  if (!affiliateId || !amountCents || !reason) {
    return NextResponse.json(
      { error: 'affiliateId, amountCents, and reason are required' },
      { status: 400 },
    );
  }

  if (direction !== 'credit' && direction !== 'debit') {
    return NextResponse.json({ error: 'direction must be credit or debit' }, { status: 400 });
  }

  if (amountCents > LARGE_ADJUSTMENT_CENTS && !guard.admin.isSuperAdmin) {
    return NextResponse.json(
      { error: 'Large adjustments require superadmin' },
      { status: 403 },
    );
  }

  const affiliate = await prisma.affiliate.findUnique({
    where: { id: affiliateId },
    select: { id: true, status: true },
  });

  if (!affiliate) {
    return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
  }

  const signedAmount = direction === 'credit' ? amountCents : -amountCents;
  const eventId = `admin_adj_${randomUUID()}`;
  const availableAt = new Date(Date.now() + LEDGER_PENDING_DAYS * 24 * 60 * 60 * 1000);

  const entry = await prisma.commissionLedger.create({
    data: {
      eventId,
      eventType: 'ADMIN_ADJUSTMENT',
      affiliateId,
      amountCents: signedAmount,
      status: 'PENDING',
      availableAt,
      businessSubscriptionId: body.subscriptionId || null,
      meta: {
        adminId: guard.admin.user.id,
        reason,
        direction,
        orderId: body.orderId ?? null,
        createdBy: 'admin',
      },
    },
  });

  await logAdminAction(guard.admin.user.id, 'COMMISSION_ADJUSTMENT', {
    targetType: 'affiliate',
    targetId: affiliateId,
    newValue: { eventId, amountCents: signedAmount, direction },
    reason,
    meta: { ledgerId: entry.id },
  });

  return NextResponse.json({ ok: true, ledgerEntry: entry });
}
