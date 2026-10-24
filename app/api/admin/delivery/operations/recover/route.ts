import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/admin-guard';
import { financialStripeSecret } from '@/lib/stripe';
import { dispatchVerifiedStripeWebhook } from '@/app/api/stripe/webhook/route';
import { prismaWebhookReceiptStore } from '@/lib/stripe/webhook-receipt-store';
import { beginStripeWebhookReceipt, finishStripeWebhookReceipt } from '@/lib/stripe/webhook-receipt';
import { recoverFailedStripeEvent } from '@/lib/stripe/webhook-recovery';

export const dynamic = 'force-dynamic';

const HOUR_MS = 60 * 60_000;

/**
 * Replays one failed webhook by retrieving it from Stripe.
 * Live mode is refused unless HOMECHEFF_WEBHOOK_RECOVERY_LIVEMODE=enabled.
 * The request body is only an event id. The payload is not stored.
 */
export async function POST(req: NextRequest) {
  const guard = await requireSuperAdmin();
  if (!guard.ok) return guard.response;

  let eventId = '';
  try {
    const body = await req.json();
    eventId = typeof body?.eventId === 'string' ? body.eventId : '';
  } catch {
    return NextResponse.json({ code: 'EVENT_ID_INVALID' }, { status: 400 });
  }

  const actorUserId = guard.admin.user.id;
  const record = (result: string) =>
    prisma.stripeWebhookRecoveryAttempt.create({
      data: { eventId: eventId || 'invalid', actorUserId, result },
    });

  const receipt = await prisma.stripeWebhookReceipt.findUnique({ where: { eventId } }).catch(() => null);
  const recentAttemptCount = receipt
    ? await prisma.stripeWebhookRecoveryAttempt.count({
        where: { eventId, createdAt: { gte: new Date(Date.now() - HOUR_MS) } },
      })
    : 0;

  const secret = financialStripeSecret();
  const secretIsLive = Boolean(secret?.startsWith('sk_live'));
  if (receipt && secretIsLive !== receipt.livemode) {
    await record('STRIPE_MODE_MISMATCH');
    return NextResponse.json({ code: 'STRIPE_MODE_MISMATCH' }, { status: 409 });
  }

  const store = prismaWebhookReceiptStore();
  const result = await recoverFailedStripeEvent({
    eventId,
    livemodeRecoveryEnabled: process.env.HOMECHEFF_WEBHOOK_RECOVERY_LIVEMODE === 'enabled',
    recentAttemptCount,
    receipt,
    retrieve: async (id) => {
      if (!secret) return null;
      const stripe = new Stripe(secret, { apiVersion: '2025-08-27.basil' });
      const event = await stripe.events.retrieve(id);
      return { id: event.id, type: event.type, livemode: event.livemode, event };
    },
    dispatch: async (retrieved) => {
      if (!secret || !('event' in retrieved) || !retrieved.event) return { status: 500 };
      const stripe = new Stripe(secret, { apiVersion: '2025-08-27.basil' });
      const response = await dispatchVerifiedStripeWebhook(stripe, retrieved.event);
      return { status: response.status };
    },
    recordAttempt: async (resultCode) => {
      await record(resultCode);
    },
    begin: async () => {
      const started = await beginStripeWebhookReceipt(store, {
        eventId,
        eventType: receipt?.eventType ?? 'unknown',
        livemode: receipt?.livemode ?? false,
      });
      return started.action;
    },
    finish: async (httpStatus) => {
      await finishStripeWebhookReceipt(store, { eventId, httpStatus });
    },
  });

  return NextResponse.json({ code: result.code, dispatched: result.dispatched }, { status: result.httpStatus });
}
