import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import { stripe, PLAN_TO_PRICE, normalizeSubscriptionName } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

function getBaseUrl(req: NextRequest) {
  const envUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL;
  if (envUrl && envUrl.startsWith('http')) {
    return envUrl.replace(/\/$/, '');
  }
  return req.nextUrl.origin;
}

export async function POST(req: NextRequest) {
  try {
    const { plan, userId } = await req.json();

    if (!plan) {
      return NextResponse.json({ error: "Plan ontbreekt" }, { status: 400 });
    }

    const planKey = String(plan).toUpperCase();
    const priceId = PLAN_TO_PRICE[planKey];

    if (!priceId) {
      return NextResponse.json({ error: "Onbekend plan of ontbrekende price id" }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: "userId ontbreekt" }, { status: 400 });
    }

    if (!stripe) {
      return NextResponse.json({ error: "Stripe is niet geconfigureerd" }, { status: 500 });
    }

    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        stripeSubscriptionId: true,
        stripeCustomerId: true,
      },
    });

    if (!sellerProfile) {
      return NextResponse.json({ error: "Verkoperprofiel niet gevonden" }, { status: 404 });
    }

    const assignPlanLocally = async (subscriptionId: string | undefined, currentPeriodEnd?: number | null) => {
      const planName = normalizeSubscriptionName(planKey);
      const dbSubscription = await prisma.subscription.findFirst({
        where: { name: planName, isActive: true },
      }) ?? await prisma.subscription.findUnique({ where: { id: planKey.toLowerCase() } });

      const updateData: Record<string, any> = {
        stripeSubscriptionId: subscriptionId ?? null,
        subscriptionValidUntil: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
      };

      if (dbSubscription) {
        updateData.subscriptionId = dbSubscription.id;
      }

      await prisma.sellerProfile.update({
        where: { userId },
        data: updateData,
      });

      return {
        planName,
        dbSubscriptionId: dbSubscription?.id ?? null,
        validUntil: updateData.subscriptionValidUntil,
      };
    };

    if (sellerProfile.stripeSubscriptionId) {
      try {
        const existingSubscriptionResponse = await stripe.subscriptions.retrieve(sellerProfile.stripeSubscriptionId);
        const existingSubscription = existingSubscriptionResponse as any;
        const subscriptionItem = existingSubscription.items.data[0];
        const currentPriceId = subscriptionItem?.price?.id;

        if (!subscriptionItem) {
          throw new Error('Subscription heeft geen items');
        }

        if (currentPriceId === priceId) {
          const { planName, validUntil } = await assignPlanLocally(existingSubscription.id, existingSubscription.current_period_end);
          return NextResponse.json({
            ok: true,
            updated: false,
            message: `Je abonnement staat al op ${planName}.`,
            plan: planKey,
            validUntil: validUntil ? validUntil.toISOString() : null,
          });
        }

        const updatedSubscriptionResponse = await stripe.subscriptions.update(existingSubscription.id, {
          items: [
            {
              id: subscriptionItem.id,
              price: priceId,
            },
          ],
          proration_behavior: 'create_prorations',
          metadata: {
            ...(existingSubscription.metadata || {}),
            plan: planKey,
            userId,
          },
        });

        const updatedSubscription = updatedSubscriptionResponse as any;

        const { planName, validUntil } = await assignPlanLocally(updatedSubscription.id, updatedSubscription.current_period_end);

        await prisma.sellerProfile.update({
          where: { userId },
          data: {
            stripeCustomerId: typeof updatedSubscription.customer === 'string' ? updatedSubscription.customer : sellerProfile.stripeCustomerId,
          },
        });

        return NextResponse.json({
          ok: true,
          updated: true,
          plan: planKey,
          planName,
          validUntil: validUntil ? validUntil.toISOString() : null,
          prorationInvoiceId: typeof updatedSubscription.latest_invoice === 'string' ? updatedSubscription.latest_invoice : undefined,
        });
      } catch (error: any) {
        console.warn(`Kon bestaand abonnement niet bijwerken (${sellerProfile.stripeSubscriptionId}):`, error?.message || error);
        // Fallback naar nieuwe checkout sessie als bijwerken faalt
      }
    }

    const baseUrl = getBaseUrl(req);
    if (!baseUrl || !baseUrl.startsWith('http')) {
      return NextResponse.json({ error: "Geen geldige base URL gevonden voor Stripe redirect" }, { status: 500 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/sell?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/sell?canceled=1`,
      metadata: { plan: planKey, userId },
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("subscribe error", e);
    const message = (e as Error)?.message ?? 'onbekende fout';
    const errorMessage = `Kon abonnement niet starten: ${message}`;

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
