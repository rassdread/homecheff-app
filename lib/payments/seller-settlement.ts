/**
 * Idempotent marketplace seller settlement (separate charges & transfers).
 * Destination = seller User.stripeConnectAccountId only — never platform bank fallback.
 */

import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { getBusinessVisibilityProfile } from '@/lib/business/visibility-profile';
import { calculatePlatformFeeCents } from '@/lib/fees';
import { assertSourceChargeAllocationCapacity } from '@/lib/payments/payment-waterfall';

export const PAYOUT_PROVIDER_REF_PENDING = 'pending_transfer';
export const PAYOUT_PROVIDER_REF_FAILED_PREFIX = 'failed_';
export const PAYOUT_PROVIDER_REF_TRANSFER_PREFIX = 'tr_';

export function sellerTransactionId(orderId: string, productId: string): string {
  return `txn_${orderId}_${productId}`;
}

export function sellerPayoutId(orderId: string, productId: string): string {
  return `payout_seller_${orderId}_${productId}`;
}

export function sellerTransferIdempotencyKey(
  orderId: string,
  productId: string,
  sourceTransactionChargeId?: string | null,
): string {
  // Include charge id when funding via source_transaction so a prior
  // insufficient-funds failure (cached under the legacy key) cannot block retry.
  if (sourceTransactionChargeId) {
    return `hc_seller_xfer_${orderId}_${productId}_stx_${sourceTransactionChargeId}`;
  }
  return `hc_seller_xfer_${orderId}_${productId}`;
}

export function isSuccessfulTransferRef(
  providerRef: string | null | undefined,
): boolean {
  return Boolean(
    providerRef &&
      providerRef.startsWith(PAYOUT_PROVIDER_REF_TRANSFER_PREFIX) &&
      !providerRef.startsWith(PAYOUT_PROVIDER_REF_FAILED_PREFIX),
  );
}

export function isFailedTransferRef(
  providerRef: string | null | undefined,
): boolean {
  return Boolean(providerRef?.startsWith(PAYOUT_PROVIDER_REF_FAILED_PREFIX));
}

/**
 * Resolve the Stripe Charge object id (ch_… / py_…) for a Checkout Session.
 * source_transaction requires the Charge — never PI or Session ids.
 */
export async function resolveChargeIdForCheckoutSession(
  stripe: Stripe,
  checkoutSessionId: string,
): Promise<{
  chargeId: string | null;
  paymentIntentId: string | null;
  charge: Stripe.Charge | null;
}> {
  const session = await stripe.checkout.sessions.retrieve(checkoutSessionId, {
    expand: ['payment_intent.latest_charge'],
  });
  const pi = session.payment_intent;
  if (!pi || typeof pi === 'string') {
    const paymentIntentId = typeof pi === 'string' ? pi : null;
    if (!paymentIntentId) {
      return { chargeId: null, paymentIntentId: null, charge: null };
    }
    const fullPi = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['latest_charge'],
    });
    const charge = fullPi.latest_charge;
    if (charge && typeof charge === 'object') {
      return { chargeId: charge.id, paymentIntentId: fullPi.id, charge };
    }
    return {
      chargeId: typeof charge === 'string' ? charge : null,
      paymentIntentId: fullPi.id,
      charge: null,
    };
  }
  const charge = pi.latest_charge;
  if (charge && typeof charge === 'object') {
    return { chargeId: charge.id, paymentIntentId: pi.id, charge };
  }
  return {
    chargeId: typeof charge === 'string' ? charge : null,
    paymentIntentId: pi.id,
    charge: null,
  };
}

export function isEligibleSourceCharge(
  charge: Stripe.Charge | null | undefined,
): charge is Stripe.Charge {
  if (!charge) return false;
  return (
    charge.paid === true &&
    charge.status === 'succeeded' &&
    charge.refunded !== true &&
    charge.disputed !== true
  );
}

export type SellerSettlementInput = {
  orderId: string;
  productId: string;
  buyerId: string;
  sellerUserId: string;
  /** Seller consideration (item price × qty), not buyer gross */
  sellerGrossCents: number;
  /** Optional charge/session ref stored on Transaction.providerRef */
  chargeProviderRef?: string | null;
  deliveryMode?: string | null;
  /** When true, create escrow and skip immediate Stripe transfer */
  holdInEscrow?: boolean;
  /**
   * Stripe Charge id (ch_/py_) for source_transaction funding.
   * Required for immediate marketplace transfers while funds may be pending.
   */
  sourceTransactionChargeId?: string | null;
};

export type SellerSettlementResult = {
  productId: string;
  sellerUserId: string;
  sellerGrossCents: number;
  platformFeeBps: number;
  platformFeeCents: number;
  sellerNetCents: number;
  transactionId: string;
  payoutId: string;
  status:
    | 'TRANSFER_SUCCEEDED'
    | 'TRANSFER_PENDING'
    | 'TRANSFER_FAILED'
    | 'ESCROW_HELD'
    | 'SKIPPED_ZERO'
    | 'CONNECT_NOT_READY';
  transferId: string | null;
  error?: string;
};

export async function resolvePlatformFeeBps(sellerUserId: string): Promise<number> {
  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId: sellerUserId },
    include: { Subscription: true },
  });
  const visibility = getBusinessVisibilityProfile({
    subscriptionId: sellerProfile?.subscriptionId,
    subscriptionValidUntil: sellerProfile?.subscriptionValidUntil,
    Subscription: sellerProfile?.Subscription,
  });
  return Math.round(visibility.feePercent * 100);
}

/**
 * Persist obligation + attempt Stripe transfer. Safe to call repeatedly.
 * Does not create Orders. Does not fall back to platform Connect/bank.
 */
export async function settleSellerOrderItem(
  stripe: Stripe,
  input: SellerSettlementInput,
): Promise<SellerSettlementResult> {
  const {
    orderId,
    productId,
    buyerId,
    sellerUserId,
    sellerGrossCents,
    chargeProviderRef,
    holdInEscrow,
    sourceTransactionChargeId,
  } = input;

  const orderPayment = await prisma.order.findUnique({
    where: { id: orderId },
    select: { paymentMethod: true },
  });
  if (orderPayment?.paymentMethod === 'HC_ONLY') {
    return {
      productId,
      sellerUserId,
      sellerGrossCents,
      platformFeeBps: 0,
      platformFeeCents: 0,
      sellerNetCents: 0,
      transactionId: sellerTransactionId(orderId, productId),
      payoutId: sellerPayoutId(orderId, productId),
      status: 'SKIPPED_ZERO',
      transferId: null,
      error: 'HC_ONLY_CONNECT_FORBIDDEN',
    };
  }

  const transactionId = sellerTransactionId(orderId, productId);
  const payoutId = sellerPayoutId(orderId, productId);
  const platformFeeBps = await resolvePlatformFeeBps(sellerUserId);
  const platformFeePercent = platformFeeBps / 100;
  const platformFeeCents = calculatePlatformFeeCents(
    sellerGrossCents,
    platformFeePercent,
  );
  const sellerNetCents = Math.max(0, sellerGrossCents - platformFeeCents);

  if (sellerGrossCents <= 0 || sellerNetCents <= 0) {
    return {
      productId,
      sellerUserId,
      sellerGrossCents,
      platformFeeBps,
      platformFeeCents,
      sellerNetCents,
      transactionId,
      payoutId,
      status: 'SKIPPED_ZERO',
      transferId: null,
    };
  }

  const seller = await prisma.user.findUnique({
    where: { id: sellerUserId },
    select: {
      id: true,
      stripeConnectAccountId: true,
      stripeConnectOnboardingCompleted: true,
    },
  });

  const destination = seller?.stripeConnectAccountId?.trim() || null;
  const connectReady = Boolean(
    destination && seller?.stripeConnectOnboardingCompleted,
  );

  let transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { Payout: true },
  });

  if (!transaction) {
    transaction = await prisma.transaction.create({
      data: {
        id: transactionId,
        // Marketplace checkout has no Reservation — reservationId is optional.
        buyerId,
        sellerId: sellerUserId,
        amountCents: sellerGrossCents,
        platformFeeBps,
        status: 'CAPTURED',
        provider: 'STRIPE',
        providerRef: chargeProviderRef ?? null,
        updatedAt: new Date(),
      },
      include: { Payout: true },
    });
  }

  let payout = transaction.Payout.find((p) => p.id === payoutId) ?? null;
  if (!payout) {
    payout =
      transaction.Payout.find((p) => p.toUserId === sellerUserId) ?? null;
  }

  if (payout && isSuccessfulTransferRef(payout.providerRef)) {
    return {
      productId,
      sellerUserId,
      sellerGrossCents,
      platformFeeBps,
      platformFeeCents,
      sellerNetCents: payout.amountCents,
      transactionId,
      payoutId: payout.id,
      status: 'TRANSFER_SUCCEEDED',
      transferId: payout.providerRef,
    };
  }

  if (holdInEscrow) {
    const existingEscrow = await prisma.paymentEscrow.findFirst({
      where: { orderId, sellerId: sellerUserId },
    });
    if (!existingEscrow) {
      await prisma.paymentEscrow.create({
        data: {
          orderId,
          sellerId: sellerUserId,
          amountCents: sellerNetCents,
          payoutTrigger: 'DELIVERED',
          currentStatus: 'held',
        },
      });
    }
    if (!payout) {
      payout = await prisma.payout.create({
        data: {
          id: payoutId,
          transactionId,
          toUserId: sellerUserId,
          amountCents: sellerNetCents,
          providerRef: null,
        },
      });
    }
    return {
      productId,
      sellerUserId,
      sellerGrossCents,
      platformFeeBps,
      platformFeeCents,
      sellerNetCents,
      transactionId,
      payoutId: payout.id,
      status: 'ESCROW_HELD',
      transferId: null,
    };
  }

  if (!payout) {
    payout = await prisma.payout.create({
      data: {
        id: payoutId,
        transactionId,
        toUserId: sellerUserId,
        amountCents: sellerNetCents,
        providerRef: PAYOUT_PROVIDER_REF_PENDING,
      },
    });
  } else if (
    payout.amountCents !== sellerNetCents ||
    !payout.providerRef ||
    isFailedTransferRef(payout.providerRef)
  ) {
    // Keep amount aligned; leave failed/pending for retry.
    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        amountCents: sellerNetCents,
        providerRef: isSuccessfulTransferRef(payout.providerRef)
          ? payout.providerRef
          : PAYOUT_PROVIDER_REF_PENDING,
      },
    });
    payout = await prisma.payout.findUniqueOrThrow({ where: { id: payout.id } });
  }

  if (!connectReady || !destination) {
    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        providerRef: `${PAYOUT_PROVIDER_REF_FAILED_PREFIX}connect_not_ready_${Date.now()}`,
      },
    });
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: 'FAILED', updatedAt: new Date() },
    });
    return {
      productId,
      sellerUserId,
      sellerGrossCents,
      platformFeeBps,
      platformFeeCents,
      sellerNetCents,
      transactionId,
      payoutId: payout.id,
      status: 'CONNECT_NOT_READY',
      transferId: null,
      error: 'Seller Connect not ready',
    };
  }

  // Never fall back to platform / admin / buyer Connect.
  if (destination === process.env.STRIPE_PLATFORM_ACCOUNT_ID) {
    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        providerRef: `${PAYOUT_PROVIDER_REF_FAILED_PREFIX}platform_fallback_blocked_${Date.now()}`,
      },
    });
    return {
      productId,
      sellerUserId,
      sellerGrossCents,
      platformFeeBps,
      platformFeeCents,
      sellerNetCents,
      transactionId,
      payoutId: payout.id,
      status: 'TRANSFER_FAILED',
      transferId: null,
      error: 'Refused platform account fallback',
    };
  }

  // Immediate marketplace transfers must fund from the originating Charge while
  // proceeds may still be pending (Stripe Separate Charges and Transfers).
  // Docs: https://docs.stripe.com/connect/separate-charges-and-transfers
  if (!holdInEscrow && !sourceTransactionChargeId) {
    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        providerRef: `${PAYOUT_PROVIDER_REF_FAILED_PREFIX}missing_source_charge_${Date.now()}`,
      },
    });
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: 'FAILED', updatedAt: new Date() },
    });
    return {
      productId,
      sellerUserId,
      sellerGrossCents,
      platformFeeBps,
      platformFeeCents,
      sellerNetCents,
      transactionId,
      payoutId: payout.id,
      status: 'TRANSFER_FAILED',
      transferId: null,
      error: 'Missing source_transaction Charge id',
    };
  }

  try {
    const transferParams: Stripe.TransferCreateParams = {
      amount: sellerNetCents,
      currency: 'eur',
      destination,
      transfer_group: `order_${orderId}`,
      metadata: {
        orderId,
        productId,
        sellerId: sellerUserId,
        platformFeeCents: String(platformFeeCents),
        platformFeeBps: String(platformFeeBps),
        sellerGrossCents: String(sellerGrossCents),
        sourceTransactionChargeId: sourceTransactionChargeId || '',
        homecheff_app: 'true',
      },
    };
    if (sourceTransactionChargeId) {
      transferParams.source_transaction = sourceTransactionChargeId;
    }

    const transfer = await stripe.transfers.create(transferParams, {
      idempotencyKey: sellerTransferIdempotencyKey(
        orderId,
        productId,
        sourceTransactionChargeId,
      ),
    });

    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        providerRef: transfer.id,
        destinationConnectAccountId: destination,
      },
    });
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: 'CAPTURED', updatedAt: new Date() },
    });

    return {
      productId,
      sellerUserId,
      sellerGrossCents,
      platformFeeBps,
      platformFeeCents,
      sellerNetCents,
      transactionId,
      payoutId: payout.id,
      status: 'TRANSFER_SUCCEEDED',
      transferId: transfer.id,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'transfer_failed';
    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        providerRef: `${PAYOUT_PROVIDER_REF_FAILED_PREFIX}${Date.now()}`,
      },
    });
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: 'FAILED', updatedAt: new Date() },
    });
    console.error(
      `[seller-settlement] transfer failed order=${orderId} product=${productId}:`,
      message,
    );
    return {
      productId,
      sellerUserId,
      sellerGrossCents,
      platformFeeBps,
      platformFeeCents,
      sellerNetCents,
      transactionId,
      payoutId: payout.id,
      status: 'TRANSFER_FAILED',
      transferId: null,
      error: message,
    };
  }
}

export type OrderSettlementCompleteness = {
  complete: boolean;
  orderId: string;
  expectedSellerLegs: number;
  succeededLegs: number;
  pendingOrFailedLegs: number;
  results: SellerSettlementResult[];
};

/**
 * Settle all non-shipping seller legs for an existing Order from OrderItems.
 * Idempotent. Resolves Charge id from Checkout Session for source_transaction.
 */
export async function settleAllSellerLegsForOrder(
  stripe: Stripe,
  orderId: string,
  opts?: {
    chargeProviderRef?: string | null;
    sourceTransactionChargeId?: string | null;
  },
): Promise<OrderSettlementCompleteness> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          Product: {
            include: {
              seller: {
                include: {
                  User: {
                    select: {
                      id: true,
                      stripeConnectAccountId: true,
                      stripeConnectOnboardingCompleted: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!order) {
    return {
      complete: false,
      orderId,
      expectedSellerLegs: 0,
      succeededLegs: 0,
      pendingOrFailedLegs: 0,
      results: [],
    };
  }

  let sourceTransactionChargeId = opts?.sourceTransactionChargeId ?? null;
  if (!sourceTransactionChargeId && order.stripeSessionId) {
    const resolved = await resolveChargeIdForCheckoutSession(
      stripe,
      order.stripeSessionId,
    );
    if (resolved.charge && isEligibleSourceCharge(resolved.charge)) {
      sourceTransactionChargeId = resolved.chargeId;
    } else if (resolved.chargeId) {
      // Charge id present but not expanded — still usable as source_transaction
      sourceTransactionChargeId = resolved.chargeId;
    }
  }

  const isShipping = order.deliveryMode === 'SHIPPING';
  const results: SellerSettlementResult[] = [];

  // Pre-flight: plan seller nets and assert source Charge capacity (multi-seller)
  if (!isShipping && sourceTransactionChargeId) {
    let plannedNet = 0;
    let alreadyTransferred = 0;
    for (const item of order.items) {
      const sellerUserId = item.Product?.seller?.User?.id;
      if (!sellerUserId) continue;
      const sellerGrossCents = item.priceCents * item.quantity;
      const bps = await resolvePlatformFeeBps(sellerUserId);
      const fee = calculatePlatformFeeCents(sellerGrossCents, bps / 100);
      const net = Math.max(0, sellerGrossCents - fee);
      const existingPayout = await prisma.payout.findUnique({
        where: { id: sellerPayoutId(orderId, item.productId) },
      });
      if (isSuccessfulTransferRef(existingPayout?.providerRef)) {
        alreadyTransferred += existingPayout!.amountCents;
      } else {
        plannedNet += net;
      }
    }

    let chargeAmountCents: number | null = null;
    try {
      const charge = await stripe.charges.retrieve(sourceTransactionChargeId);
      chargeAmountCents = charge.amount;
    } catch {
      /* capacity soft-skip if charge unreadable */
    }

    if (chargeAmountCents != null) {
      const cap = assertSourceChargeAllocationCapacity({
        chargeAmountCents,
        plannedTransferCents: plannedNet,
        alreadyTransferredCents: alreadyTransferred,
      });
      if (!cap.ok) {
        console.error(
          `[seller-settlement] OVER_ALLOCATION order=${orderId}: ${cap.error}`,
        );
        return {
          complete: false,
          orderId,
          expectedSellerLegs: order.items.length,
          succeededLegs: 0,
          pendingOrFailedLegs: order.items.length,
          results: [],
        };
      }
    }
  }

  for (const item of order.items) {
    const sellerUserId = item.Product?.seller?.User?.id;
    if (!sellerUserId) continue;
    const sellerGrossCents = item.priceCents * item.quantity;
    const result = await settleSellerOrderItem(stripe, {
      orderId,
      productId: item.productId,
      buyerId: order.userId,
      sellerUserId,
      sellerGrossCents,
      chargeProviderRef: opts?.chargeProviderRef ?? order.stripeSessionId,
      holdInEscrow: isShipping,
      sourceTransactionChargeId: isShipping
        ? null
        : sourceTransactionChargeId,
    });
    results.push(result);
  }

  const expectedSellerLegs = results.filter((r) => r.status !== 'SKIPPED_ZERO')
    .length;
  const succeededLegs = results.filter(
    (r) =>
      r.status === 'TRANSFER_SUCCEEDED' || r.status === 'ESCROW_HELD',
  ).length;
  const pendingOrFailedLegs = results.filter(
    (r) =>
      r.status === 'TRANSFER_FAILED' ||
      r.status === 'TRANSFER_PENDING' ||
      r.status === 'CONNECT_NOT_READY',
  ).length;

  const complete =
    expectedSellerLegs === 0 ||
    (succeededLegs === expectedSellerLegs && pendingOrFailedLegs === 0);

  return {
    complete,
    orderId,
    expectedSellerLegs,
    succeededLegs,
    pendingOrFailedLegs,
    results,
  };
}
