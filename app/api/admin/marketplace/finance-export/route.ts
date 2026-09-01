import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  normalizeMarketplaceOrderFinance,
  platformFeeFromBps,
  toFinanceExportRow,
  type TransactionFinanceLeg,
} from '@/lib/marketplace/finance/order-financial-normalization';

export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });
    if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limitRaw = parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), MAX_LIMIT)
      : DEFAULT_LIMIT;
    const since = searchParams.get('since');
    const until = searchParams.get('until');

    const createdAtFilter: { gte?: Date; lte?: Date } = {};
    if (since) {
      const d = new Date(since);
      if (!Number.isNaN(d.getTime())) createdAtFilter.gte = d;
    }
    if (until) {
      const d = new Date(until);
      if (!Number.isNaN(d.getTime())) createdAtFilter.lte = d;
    }

    const orders = await prisma.order.findMany({
      where: {
        stripeSessionId: { not: null },
        paymentMethod: 'EUR_STRIPE',
        NOT: { orderNumber: { startsWith: 'SUB-' } },
        ...(Object.keys(createdAtFilter).length ? { createdAt: createdAtFilter } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        totalAmount: true,
        stripeSessionId: true,
      },
    });

    const sessionIds = orders
      .map((o) => o.stripeSessionId)
      .filter((id): id is string => Boolean(id));

    const transactions = sessionIds.length
      ? await prisma.transaction.findMany({
          where: {
            providerRef: { in: sessionIds },
            status: 'CAPTURED',
          },
          select: {
            id: true,
            sellerId: true,
            amountCents: true,
            platformFeeBps: true,
            status: true,
            providerRef: true,
          },
        })
      : [];

    const payouts = transactions.length
      ? await prisma.payout.findMany({
          where: { transactionId: { in: transactions.map((t) => t.id) } },
          select: { transactionId: true, amountCents: true },
        })
      : [];

    const payoutByTx = new Map(payouts.map((p) => [p.transactionId, p.amountCents]));

    const refunds = sessionIds.length
      ? await prisma.refund.findMany({
          where: {
            Transaction: { providerRef: { in: sessionIds } },
          },
          select: {
            amountCents: true,
            Transaction: { select: { providerRef: true } },
          },
        })
      : [];

    const refundBySession = new Map<string, number>();
    for (const refund of refunds) {
      const ref = refund.Transaction?.providerRef;
      if (!ref) continue;
      refundBySession.set(ref, (refundBySession.get(ref) ?? 0) + refund.amountCents);
    }

    const txBySession = new Map<string, typeof transactions>();
    for (const tx of transactions) {
      const ref = tx.providerRef;
      if (!ref) continue;
      const list = txBySession.get(ref) ?? [];
      list.push(tx);
      txBySession.set(ref, list);
    }

    const rows = orders.map((order) => {
      const sessionTx = txBySession.get(order.stripeSessionId!) ?? [];
      const sellerLegs: TransactionFinanceLeg[] = sessionTx.map((tx) => {
        const platformFeeCents = platformFeeFromBps(tx.amountCents, tx.platformFeeBps);
        const sellerPayoutCents = payoutByTx.get(tx.id) ?? tx.amountCents - platformFeeCents;
        return {
          transactionId: tx.id,
          sellerId: tx.sellerId,
          amountCents: tx.amountCents,
          platformFeeBps: tx.platformFeeBps,
          platformFeeCents,
          sellerPayoutCents,
          status: tx.status,
        };
      });

      const normalized = normalizeMarketplaceOrderFinance({
        orderId: order.id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        paidAt: order.createdAt,
        stripeSessionId: order.stripeSessionId,
        totalAmount: order.totalAmount,
        sellerLegs,
        refundSummary: {
          refundedCents: refundBySession.get(order.stripeSessionId!) ?? 0,
          chargebackCents: 0,
        },
      });

      return toFinanceExportRow(normalized);
    });

    return NextResponse.json({
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      count: rows.length,
      vatStatus: 'UNKNOWN_PENDING_Q3',
      rows,
    });
  } catch (error) {
    console.error('[marketplace/finance-export]', error);
    return NextResponse.json({ error: 'Failed to build finance export' }, { status: 500 });
  }
}
