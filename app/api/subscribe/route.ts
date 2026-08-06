import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import { stripe, PLAN_TO_PRICE, normalizeSubscriptionName } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { ATTRIBUTION_WINDOW_DAYS } from "@/lib/affiliate-config";
import { resolveSubscriptionAttributionId } from "@/lib/affiliate-attribution";
import { auth } from "@/lib/auth";
import {
  extractPromoCodeFromBody,
  resolveSubscriptionPromo,
  type SubscriptionPlanKey,
} from "@/lib/promo-codes/resolve-subscription-promo";
import { activateFreeSubscriptionEntitlement } from "@/lib/promo-codes/activate-free-subscription";

function getBaseUrl(req: NextRequest) {
  const envUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL;
  if (envUrl && envUrl.startsWith('http')) {
    return envUrl.replace(/\/$/, '');
  }
  return req.nextUrl.origin;
}

export async function POST(req: NextRequest) {
  try {
    const authSession = await auth();
    if (!authSession?.user?.id) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    }

    const body = await req.json();
    const { plan, userId } = body;
    // Only accept a code string — ignore any client-forged discount fields.
    const promoCode = extractPromoCodeFromBody(body);

    if (!plan) {
      return NextResponse.json({ error: "Plan ontbreekt" }, { status: 400 });
    }

    const planKey = String(plan).toUpperCase() as SubscriptionPlanKey;
    const priceId = PLAN_TO_PRICE[planKey];

    if (!priceId) {
      return NextResponse.json({ error: "Onbekend plan of ontbrekende price id" }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: "userId ontbreekt" }, { status: 400 });
    }
    if (userId !== authSession.user.id) {
      return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
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

    // Re-validate promo server-side (never trust UI quotes).
    let resolvedPromo: Awaited<ReturnType<typeof resolveSubscriptionPromo>> | null = null;
    if (promoCode) {
      resolvedPromo = await resolveSubscriptionPromo(promoCode);
      if (!resolvedPromo.valid) {
        return NextResponse.json(
          { error: resolvedPromo.error, reason: resolvedPromo.reason },
          { status: 400 },
        );
      }
    }

    const assignPlanLocally = async (
      subscriptionId: string | undefined,
      currentPeriodEnd?: number | null,
    ) => {
      const planName = normalizeSubscriptionName(planKey);
      const dbSubscription =
        (await prisma.subscription.findFirst({
          where: { name: planName, isActive: true },
        })) ??
        (await prisma.subscription.findUnique({ where: { id: planKey.toLowerCase() } }));

      const updateData: Record<string, any> = {
        stripeSubscriptionId: subscriptionId ?? null,
        subscriptionValidUntil: currentPeriodEnd
          ? new Date(currentPeriodEnd * 1000)
          : null,
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
        validUntil: updateData.subscriptionValidUntil as Date | null,
      };
    };

    // In-place Stripe plan change only when NO promo is applied
    // (promo must go through priced checkout or free entitlement).
    if (sellerProfile.stripeSubscriptionId && !promoCode) {
      if (!stripe) {
        return NextResponse.json({ error: "Stripe is niet geconfigureerd" }, { status: 500 });
      }
      try {
        const existingSubscriptionResponse = await stripe.subscriptions.retrieve(
          sellerProfile.stripeSubscriptionId,
        );
        const existingSubscription = existingSubscriptionResponse as any;
        const subscriptionItem = existingSubscription.items.data[0];
        const currentPriceId = subscriptionItem?.price?.id;

        if (!subscriptionItem) {
          throw new Error('Subscription heeft geen items');
        }

        if (currentPriceId === priceId) {
          const { planName, validUntil } = await assignPlanLocally(
            existingSubscription.id,
            existingSubscription.current_period_end,
          );
          return NextResponse.json({
            ok: true,
            updated: false,
            message: `Je abonnement staat al op ${planName}.`,
            plan: planKey,
            validUntil: validUntil ? validUntil.toISOString() : null,
          });
        }

        const updatedSubscriptionResponse = await stripe.subscriptions.update(
          existingSubscription.id,
          {
            items: [{ id: subscriptionItem.id, price: priceId }],
            proration_behavior: 'create_prorations',
            metadata: {
              ...(existingSubscription.metadata || {}),
              plan: planKey,
              userId,
            },
          },
        );

        const updatedSubscription = updatedSubscriptionResponse as any;
        const { planName, validUntil } = await assignPlanLocally(
          updatedSubscription.id,
          updatedSubscription.current_period_end,
        );

        await prisma.sellerProfile.update({
          where: { userId },
          data: {
            stripeCustomerId:
              typeof updatedSubscription.customer === 'string'
                ? updatedSubscription.customer
                : sellerProfile.stripeCustomerId,
          },
        });

        return NextResponse.json({
          ok: true,
          updated: true,
          plan: planKey,
          planName,
          validUntil: validUntil ? validUntil.toISOString() : null,
          prorationInvoiceId:
            typeof updatedSubscription.latest_invoice === 'string'
              ? updatedSubscription.latest_invoice
              : undefined,
        });
      } catch (error: any) {
        console.warn(
          `Kon bestaand abonnement niet bijwerken (${sellerProfile.stripeSubscriptionId}):`,
          error?.message || error,
        );
      }
    }

    const planName = normalizeSubscriptionName(planKey);
    const dbSubscription =
      (await prisma.subscription.findFirst({
        where: { name: planName, isActive: true },
      })) ??
      (await prisma.subscription.findUnique({ where: { id: planKey.toLowerCase() } }));

    if (!dbSubscription) {
      return NextResponse.json({ error: "Abonnement niet gevonden in database" }, { status: 404 });
    }

    const basePriceCents = dbSubscription.priceCents;
    let promoCodeId: string | null = null;
    let attributionId: string | null = null;
    let finalPriceCents = basePriceCents;
    let discountCents = 0;
    let customPriceId: string | null = null;
    let isPlatformPromo = false;

    if (resolvedPromo?.valid) {
      const quote = resolvedPromo.quotes[planKey];
      if (!quote) {
        return NextResponse.json({ error: "Geen prijsquote voor plan" }, { status: 400 });
      }
      // Prefer quote from resolver; also recompute against DB base for consistency.
      if (quote.basePriceCents !== basePriceCents) {
        // Recalculate against authoritative DB price if DNA/seed drift
        const { calculatePromoSubscriptionPricing } = await import(
          '@/lib/promo-codes/discount-policy'
        );
        const pricing = calculatePromoSubscriptionPricing({
          basePriceCents,
          discountSharePct: resolvedPromo.promo.discountSharePct,
          affiliateId: resolvedPromo.promo.affiliateId,
          appliesTo: resolvedPromo.promo.appliesTo,
          isSubAffiliate: resolvedPromo.promo.isSubAffiliate,
        });
        finalPriceCents = pricing.finalPriceCents;
        discountCents = pricing.discountCents;
        isPlatformPromo = pricing.isPlatform;
      } else {
        finalPriceCents = quote.finalPriceCents;
        discountCents = quote.discountCents;
        isPlatformPromo = quote.isPlatform;
      }

      promoCodeId = resolvedPromo.promo.id;

      if (resolvedPromo.promo.affiliateId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            attributions: {
              where: {
                affiliateId: resolvedPromo.promo.affiliateId,
                type: 'BUSINESS_SIGNUP',
              },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        });

        if (user?.attributions?.[0]) {
          attributionId = user.attributions[0].id;
        } else {
          const now = new Date();
          const endsAt = new Date(
            now.getTime() + ATTRIBUTION_WINDOW_DAYS * 24 * 60 * 60 * 1000,
          );
          const attribution = await prisma.attribution.create({
            data: {
              affiliateId: resolvedPromo.promo.affiliateId,
              userId,
              type: 'BUSINESS_SIGNUP',
              source: 'PROMO_CODE',
              startsAt: now,
              endsAt,
            },
          });
          attributionId = attribution.id;
        }
      }
    }

    if (!attributionId) {
      attributionId = await resolveSubscriptionAttributionId(userId);
    }

    // 100% / €0 — internal entitlement, no fake Stripe micro-payment.
    if (finalPriceCents <= 0) {
      const free = await activateFreeSubscriptionEntitlement({
        userId,
        planKey,
        promoCodeId,
        attributionId,
        basePriceCents,
        finalPriceCents: 0,
        durationDays: dbSubscription.durationDays,
      });

      return NextResponse.json({
        ok: true,
        freeActivation: true,
        plan: planKey,
        planName: free.planName,
        validUntil: free.validUntil.toISOString(),
        basePriceCents,
        discountCents: basePriceCents,
        finalPriceCents: 0,
        currency: 'eur',
        businessSubscriptionId: free.businessSubscriptionId,
        message: `Abonnement ${free.planName} geactiveerd met 100% korting (geen betaling).`,
      });
    }

    if (!stripe) {
      return NextResponse.json({ error: "Stripe is niet geconfigureerd" }, { status: 500 });
    }

    if (discountCents > 0) {
      try {
        const catalogPrice = await stripe.prices.retrieve(priceId);
        const interval =
          catalogPrice.recurring?.interval === 'month' ||
          catalogPrice.recurring?.interval === 'year'
            ? catalogPrice.recurring.interval
            : 'month';
        const intervalCount = catalogPrice.recurring?.interval_count ?? 1;

        const customPrice = await stripe.prices.create({
          unit_amount: finalPriceCents,
          currency: 'eur',
          recurring: { interval, interval_count: intervalCount },
          product: catalogPrice.product as string,
          metadata: {
            original_price_id: priceId,
            promo_code_id: promoCodeId ?? '',
            discount_cents: discountCents.toString(),
            platform_promo: isPlatformPromo ? '1' : '0',
            base_price_cents: basePriceCents.toString(),
            final_price_cents: finalPriceCents.toString(),
          },
        });
        customPriceId = customPrice.id;
      } catch (error) {
        console.error('Error creating custom price:', error);
        return NextResponse.json(
          { error: 'Kon kortingsprijs niet aanmaken bij Stripe' },
          { status: 500 },
        );
      }
    }

    const baseUrl = getBaseUrl(req);
    if (!baseUrl || !baseUrl.startsWith('http')) {
      return NextResponse.json(
        { error: "Geen geldige base URL gevonden voor Stripe redirect" },
        { status: 500 },
      );
    }

    const sessionMetadata: Record<string, string> = {
      plan: planKey,
      userId,
      base_price_cents: basePriceCents.toString(),
      final_price_cents: finalPriceCents.toString(),
      discount_cents: discountCents.toString(),
    };

    if (promoCodeId) sessionMetadata.promo_code_id = promoCodeId;
    if (attributionId) sessionMetadata.attribution_id = attributionId;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: customPriceId || priceId, quantity: 1 }],
      success_url: `${baseUrl}/sell?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/sell?canceled=1`,
      metadata: sessionMetadata,
    });

    return NextResponse.json({
      url: session.url,
      hasDiscount: discountCents > 0,
      basePriceCents,
      discountCents,
      finalPriceCents,
      currency: 'eur',
    });
  } catch (e) {
    console.error("subscribe error", e);
    const message = (e as Error)?.message ?? 'onbekende fout';
    return NextResponse.json(
      { error: `Kon abonnement niet starten: ${message}` },
      { status: 500 },
    );
  }
}
