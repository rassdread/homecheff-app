import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { normalizeSubscriptionName } from "@/lib/stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY?.trim();

const isStripeSubscription = (value: unknown): value is Stripe.Subscription => {
  return typeof value === 'object' && value !== null && 'id' in value && 'status' in value;
};

if (!STRIPE_SECRET_KEY) {
  console.warn('⚠️ STRIPE_SECRET_KEY ontbreekt – /api/subscribe/confirm werkt niet zonder deze sleutel.');
}

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-08-27.basil" })
  : null;

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is niet geconfigureerd" }, { status: 500 });
  }

  const { sessionId } = await req.json();

  if (!sessionId || typeof sessionId !== 'string') {
    return NextResponse.json({ error: "sessionId ontbreekt" }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    if (session.mode !== 'subscription') {
      return NextResponse.json({ error: "Deze checkout sessie is geen abonnement" }, { status: 400 });
    }

    const subscription = session.subscription as Stripe.Subscription | string | null;
    const metadataPlan = session.metadata?.plan || (isStripeSubscription(subscription) ? subscription.metadata?.plan : undefined);
    const metadataUserId = session.metadata?.userId || (isStripeSubscription(subscription) ? subscription.metadata?.userId : undefined);

    if (!metadataPlan || !metadataUserId) {
      return NextResponse.json({ error: "Kon plan of gebruiker niet bepalen uit de sessie" }, { status: 400 });
    }

    const planKey = metadataPlan.toString().toUpperCase();
    const planName = normalizeSubscriptionName(planKey);

    let subscriptionRecord = await prisma.subscription.findFirst({
      where: { name: planName, isActive: true },
    });

    if (!subscriptionRecord) {
      subscriptionRecord = await prisma.subscription.findUnique({
        where: { id: planKey.toLowerCase() },
      });
    }

    if (!subscriptionRecord) {
      return NextResponse.json({ error: `Abonnement ${planKey} bestaat niet in het platform` }, { status: 400 });
    }

    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: metadataUserId },
    });

    if (!sellerProfile) {
      return NextResponse.json({ error: "Verkoperprofiel niet gevonden" }, { status: 404 });
    }

    let validUntil: Date | null = null;
    if (isStripeSubscription(subscription)) {
      const periodEnd = (subscription as any)?.current_period_end;
      if (typeof periodEnd === 'number') {
        validUntil = new Date(periodEnd * 1000);
      }
    } else if (subscriptionRecord.durationDays) {
      validUntil = new Date(Date.now() + subscriptionRecord.durationDays * 24 * 60 * 60 * 1000);
    }

    const stripeSubscriptionId =
      isStripeSubscription(subscription) ? subscription.id :
      typeof subscription === 'string' ? subscription :
      null;

    const stripeCustomerId =
      typeof session.customer === 'string'
        ? session.customer
        : (isStripeSubscription(subscription) && typeof subscription.customer === 'string'
            ? subscription.customer
            : null);

    const updateData: Record<string, any> = {
      subscriptionId: subscriptionRecord.id,
      subscriptionValidUntil: validUntil,
      stripeSubscriptionId,
    };

    if (stripeCustomerId) {
      updateData.stripeCustomerId = stripeCustomerId;
    }

    await prisma.sellerProfile.update({
      where: { userId: metadataUserId },
      data: updateData,
    });

    console.log(`✅ Subscription bevestigd via confirm endpoint voor user ${metadataUserId}: ${planKey}`);

    return NextResponse.json({
      ok: true,
      plan: planKey,
      subscriptionId: subscriptionRecord.id,
      validUntil,
    });
  } catch (error: any) {
    console.error("❌ Fout bij bevestigen van abonnement:", error);
    return NextResponse.json({ error: `Kon abonnement niet bevestigen: ${error.message}` }, { status: 500 });
  }
}


