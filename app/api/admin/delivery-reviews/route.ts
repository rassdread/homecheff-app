import { requireMappedAdminCapability } from '@/lib/admin-guard';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import { financialStripeSecret } from '@/lib/stripe';
import { executeDeliveryRefundDecision } from '@/lib/delivery/delivery-refund-review';
import { describeDeliveryPayout } from '@/lib/delivery/delivery-ops-queue';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
    return { error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) };
  }
  return { user };
}

export async function GET(_request: Request) {
  const mappedGuard = await requireMappedAdminCapability(_request);
  if (!mappedGuard.ok) return mappedGuard.response;
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const cases = await prisma.deliveryOrder.findMany({
    where: { notes: { contains: 'REVIEW_REQUIRED_NO_AUTOMATIC_STRIPE_REFUND' } },
    orderBy: { updatedAt: 'desc' },
    take: 50,
    select: {
      id: true,
      orderId: true,
      status: true,
      notes: true,
      updatedAt: true,
      deliveryProfile: { select: { user: { select: { id: true, name: true } } } },
    },
  });
  const decisions = await prisma.deliveryRefundDecision.findMany({
    where: { deliveryOrderId: { in: cases.map((row) => row.id) } },
    orderBy: { createdAt: 'desc' },
  });
  const requests = await prisma.standaloneDeliveryRequest.findMany({
    where: { deliveryOrderId: { in: cases.map((row) => row.id) } },
    select: {
      deliveryOrderId: true,
      requesterUserId: true,
      buyerTotalCents: true,
      quotedFeeCents: true,
      paymentStatus: true,
      updatedAt: true,
    },
  });
  const failedPayouts = await prisma.payout.findMany({
    where: {
      id: { startsWith: 'payout_delivery_' },
      OR: [{ transferFailureCode: { not: null } }, { providerRef: 'failed_connect_missing' }],
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const marketplaceCases = await prisma.deliveryOrder.findMany({
    where: {
      origin: 'MARKETPLACE',
      quotedFeeCents: { gt: 0 },
      status: { in: ['CANCELLED', 'CANCELLED_AFTER_PAYMENT'] },
      order: { stripeSessionId: { not: null } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 50,
    select: {
      id: true,
      orderId: true,
      status: true,
      quotedFeeCents: true,
      deliveryProfile: { select: { userId: true } },
      order: { select: { stripeSessionId: true, totalAmount: true } },
    },
  });
  const paymentCases = await prisma.standaloneDeliveryRequest.findMany({
    where: { status: { in: ['PAYMENT_FAILED', 'EXPIRED'] }, stripeSessionId: { not: null } },
    orderBy: { updatedAt: 'desc' },
    take: 50,
    select: { id: true, status: true, paymentStatus: true, deliveryProfileId: true, updatedAt: true },
  });
  const connectRestrictions = await prisma.deliveryProfile.findMany({
    where: {
      OR: [{ stripePayoutsEnabled: false }, { stripeTransfersStatus: 'inactive' }],
      deliveryOrders: { some: { status: { in: ['PENDING', 'ACCEPTED'] } } },
    },
    take: 50,
    select: {
      id: true,
      userId: true,
      stripeTransfersStatus: true,
      stripePayoutsEnabled: true,
      stripeTransfersCheckedAt: true,
    },
  });
  return NextResponse.json({
    cases: cases.map((row) => ({
      deliveryOrderId: row.id,
      orderId: row.orderId,
      bookingStatus: row.status,
      courierName: row.deliveryProfile?.user.name ?? null,
      courierUserId: row.deliveryProfile?.user.id ?? null,
      updatedAt: row.updatedAt,
      request: requests.find((item) => item.deliveryOrderId === row.id) ?? null,
      decisions: decisions.filter((item) => item.deliveryOrderId === row.id),
    })),
    failedTransfers: failedPayouts.map(describeDeliveryPayout),
    marketplaceCases: marketplaceCases.map((row) => ({
      deliveryOrderId: row.id,
      orderId: row.orderId,
      bookingStatus: row.status,
      quotedFeeCents: row.quotedFeeCents,
      orderTotalCents: row.order?.totalAmount ?? null,
      courierUserId: row.deliveryProfile?.userId ?? null,
      ownership: 'MARKETPLACE_ORDER_PAYMENT',
      automaticRefund: false,
      code: 'MARKETPLACE_PAYMENT_NOT_ISOLATED',
    })),
    paymentCases,
    connectRestrictions,
  });
}

export async function POST(req: NextRequest) {
  const mappedGuard = await requireMappedAdminCapability(req);
  if (!mappedGuard.ok) return mappedGuard.response;
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const body = await req.json().catch(() => null);
  if (!body || body.confirm !== true || body.confirmFinancialPreview !== true) {
    return NextResponse.json({ error: 'Expliciete bevestiging is verplicht.', code: 'CONFIRMATION_REQUIRED' }, { status: 400 });
  }
  const key = financialStripeSecret();
  if (!key) return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 });
  const stripe = new Stripe(key, { apiVersion: '2025-08-27.basil' });
  const result = await executeDeliveryRefundDecision(prisma, stripe, {
    deliveryOrderId: String(body.deliveryOrderId ?? ''),
    adminUserId: gate.user.id,
    decision: body.decision === 'REJECT' ? 'REJECT' : 'APPROVE',
    reason: String(body.reason ?? ''),
    amountCents: Number.isFinite(body.amountCents) ? Math.round(body.amountCents) : null,
    confirm: true,
  });
  if (!result.ok) return NextResponse.json({ error: result.error, code: result.code }, { status: result.status });
  return NextResponse.json({ ok: true, duplicate: result.duplicate, decisionId: result.decision.id, customerStatus: result.customerStatus });
}
