/**
 * Admin full refund for HC_ONLY / MIXED_HC_EUR after capture (+ optional Connect reversal).
 * Explicit confirm required. Partial refunds remain blocked.
 * Also reverses Delivery provider principal + delivery/order affiliate (original snapshots).
 */
import { NextRequest, NextResponse } from 'next/server';

import { requireAdminPermission } from '@/lib/admin-guard';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { growthRefundMarketplaceHc } from '@/lib/hc/growth-marketplace-mutation-client';
import { reverseHcMarketplaceDeliveryOnFullRefund } from '@/lib/hc/marketplace-hc-delivery-refund';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ orderId: string }> };

export async function POST(req: NextRequest, { params }: RouteParams) {
  const guard = await requireAdminPermission('canViewPaymentInfo');
  if (!guard.ok) return guard.response;

  const { orderId } = await params;
  const body = (await req.json().catch(() => ({}))) as { confirm?: boolean; reverseTransfer?: boolean };
  if (!body.confirm) {
    return NextResponse.json({ ok: false, code: 'CONFIRMATION_REQUIRED' }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      paymentMethod: true,
      hcPaymentPhase: true,
      hcCapturedHc: true,
      hcReservationId: true,
      buyerCentralUserId: true,
      stripeSessionId: true,
      totalAmount: true,
    },
  });
  if (!order) return NextResponse.json({ ok: false, code: 'ORDER_NOT_FOUND' }, { status: 404 });
  if (order.paymentMethod !== 'HC_ONLY' && order.paymentMethod !== 'MIXED_HC_EUR') {
    return NextResponse.json({ ok: false, code: 'NOT_HC_ORDER' }, { status: 422 });
  }
  if (!order.hcReservationId || !order.buyerCentralUserId || !order.hcCapturedHc) {
    return NextResponse.json({ ok: false, code: 'MISSING_HC_CAPTURE' }, { status: 422 });
  }
  if (order.status === 'REFUNDED') {
    // Retry-safe: complete Delivery economic reversal if a prior attempt left it incomplete.
    const deliveryRetry = await reverseHcMarketplaceDeliveryOnFullRefund({
      orderId,
      stripe,
    });
    return NextResponse.json({
      ok: true,
      duplicate: true,
      orderId,
      code: 'ALREADY_REFUNDED',
      deliveryRefund: deliveryRetry.marker,
      deliveryRefundOk: deliveryRetry.ok,
    });
  }

  const exposure = await prisma.marketplaceHcSettlementExposure.findUnique({ where: { orderId } });
  let transferReversalId: string | null = null;

  if (exposure?.status === 'PAID' && exposure.payoutReference && body.reverseTransfer !== false) {
    try {
      const reversal = await stripe.transfers.createReversal(
        exposure.payoutReference,
        {
          amount: exposure.sellerNetExposureCents,
          metadata: {
            orderId,
            exposureId: exposure.id,
            reason: 'HC_FULL_REFUND',
            adminUserId: guard.admin.user.id,
          },
        },
        { idempotencyKey: `marketplace:hc:transfer-reversal:${exposure.id}:v1` },
      );
      transferReversalId = reversal.id;
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      const msg = err.message ?? String(e);
      if (String(err.code) === 'transfer_already_reversed' || msg.includes('already been reversed')) {
        transferReversalId = 'already_reversed';
      } else {
        return NextResponse.json(
          { ok: false, code: 'TRANSFER_REVERSAL_FAILED', message: msg },
          { status: 422 },
        );
      }
    }
  }

  let stripeRefundId: string | null = null;
  let stripeRefundAmount: number | null = null;
  if (order.paymentMethod === 'MIXED_HC_EUR') {
    const pis = await stripe.paymentIntents
      .search({ query: `metadata['orderId']:'${orderId}'`, limit: 3 })
      .catch(() => ({ data: [] as Array<{ id: string; status: string; amount: number }> }));
    const pi = pis.data.find((p) => p.status === 'succeeded');
    if (pi) {
      try {
        const refund = await stripe.refunds.create(
          {
            payment_intent: pi.id,
            metadata: { orderId, reason: 'HC_MIXED_FULL_REFUND' },
          },
          { idempotencyKey: `marketplace:hc:stripe-refund:${orderId}:v1` },
        );
        stripeRefundId = refund.id;
        stripeRefundAmount = refund.amount;
      } catch (e: unknown) {
        const err = e as { code?: string; message?: string };
        const msg = err.message ?? String(e);
        if (!msg.includes('already been refunded') && String(err.code) !== 'charge_already_refunded') {
          return NextResponse.json(
            { ok: false, code: 'STRIPE_REFUND_FAILED', message: msg },
            { status: 422 },
          );
        }
        stripeRefundId = 'already_refunded';
      }
    }
  }

  // Delivery economic reversal BEFORE customer HC restore when possible,
  // so a hard affiliate/provider failure does not leave orphan restored HC.
  const deliveryRefund = await reverseHcMarketplaceDeliveryOnFullRefund({
    orderId,
    stripe,
  });
  if (!deliveryRefund.ok && !deliveryRefund.skipped && deliveryRefund.marker?.status === 'FAILED') {
    return NextResponse.json(
      {
        ok: false,
        code: 'DELIVERY_REFUND_FAILED',
        message: deliveryRefund.marker.error ?? deliveryRefund.reason,
        deliveryRefund: deliveryRefund.marker,
      },
      { status: 422 },
    );
  }

  const refundId = `full-${orderId}`;
  const hcRefund = await growthRefundMarketplaceHc({
    centralUserId: order.buyerCentralUserId,
    orderId,
    reservationId: order.hcReservationId,
    refundId,
  });
  if (!hcRefund?.ok) {
    return NextResponse.json(
      { ok: false, code: hcRefund?.code ?? 'HC_REFUND_FAILED', message: hcRefund?.message },
      { status: 422 },
    );
  }

  if (exposure) {
    await prisma.marketplaceHcSettlementExposure.update({
      where: { id: exposure.id },
      data: {
        status: 'REVERSED',
        lastPayoutErrorCode: transferReversalId
          ? `REVERSED:${transferReversalId}`
          : 'REVERSED_BEFORE_PAYOUT',
      },
    });
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'REFUNDED',
      hcPaymentPhase: 'RELEASED',
    },
  });

  const restoredHc =
    ('restoredHc' in hcRefund ? hcRefund.restoredHc : null) ?? order.hcCapturedHc;

  return NextResponse.json({
    ok: true,
    orderId,
    restoredHc,
    duplicateHcRefund: ('duplicate' in hcRefund ? hcRefund.duplicate : false) ?? false,
    transferReversalId,
    stripeRefundId,
    stripeRefundAmount,
    sellerReversalAmount: exposure?.sellerNetExposureCents ?? null,
    exposureStatus: 'REVERSED',
    deliveryRefund: deliveryRefund.marker,
    deliveryRefundSkipped: deliveryRefund.skipped,
    customerMessage: `Je terugbetaling is verwerkt. ${restoredHc} HC is teruggezet op je HC-saldo.`,
    needsAttention: deliveryRefund.marker?.status === 'RECOVERY_REQUIRED',
    adminPreview: deliveryRefund.marker
      ? {
          providerPrincipalReversedCents: deliveryRefund.marker.providerPrincipalCents,
          homeCheffFeeReversedCents: deliveryRefund.marker.homeCheffFeeCents,
          providerMode: deliveryRefund.marker.providerMode,
          affiliateReversed: deliveryRefund.marker.affiliateReversed,
        }
      : null,
  });
}
