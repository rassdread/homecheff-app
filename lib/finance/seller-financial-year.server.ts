/**
 * PHASE 8B — canonical seller financial year (Prisma loader).
 *
 * Loads authoritative commerce facts and hands them to the pure builder.
 * Contains no accounting maths of its own.
 *
 * Recognition source: Transaction rows written by lib/payments/seller-settlement.ts
 * at Stripe payment success (checkout.session.completed). Order rows are NOT the
 * recognition source — they exist before payment and their status is mutable.
 *
 * No take: cap. Pages through the full result set so a large seller-year is
 * complete rather than fast and wrong.
 */

import { prisma } from '@/lib/prisma';
import { STRIPE_SESSION_ID_PREFIX } from '@/lib/stripe';
import {
  buildSellerFinancialYear,
  orderIdFromTransactionId,
  utcYearBounds,
  type CourierDeliveryLegInput,
  type SellerFinancialYear,
  type SellerSaleLegInput,
} from '@/lib/finance/seller-financial-year';

const PAGE_SIZE = 500;

/**
 * Delivery legs are couriering income, not selling income. They are written by
 * the webhook and lib/delivery/delivery-payout.ts with this id prefix.
 */
const DELIVERY_TRANSACTION_PREFIX = 'txn_delivery_';

function isDeliveryTransaction(id: string): boolean {
  return id.startsWith(DELIVERY_TRANSACTION_PREFIX);
}

/**
 * Settlement stores the Checkout Session id in Transaction.providerRef, so a
 * test-mode sale is identifiable and must never appear in live figures. Rows
 * without a session reference predate marketplace checkout and are kept.
 */
function belongsToCurrentStripeMode(providerRef: string | null): boolean {
  if (!providerRef || !providerRef.startsWith('cs_')) return true;
  return providerRef.startsWith(STRIPE_SESSION_ID_PREFIX);
}

type TransactionRow = {
  id: string;
  amountCents: number;
  platformFeeBps: number;
  status: string;
  createdAt: Date;
  providerRef: string | null;
  Refund: Array<{ id: string; amountCents: number; createdAt: Date }>;
};

/**
 * All transactions that can affect the requested year: those created in the
 * year, plus any from other years carrying a refund dated in the year.
 * Paged to completion — deterministic ordering by id.
 */
async function loadRelevantTransactions(
  sellerUserId: string,
  year: number,
): Promise<TransactionRow[]> {
  const { start, end } = utcYearBounds(year);
  const rows: TransactionRow[] = [];
  let cursor: string | null = null;

  for (;;) {
    const page: TransactionRow[] = await prisma.transaction.findMany({
      where: {
        sellerId: sellerUserId,
        OR: [
          { createdAt: { gte: start, lt: end } },
          { Refund: { some: { createdAt: { gte: start, lt: end } } } },
        ],
      },
      select: {
        id: true,
        amountCents: true,
        platformFeeBps: true,
        status: true,
        createdAt: true,
        providerRef: true,
        Refund: { select: { id: true, amountCents: true, createdAt: true } },
      },
      orderBy: { id: 'asc' },
      take: PAGE_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    cursor = page[page.length - 1].id;
  }

  return rows;
}

/**
 * HC-settled orders never reach Stripe Connect settlement, so they produce no
 * Transaction row (see seller-settlement.ts HC_ONLY_CONNECT_FORBIDDEN). Their
 * seller entitlement lives in the immutable per-order settlement exposure.
 */
async function loadHcSettlementLegs(
  sellerUserId: string,
  year: number,
): Promise<SellerSaleLegInput[]> {
  const { start, end } = utcYearBounds(year);
  const rows = await prisma.marketplaceHcSettlementExposure.findMany({
    where: {
      sellerUserId,
      createdAt: { gte: start, lt: end },
      status: { notIn: ['VOID', 'REVERSED'] },
    },
    select: {
      id: true,
      orderId: true,
      sellerGrossEntitlementCents: true,
      theoreticalPlatformFeeCents: true,
      grossOrderCents: true,
      effectiveSellerFeeBps: true,
      createdAt: true,
      status: true,
    },
    orderBy: { id: 'asc' },
  });

  return rows.map((row) => ({
    transactionId: `hc_exposure_${row.id}`,
    orderId: row.orderId,
    sellerGrossCents: row.sellerGrossEntitlementCents,
    platformFeeBps:
      row.effectiveSellerFeeBps ??
      (row.grossOrderCents > 0
        ? Math.round(
            (row.theoreticalPlatformFeeCents * 10_000) / row.grossOrderCents,
          )
        : 0),
    // PENDING entitlement is not yet earned, so it is passed through rather
    // than normalised to CAPTURED; the builder discloses it and withholds it.
    status: row.status === 'PENDING' ? 'PENDING' : 'CAPTURED',
    occurredAt: row.createdAt,
    source: 'HC_SETTLEMENT' as const,
    currency: null,
    refunds: [],
  }));
}

export type DeriveSellerFinancialYearOptions = {
  /** Omit HC pilot settlements (used by DAC7 parity fixtures). */
  includeHcSettlements?: boolean;
};

/**
 * Canonical entry point. Jurisdiction-neutral, year-scoped, idempotent.
 * Historical 2026 stays 2026 when viewed in 2027: nothing here reads a clock
 * or the seller's current subscription tier.
 */
export async function deriveSellerFinancialYear(
  sellerUserId: string,
  year: number,
  options: DeriveSellerFinancialYearOptions = {},
): Promise<SellerFinancialYear> {
  const includeHc = options.includeHcSettlements ?? true;
  const transactions = await loadRelevantTransactions(sellerUserId, year);

  const legs: SellerSaleLegInput[] = [];
  const courierLegs: CourierDeliveryLegInput[] = [];

  for (const row of transactions) {
    if (!belongsToCurrentStripeMode(row.providerRef)) continue;

    if (isDeliveryTransaction(row.id)) {
      courierLegs.push({
        transactionId: row.id,
        grossFeeCents: row.amountCents,
        platformFeeBps: row.platformFeeBps,
        occurredAt: row.createdAt,
      });
      continue;
    }

    legs.push({
      transactionId: row.id,
      orderId: orderIdFromTransactionId(row.id),
      sellerGrossCents: row.amountCents,
      platformFeeBps: row.platformFeeBps,
      status: row.status,
      occurredAt: row.createdAt,
      source: 'STRIPE_TRANSACTION',
      currency: null,
      refunds: row.Refund.map((r) => ({
        refundId: r.id,
        amountCents: r.amountCents,
        occurredAt: r.createdAt,
      })),
    });
  }

  if (includeHc) {
    legs.push(...(await loadHcSettlementLegs(sellerUserId, year)));
  }

  return buildSellerFinancialYear({
    sellerUserId,
    year,
    legs,
    courierLegs,
  });
}

