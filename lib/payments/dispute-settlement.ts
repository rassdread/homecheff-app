/**
 * Canonical dispute / chargeback financial settlement for SCT marketplace.
 *
 * Reuses recipient-reversal primitives from refund path.
 * Does NOT treat chargebacks as ordinary Refunds — durable DisputeSettlement.
 *
 * Official Stripe (audited 2026-08-16):
 * - SCT: platform debited for dispute amount + fees
 * - source_transaction / transfer_group do NOT auto-reverse transfers
 * - Recover via transfers.createReversal
 * - https://docs.stripe.com/connect/disputes
 * - https://docs.stripe.com/connect/charges
 * - NL dispute received fee €20 (stripe.com/en-nl/pricing) — non-refundable if lost;
 *   countered fee €20 returned if won (official pricing page)
 *
 * Recovery trigger (TECHNICAL default aligned with Stripe recommendation):
 *   ON_DISPUTE_CREATED → attempt recipient recovery
 * POLICY_REQUIRED: counsel may prefer wait-until-lost for cross-border repay risk.
 *
 * dryRun / plan-only never mutates Stripe.
 */

import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import {
  allocateDisputeAcrossSellerLegs,
  cumulativeProportionalReversalCents,
  loadSellerTransferLegsForOrder,
  reverseRecipientTransfer,
  sellerReversalIdempotencyKey,
} from '@/lib/payments/recipient-reversal';
import { calculateStripeFeeForBuyer } from '@/lib/fees';

export const DISPUTE_SETTLEMENT_SCHEMA_VERSION = 1;

/** Official NL list price — store actual Stripe BT when available; do not invent. */
export const STRIPE_NL_DISPUTE_RECEIVED_FEE_CENTS_LIST = 2000;
export const STRIPE_NL_DISPUTE_COUNTERED_FEE_CENTS_LIST = 2000;

export type DisputeFinancialStatus =
  | 'OPEN'
  | 'FUNDS_WITHDRAWN'
  | 'RECIPIENT_RECOVERY_PENDING'
  | 'RECIPIENT_RECOVERED'
  | 'EVIDENCE_REQUIRED'
  | 'UNDER_REVIEW'
  | 'WON'
  | 'LOST'
  | 'FUNDS_REINSTATED'
  | 'NEEDS_ATTENTION'
  | 'CLOSED';

export type DisputeRecoveryTriggerPolicy =
  | 'ON_DISPUTE_CREATED'
  | 'ON_FUNDS_WITHDRAWN'
  | 'ON_DISPUTE_LOST'
  | 'MANUAL_ONLY';

/** Stripe-recommended default for SCT platforms */
export const DEFAULT_DISPUTE_RECOVERY_TRIGGER: DisputeRecoveryTriggerPolicy =
  'ON_DISPUTE_CREATED';

export type DisputePlan = {
  schemaVersion: number;
  orderId: string | null;
  stripeDisputeId: string;
  chargeId: string | null;
  paymentIntentId: string | null;
  disputeAmountCents: number;
  currency: string;
  stripeStatus: string;
  reason: string | null;
  evidenceDueBy: string | null;
  originalBuyerGrossCents: number;
  originalSellerTransferCents: number;
  alreadyReversedSellerCents: number;
  sellerRecoveryCents: number;
  affiliateRecoveryCents: number;
  courierRecoveryCents: number;
  platformFeeAtRiskCents: number;
  stripeDisputeFeeCentsEstimated: number;
  platformExposureCents: number;
  recipientOutstandingCents: number;
  sellerLegs: Array<{
    productId: string;
    transferId: string | null;
    transferCents: number;
    alreadyReversedCents: number;
    remainingReversibleCents: number;
    considerationAllocatedCents: number;
    recoveryCents: number;
    idempotencyKey: string;
  }>;
  policyFlags: string[];
  warnings: string[];
  reconciliation: {
    BUYER_ORIGINAL_GROSS: number;
    STRIPE_PAYMENT_FEE_EST: number;
    SELLER_GROSS: number;
    PLATFORM_FEE: number;
    SELLER_TRANSFER: number;
    AFFILIATE_TRANSFER: number;
    COURIER_TRANSFER: number;
    DISPUTE_AMOUNT: number;
    STRIPE_DISPUTE_FEE_EST: number;
    SELLER_RECOVERY: number;
    AFFILIATE_RECOVERY: number;
    COURIER_RECOVERY: number;
    PLATFORM_EXPOSURE: number;
    RECIPIENT_OUTSTANDING: number;
    FUNDS_REINSTATED_IF_WON: number;
    UNRECONCILED: number;
  };
};

export async function resolveOrderIdFromCharge(
  stripe: Stripe,
  chargeId: string,
): Promise<{
  orderId: string | null;
  paymentIntentId: string | null;
  chargeAmount: number;
}> {
  const charge = await stripe.charges.retrieve(chargeId);
  let orderId: string | null =
    typeof charge.metadata?.orderId === 'string' && charge.metadata.orderId
      ? charge.metadata.orderId
      : null;
  const paymentIntentId =
    typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent?.id || null;

  if (!orderId && paymentIntentId) {
    const sessions = await stripe.checkout.sessions.list({
      payment_intent: paymentIntentId,
      limit: 1,
    });
    const sessionId = sessions.data[0]?.id;
    if (sessionId) {
      const order = await prisma.order.findFirst({
        where: { stripeSessionId: sessionId },
        select: { id: true },
      });
      orderId = order?.id ?? null;
    }
  }

  return { orderId, paymentIntentId, chargeAmount: charge.amount };
}

/**
 * Read-only dispute recovery plan for an order + dispute amount.
 */
export async function planDisputeRecovery(args: {
  orderId: string;
  stripeDisputeId: string;
  disputeAmountCents: number;
  chargeId?: string | null;
  paymentIntentId?: string | null;
  stripeStatus?: string;
  reason?: string | null;
  evidenceDueBy?: string | null;
  currency?: string;
  stripeAmountReversedByTransferId?: Record<string, number>;
}): Promise<DisputePlan> {
  const order = await prisma.order.findUnique({
    where: { id: args.orderId },
    select: { totalAmount: true },
  });
  if (!order) throw new Error(`Order not found: ${args.orderId}`);

  const legs = await loadSellerTransferLegsForOrder(args.orderId, {
    stripeAmountReversedByTransferId: args.stripeAmountReversedByTransferId,
  });

  const allocations = allocateDisputeAcrossSellerLegs({
    disputeAmountCents: args.disputeAmountCents,
    buyerGrossCents: order.totalAmount,
    legs: legs.map((l) => ({
      productId: l.productId,
      sellerGrossCents: l.sellerGrossCents,
    })),
  });

  const sellerLegs: DisputePlan['sellerLegs'] = [];
  let sellerRecovery = 0;
  let alreadyReversed = 0;
  let originalTransfer = 0;
  let sellerGross = 0;
  let platformFee = 0;

  for (const leg of legs) {
    originalTransfer += leg.transferCents;
    alreadyReversed += leg.alreadyReversedCents;
    sellerGross += leg.sellerGrossCents;
    platformFee += leg.platformFeeCents;

    const alloc = allocations.find((a) => a.productId === leg.productId);
    const consideration = alloc?.sellerConsiderationCents ?? 0;
    const recovery = cumulativeProportionalReversalCents({
      sellerGrossCents: leg.sellerGrossCents,
      transferCents: leg.transferCents,
      priorConsiderationRefundedCents: 0,
      // For disputes we treat allocated consideration as "this" request against
      // remaining capacity — alreadyReversed is applied inside the helper.
      thisConsiderationRefundCents: consideration,
      alreadyReversedCents: leg.alreadyReversedCents,
    });
    // When full dispute covers full gross but transfer already fully reversed,
    // recovery must be 0 (cumulative protection).
    const capped = Math.min(recovery, leg.remainingReversibleCents);

    sellerLegs.push({
      productId: leg.productId,
      transferId: leg.transferId,
      transferCents: leg.transferCents,
      alreadyReversedCents: leg.alreadyReversedCents,
      remainingReversibleCents: leg.remainingReversibleCents,
      considerationAllocatedCents: consideration,
      recoveryCents: capped,
      idempotencyKey: leg.transferId
        ? sellerReversalIdempotencyKey({
            source: 'DISPUTE',
            orderId: args.orderId,
            productId: leg.productId,
            transferId: leg.transferId,
            reversalCents: capped,
            sequenceHint: args.stripeDisputeId,
          })
        : `hc_dsp_tr_rev_skip_${args.orderId}_${leg.productId}`,
    });
    sellerRecovery += capped;
  }

  // Affiliate: ledger proportional (funded from platform fee) — estimate only
  const affiliateLedgers = await prisma.commissionLedger.findMany({
    where: {
      eventType: 'ORDER_PAID',
      status: { in: ['PENDING', 'AVAILABLE', 'PAID'] },
      meta: { path: ['orderId'], equals: args.orderId },
    },
    select: { amountCents: true },
  });
  const affiliateAccrued = affiliateLedgers
    .filter((l) => l.amountCents > 0)
    .reduce((s, l) => s + l.amountCents, 0);
  const affiliateRecovery =
    order.totalAmount > 0 && affiliateAccrued > 0
      ? Math.round(
          (affiliateAccrued * args.disputeAmountCents) / order.totalAmount,
        )
      : 0;

  const feeEst = calculateStripeFeeForBuyer(sellerGross).stripeFeeCents;
  const disputeFeeEst = STRIPE_NL_DISPUTE_RECEIVED_FEE_CENTS_LIST;
  // Platform exposure: dispute amount + dispute fee − recovered recipients
  const platformExposure =
    args.disputeAmountCents + disputeFeeEst - sellerRecovery - affiliateRecovery;

  const policyFlags = [
    'RECOVERY_TRIGGER: ON_DISPUTE_CREATED (Stripe Connect disputes docs recommendation)',
    'POLICY_REQUIRED: counsel may prefer recover-on-lost for cross-border retransfer risk',
    'PARTIAL_DISPUTE_ALLOCATION: proportional to seller gross — POLICY_REQUIRED if item-level Stripe mapping needed',
    'COURIER: POLICY_REQUIRED for performed-delivery clawback; engine capacity reserved',
    'SELLER_REPAYMENT_AFTER_WIN: POLICY_REQUIRED — state SELLER_REPAYMENT_DUE supported; auto-repay gated',
    'EVIDENCE_AUTO_UPLOAD: disabled — no private messages uploaded',
    'DISPUTE_FEE_NL: €20 received (list) from stripe.com/en-nl/pricing — store actual BT when known',
    'source_transaction does NOT auto-reverse transfers',
    'transfer_group does NOT auto-reverse transfers',
  ];

  const warnings: string[] = [];
  if (sellerRecovery === 0 && originalTransfer > 0 && alreadyReversed >= originalTransfer) {
    warnings.push(
      'Transfer already fully reversed (e.g. prior refund) — no additional seller recovery',
    );
  }
  if (sellerRecovery === 0 && originalTransfer > alreadyReversed && args.disputeAmountCents > 0) {
    warnings.push(
      'P0_EXPOSURE_IF_NO_RECOVERY: dispute without seller clawback capacity or transfer',
    );
  }

  return {
    schemaVersion: DISPUTE_SETTLEMENT_SCHEMA_VERSION,
    orderId: args.orderId,
    stripeDisputeId: args.stripeDisputeId,
    chargeId: args.chargeId ?? null,
    paymentIntentId: args.paymentIntentId ?? null,
    disputeAmountCents: args.disputeAmountCents,
    currency: args.currency ?? 'eur',
    stripeStatus: args.stripeStatus ?? 'needs_response',
    reason: args.reason ?? null,
    evidenceDueBy: args.evidenceDueBy ?? null,
    originalBuyerGrossCents: order.totalAmount,
    originalSellerTransferCents: originalTransfer,
    alreadyReversedSellerCents: alreadyReversed,
    sellerRecoveryCents: sellerRecovery,
    affiliateRecoveryCents: affiliateRecovery,
    courierRecoveryCents: 0,
    platformFeeAtRiskCents: platformFee,
    stripeDisputeFeeCentsEstimated: disputeFeeEst,
    platformExposureCents: platformExposure,
    recipientOutstandingCents: Math.max(
      0,
      originalTransfer - alreadyReversed - sellerRecovery,
    ),
    sellerLegs,
    policyFlags,
    warnings,
    reconciliation: {
      BUYER_ORIGINAL_GROSS: order.totalAmount,
      STRIPE_PAYMENT_FEE_EST: feeEst,
      SELLER_GROSS: sellerGross,
      PLATFORM_FEE: platformFee,
      SELLER_TRANSFER: originalTransfer,
      AFFILIATE_TRANSFER: affiliateAccrued,
      COURIER_TRANSFER: 0,
      DISPUTE_AMOUNT: args.disputeAmountCents,
      STRIPE_DISPUTE_FEE_EST: disputeFeeEst,
      SELLER_RECOVERY: sellerRecovery,
      AFFILIATE_RECOVERY: affiliateRecovery,
      COURIER_RECOVERY: 0,
      PLATFORM_EXPOSURE: platformExposure,
      RECIPIENT_OUTSTANDING: Math.max(
        0,
        originalTransfer - alreadyReversed - sellerRecovery,
      ),
      FUNDS_REINSTATED_IF_WON: 0,
      UNRECONCILED: 0,
    },
  };
}

export async function upsertDisputeSettlement(args: {
  plan: DisputePlan;
  financialStatus: DisputeFinancialStatus;
  stripeEventId?: string | null;
}): Promise<{ id: string; created: boolean }> {
  const existing = await prisma.disputeSettlement.findUnique({
    where: { stripeDisputeId: args.plan.stripeDisputeId },
  });
  if (existing) {
    await prisma.disputeSettlement.update({
      where: { id: existing.id },
      data: {
        stripeStatus: args.plan.stripeStatus,
        financialStatus: args.financialStatus,
        planJson: JSON.stringify(args.plan),
        evidenceDueBy: args.plan.evidenceDueBy
          ? new Date(args.plan.evidenceDueBy)
          : null,
        lastStripeEventId: args.stripeEventId ?? existing.lastStripeEventId,
        updatedAt: new Date(),
      },
    });
    return { id: existing.id, created: false };
  }

  const id = `dset_${args.plan.stripeDisputeId}`;
  await prisma.disputeSettlement.create({
    data: {
      id,
      stripeDisputeId: args.plan.stripeDisputeId,
      orderId: args.plan.orderId,
      chargeId: args.plan.chargeId,
      paymentIntentId: args.plan.paymentIntentId,
      amountCents: args.plan.disputeAmountCents,
      currency: args.plan.currency,
      reason: args.plan.reason,
      stripeStatus: args.plan.stripeStatus,
      financialStatus: args.financialStatus,
      evidenceDueBy: args.plan.evidenceDueBy
        ? new Date(args.plan.evidenceDueBy)
        : null,
      recoveredSellerCents: 0,
      recoveredAffiliateCents: 0,
      recoveredCourierCents: 0,
      outstandingSellerCents: args.plan.sellerRecoveryCents,
      planJson: JSON.stringify(args.plan),
      lastStripeEventId: args.stripeEventId ?? null,
    },
  });
  return { id, created: true };
}

export async function executeDisputeRecipientRecovery(args: {
  stripe: Stripe;
  plan: DisputePlan;
  disputeSettlementId: string;
  confirmLiveMutation: boolean;
}): Promise<{
  status: DisputeFinancialStatus;
  sellerReversals: Array<{
    productId: string;
    transferId: string | null;
    amountCents: number;
    reversalId: string | null;
    status: string;
    error?: string;
  }>;
  affiliate: { status: string; reversedCount?: number; error?: string };
  errors: string[];
}> {
  if (!args.confirmLiveMutation) {
    throw new Error(
      'executeDisputeRecipientRecovery refused: confirmLiveMutation must be true',
    );
  }

  const errors: string[] = [];
  const sellerReversals: Array<{
    productId: string;
    transferId: string | null;
    amountCents: number;
    reversalId: string | null;
    status: string;
    error?: string;
  }> = [];

  let recoveredSeller = 0;

  for (const leg of args.plan.sellerLegs) {
    if (!leg.transferId || leg.recoveryCents <= 0) {
      sellerReversals.push({
        productId: leg.productId,
        transferId: leg.transferId,
        amountCents: 0,
        reversalId: null,
        status: leg.recoveryCents <= 0 ? 'SKIPPED_ZERO' : 'SKIPPED_NO_TRANSFER',
      });
      continue;
    }

    const txnId = (
      await loadSellerTransferLegsForOrder(args.plan.orderId!)
    ).find((l) => l.productId === leg.productId)?.transactionId;

    const result = await reverseRecipientTransfer({
      stripe: args.stripe,
      transferId: leg.transferId,
      amountCents: leg.recoveryCents,
      idempotencyKey: leg.idempotencyKey,
      description: `HomeCheff dispute clawback ${args.plan.stripeDisputeId}`,
      metadata: {
        orderId: args.plan.orderId || '',
        productId: leg.productId,
        disputeId: args.plan.stripeDisputeId,
        source: 'DISPUTE',
        homecheff_app: 'true',
      },
      transactionId: txnId,
    });

    sellerReversals.push({
      productId: leg.productId,
      transferId: leg.transferId,
      amountCents: leg.recoveryCents,
      reversalId: result.reversalId,
      status: result.status,
      error: result.error,
    });

    if (result.status === 'SUCCEEDED' || result.status === 'ALREADY_DONE') {
      recoveredSeller += leg.recoveryCents;
    } else if (result.status === 'FAILED') {
      errors.push(
        `Seller recovery failed product=${leg.productId}: ${result.error}`,
      );
    }
  }

  let affiliate: { status: string; reversedCount?: number; error?: string } = {
    status: 'SKIPPED',
  };
  if (args.plan.affiliateRecoveryCents > 0 && args.plan.orderId) {
    try {
      const { processCommissionReversal } = await import(
        '@/lib/affiliate-commission'
      );
      const r = await processCommissionReversal({
        reversalEventId: args.plan.stripeDisputeId,
        eventType: 'CHARGEBACK',
        refundedAmountCents: args.plan.disputeAmountCents,
        chargeAmountCents: args.plan.originalBuyerGrossCents,
        orderId: args.plan.orderId,
      });
      affiliate = { status: 'SUCCEEDED', reversedCount: r.reversedCount };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`Affiliate reversal failed: ${message}`);
      affiliate = { status: 'FAILED', error: message };
    }
  }

  const status: DisputeFinancialStatus =
    errors.length === 0
      ? recoveredSeller > 0 || args.plan.sellerRecoveryCents === 0
        ? 'RECIPIENT_RECOVERED'
        : 'RECIPIENT_RECOVERY_PENDING'
      : 'NEEDS_ATTENTION';

  await prisma.disputeSettlement.update({
    where: { id: args.disputeSettlementId },
    data: {
      financialStatus: status,
      recoveredSellerCents: recoveredSeller,
      outstandingSellerCents: Math.max(
        0,
        args.plan.sellerRecoveryCents - recoveredSeller,
      ),
      recoveredAffiliateCents:
        affiliate.status === 'SUCCEEDED' ? args.plan.affiliateRecoveryCents : 0,
      resultJson: JSON.stringify({ sellerReversals, affiliate, errors }),
      lastError: errors[0] ?? null,
      updatedAt: new Date(),
    },
  });

  return { status, sellerReversals, affiliate, errors };
}

/**
 * Webhook entry: idempotent dispute lifecycle handling.
 * Returns whether Stripe should retry (ok=false → non-2xx recommended for hard failures after durable intent).
 */
export async function handleStripeDisputeEvent(args: {
  stripe: Stripe;
  event: Stripe.Event;
  /** When true, attempt transfer reversals (production default for real disputes) */
  autoRecover: boolean;
}): Promise<{ ok: boolean; message: string; plan?: DisputePlan }> {
  const type = args.event.type;
  if (
    type !== 'charge.dispute.created' &&
    type !== 'charge.dispute.updated' &&
    type !== 'charge.dispute.closed' &&
    type !== 'charge.dispute.funds_withdrawn' &&
    type !== 'charge.dispute.funds_reinstated'
  ) {
    return { ok: true, message: 'ignored_event' };
  }

  const dispute = args.event.data.object as Stripe.Dispute;
  const chargeId =
    typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;

  // Idempotency: skip if same event already applied
  const existing = await prisma.disputeSettlement.findUnique({
    where: { stripeDisputeId: dispute.id },
  });
  if (existing?.lastStripeEventId === args.event.id) {
    return { ok: true, message: 'duplicate_event_ignored' };
  }

  let orderId = existing?.orderId ?? null;
  let paymentIntentId = existing?.paymentIntentId ?? null;
  if (!orderId && chargeId) {
    const resolved = await resolveOrderIdFromCharge(args.stripe, chargeId);
    orderId = resolved.orderId;
    paymentIntentId = resolved.paymentIntentId;
  }

  if (!orderId) {
    // Persist orphan dispute for admin visibility
    await prisma.disputeSettlement.upsert({
      where: { stripeDisputeId: dispute.id },
      create: {
        id: `dset_${dispute.id}`,
        stripeDisputeId: dispute.id,
        orderId: null,
        chargeId: chargeId ?? null,
        paymentIntentId,
        amountCents: dispute.amount,
        currency: dispute.currency,
        reason: dispute.reason,
        stripeStatus: dispute.status,
        financialStatus: 'NEEDS_ATTENTION',
        lastError: 'order_not_resolved',
        lastStripeEventId: args.event.id,
        planJson: '{}',
      },
      update: {
        stripeStatus: dispute.status,
        lastStripeEventId: args.event.id,
        financialStatus: 'NEEDS_ATTENTION',
        lastError: 'order_not_resolved',
        updatedAt: new Date(),
      },
    });
    return { ok: true, message: 'order_unresolved_persisted' };
  }

  // Stripe amount_reversed for cumulative safety
  const legs = await loadSellerTransferLegsForOrder(orderId);
  const stripeReversed: Record<string, number> = {};
  for (const leg of legs) {
    if (!leg.transferId) continue;
    try {
      const tr = await args.stripe.transfers.retrieve(leg.transferId);
      stripeReversed[leg.transferId] = tr.amount_reversed;
    } catch {
      /* ignore */
    }
  }

  const evidenceDue =
    dispute.evidence_details?.due_by != null
      ? new Date(dispute.evidence_details.due_by * 1000).toISOString()
      : null;

  const plan = await planDisputeRecovery({
    orderId,
    stripeDisputeId: dispute.id,
    disputeAmountCents: dispute.amount,
    chargeId,
    paymentIntentId,
    stripeStatus: dispute.status,
    reason: dispute.reason,
    evidenceDueBy: evidenceDue,
    currency: dispute.currency,
    stripeAmountReversedByTransferId: stripeReversed,
  });

  let financialStatus: DisputeFinancialStatus = 'OPEN';
  if (type === 'charge.dispute.funds_withdrawn') financialStatus = 'FUNDS_WITHDRAWN';
  if (type === 'charge.dispute.funds_reinstated') financialStatus = 'FUNDS_REINSTATED';
  if (type === 'charge.dispute.closed') {
    if (dispute.status === 'won') financialStatus = 'WON';
    else if (dispute.status === 'lost') financialStatus = 'LOST';
    else financialStatus = 'CLOSED';
  }
  if (
    type === 'charge.dispute.created' ||
    type === 'charge.dispute.updated'
  ) {
    if (dispute.status === 'needs_response') financialStatus = 'EVIDENCE_REQUIRED';
    else if (dispute.status === 'under_review') financialStatus = 'UNDER_REVIEW';
    else financialStatus = 'OPEN';
  }

  const { id } = await upsertDisputeSettlement({
    plan,
    financialStatus,
    stripeEventId: args.event.id,
  });

  const shouldRecover =
    args.autoRecover &&
    (type === 'charge.dispute.created' ||
      type === 'charge.dispute.funds_withdrawn') &&
    plan.sellerRecoveryCents > 0;

  if (shouldRecover) {
    const result = await executeDisputeRecipientRecovery({
      stripe: args.stripe,
      plan,
      disputeSettlementId: id,
      confirmLiveMutation: true,
    });
    if (result.status === 'NEEDS_ATTENTION') {
      // Durable intent exists — return 2xx so Stripe does not create duplicate
      // reversals via retries; admin can retry outstanding recovery.
      return {
        ok: true,
        message: 'recovery_needs_attention',
        plan,
      };
    }
    return { ok: true, message: 'recovery_executed', plan };
  }

  // Affiliate-only on created even when seller recovery is 0 (e.g. already refunded)
  if (
    type === 'charge.dispute.created' &&
    plan.affiliateRecoveryCents > 0
  ) {
    try {
      const { processCommissionReversal } = await import(
        '@/lib/affiliate-commission'
      );
      await processCommissionReversal({
        reversalEventId: dispute.id,
        eventType: 'CHARGEBACK',
        refundedAmountCents: dispute.amount,
        chargeAmountCents: plan.originalBuyerGrossCents,
        orderId,
      });
    } catch (e: unknown) {
      console.error('dispute affiliate reversal failed', e);
    }
  }

  // Won after prior recovery → mark seller repayment due (POLICY: no auto-repay)
  if (financialStatus === 'WON' || financialStatus === 'FUNDS_REINSTATED') {
    const row = await prisma.disputeSettlement.findUnique({ where: { id } });
    if (row && row.recoveredSellerCents > 0) {
      await prisma.disputeSettlement.update({
        where: { id },
        data: {
          financialStatus: 'FUNDS_REINSTATED',
          lastError: 'SELLER_REPAYMENT_DUE_POLICY_REQUIRED',
          updatedAt: new Date(),
        },
      });
    }
  }

  return { ok: true, message: `handled_${type}`, plan };
}

export function sellerDisputeUiState(args: {
  financialStatus: DisputeFinancialStatus;
  recoveredCents: number;
  outstandingCents: number;
}): string {
  switch (args.financialStatus) {
    case 'OPEN':
    case 'EVIDENCE_REQUIRED':
    case 'UNDER_REVIEW':
      return 'Betaling betwist';
    case 'FUNDS_WITHDRAWN':
      return 'Betaling tijdelijk in onderzoek';
    case 'RECIPIENT_RECOVERED':
      return 'Uitbetaling teruggedraaid';
    case 'RECIPIENT_RECOVERY_PENDING':
    case 'NEEDS_ATTENTION':
      return 'Terugvordering vereist aandacht';
    case 'WON':
    case 'FUNDS_REINSTATED':
      return 'Geschil gewonnen';
    case 'LOST':
    case 'CLOSED':
      return args.recoveredCents > 0
        ? 'Geschil verloren'
        : 'Geschil verloren';
    default:
      return 'Betaling betwist';
  }
}

/** Hypothetical P0 exposure before engine (affiliate-only). */
export function proveLegacyDisputeExposure(args: {
  buyerPaidCents: number;
  sellerTransferredCents: number;
  platformRetainedCents: number;
}): {
  PLATFORM_DEBIT: number;
  SELLER_RECOVERY: number;
  AFFILIATE_RECOVERY: number;
  COURIER_RECOVERY: number;
  PLATFORM_LOSS: number;
  UNRECONCILED: number;
  P0_EXPOSURE: boolean;
} {
  // Legacy code: only affiliate ledger reversal — seller recovery 0
  const PLATFORM_DEBIT = args.buyerPaidCents; // + dispute fee omitted in this hypo
  const SELLER_RECOVERY = 0;
  const PLATFORM_LOSS =
    PLATFORM_DEBIT - SELLER_RECOVERY + 0; /* fee separate */
  return {
    PLATFORM_DEBIT,
    SELLER_RECOVERY,
    AFFILIATE_RECOVERY: 0,
    COURIER_RECOVERY: 0,
    PLATFORM_LOSS,
    UNRECONCILED: 0,
    P0_EXPOSURE: SELLER_RECOVERY === 0 && args.sellerTransferredCents > 0,
  };
}
