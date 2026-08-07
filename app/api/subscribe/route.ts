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
import {
  attachCheckoutSessionToRedemption,
  confirmPromoRedemption,
  releasePromoRedemption,
  reservePromoRedemption,
} from "@/lib/promo-codes/redeem-promo";

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
      resolvedPromo = await resolveSubscriptionPromo(promoCode, { userId });
      if (!resolvedPromo.valid) {
        return NextResponse.json(
          {
            error: resolvedPromo.errorNl || resolvedPromo.error,
            reason: resolvedPromo.reason,
          },
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
    let checkoutDiscounts: Array<{ coupon: string }> | undefined;

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

    const postPromotionAction =
      resolvedPromo?.valid
        ? resolvedPromo.promo.postPromotionAction
        : 'CONTINUE';
    const durationCyclesForLifecycle =
      resolvedPromo?.valid ? resolvedPromo.promo.discountDurationCycles : null;

    // 100% / €0 with END (or untimed): internal entitlement — no Stripe, ends after promo.
    // CONTINUE + timed 100%: Stripe checkout with trial so paid billing can resume with consent.
    const useFreeEntitlement =
      finalPriceCents <= 0 &&
      !(
        isPlatformPromo &&
        postPromotionAction === 'CONTINUE' &&
        durationCyclesForLifecycle != null &&
        durationCyclesForLifecycle > 0
      );

    if (useFreeEntitlement) {
      let redemptionId: string | null = null;
      if (promoCodeId && resolvedPromo?.valid) {
        const reserved = await reservePromoRedemption({
          promoCodeId,
          userId,
          planKey,
          path: 'FREE',
          initialStatus: 'RESERVED',
          discountSharePct: resolvedPromo.promo.discountSharePct,
          discountDurationCycles: resolvedPromo.promo.discountDurationCycles,
          postPromotionAction,
          basePriceCents,
          finalPriceCents: 0,
        });
        if (!reserved.ok) {
          return NextResponse.json(
            { error: reserved.errorNl || reserved.error, reason: reserved.reason },
            { status: 400 },
          );
        }
        redemptionId = reserved.redemptionId;
      }

      try {
        const free = await activateFreeSubscriptionEntitlement({
          userId,
          planKey,
          promoCodeId,
          attributionId,
          basePriceCents,
          finalPriceCents: 0,
          durationDays: dbSubscription.durationDays,
          discountDurationCycles: resolvedPromo?.valid
            ? resolvedPromo.promo.discountDurationCycles
            : null,
        });

        if (redemptionId) {
          await confirmPromoRedemption({
            redemptionId,
            businessSubscriptionId: free.businessSubscriptionId,
          });
        }

        return NextResponse.json({
          ok: true,
          freeActivation: true,
          plan: planKey,
          planName: free.planName,
          validUntil: free.validUntil.toISOString(),
          promoPeriodEndsAt: free.promoPeriodEndsAt.toISOString(),
          discountDurationCycles: resolvedPromo?.valid
            ? resolvedPromo.promo.discountDurationCycles
            : null,
          postPromotionAction,
          endsAutomatically: postPromotionAction === 'END',
          basePriceCents,
          discountCents: basePriceCents,
          finalPriceCents: 0,
          currency: 'eur',
          businessSubscriptionId: free.businessSubscriptionId,
          redemptionId,
          message:
            postPromotionAction === 'END'
              ? `Abonnement ${free.planName} geactiveerd met 100% korting. Eindigt automatisch na de promotieperiode (geen betaling).`
              : `Abonnement ${free.planName} geactiveerd met 100% korting (geen betaling).`,
        });
      } catch (err) {
        if (redemptionId) {
          await releasePromoRedemption({ redemptionId }).catch(() => undefined);
        }
        throw err;
      }
    }

    if (!stripe) {
      return NextResponse.json({ error: "Stripe is niet geconfigureerd" }, { status: 500 });
    }

    // CONTINUE + 100% timed: catalog price with trial covering the promo window.
    let trialPeriodDays: number | undefined;
    if (
      finalPriceCents <= 0 &&
      isPlatformPromo &&
      postPromotionAction === 'CONTINUE' &&
      durationCyclesForLifecycle != null &&
      durationCyclesForLifecycle > 0
    ) {
      const { billingCyclesToDurationDays } = await import(
        '@/lib/promo-codes/platform-promo-duration'
      );
      trialPeriodDays =
        billingCyclesToDurationDays(durationCyclesForLifecycle) ?? undefined;
      // Checkout uses list price; trial makes first period free with consent for later billing.
      discountCents = 0;
      finalPriceCents = basePriceCents;
    }

    if (discountCents > 0) {
      const durationCycles = durationCyclesForLifecycle;
      const isTimedPlatform =
        isPlatformPromo &&
        durationCycles != null &&
        durationCycles > 0 &&
        resolvedPromo?.valid;

      try {
        if (isTimedPlatform && resolvedPromo?.valid) {
          // Temporary platform discount: catalog price + repeating Stripe coupon.
          const pct =
            basePriceCents > 0
              ? Math.min(
                  100,
                  Math.round((discountCents / basePriceCents) * 100),
                )
              : 0;
          if (pct <= 0) {
            return NextResponse.json(
              { error: 'Ongeldige korting voor tijdelijke promotie' },
              { status: 400 },
            );
          }
          const coupon = await stripe.coupons.create({
            percent_off: pct,
            duration: 'repeating',
            duration_in_months: durationCycles,
            name: `HC-${resolvedPromo.promo.code}`.slice(0, 40),
            metadata: {
              promo_code_id: promoCodeId ?? '',
              platform_promo: '1',
              discount_duration_cycles: String(durationCycles),
              post_promotion_action: postPromotionAction,
              base_price_cents: String(basePriceCents),
              final_price_cents: String(finalPriceCents),
            },
          });
          checkoutDiscounts = [{ coupon: coupon.id }];
          customPriceId = null;
        } else {
          // Legacy forever discounted recurring price (affiliate / no duration).
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
              post_promotion_action: postPromotionAction,
              base_price_cents: basePriceCents.toString(),
              final_price_cents: finalPriceCents.toString(),
            },
          });
          customPriceId = customPrice.id;
        }
      } catch (error) {
        console.error('Error creating promo Stripe price/coupon:', error);
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

    let paidRedemptionId: string | null = null;
    if (promoCodeId && resolvedPromo?.valid) {
      const reserved = await reservePromoRedemption({
        promoCodeId,
        userId,
        planKey,
        path: 'PAID',
        initialStatus: 'RESERVED',
        discountSharePct: resolvedPromo.promo.discountSharePct,
        discountDurationCycles: resolvedPromo.promo.discountDurationCycles,
        postPromotionAction,
        basePriceCents,
        finalPriceCents,
      });
      if (!reserved.ok) {
        return NextResponse.json(
          { error: reserved.errorNl || reserved.error, reason: reserved.reason },
          { status: 400 },
        );
      }
      paidRedemptionId = reserved.redemptionId;
    }

    const sessionMetadata: Record<string, string> = {
      plan: planKey,
      userId,
      base_price_cents: basePriceCents.toString(),
      final_price_cents: finalPriceCents.toString(),
      discount_cents: discountCents.toString(),
      post_promotion_action: postPromotionAction,
    };

    if (promoCodeId) sessionMetadata.promo_code_id = promoCodeId;
    if (attributionId) sessionMetadata.attribution_id = attributionId;
    if (paidRedemptionId) sessionMetadata.promo_redemption_id = paidRedemptionId;
    if (durationCyclesForLifecycle != null) {
      sessionMetadata.discount_duration_cycles = String(durationCyclesForLifecycle);
    }

    const subscriptionData: Record<string, unknown> = {
      metadata: {
        plan: planKey,
        userId,
        promo_code_id: promoCodeId ?? '',
        post_promotion_action: postPromotionAction,
      },
    };
    if (trialPeriodDays != null && trialPeriodDays > 0) {
      subscriptionData.trial_period_days = trialPeriodDays;
    }
    // END + timed: schedule cancel after promotional window (approx cycles × 30d).
    if (
      postPromotionAction === 'END' &&
      durationCyclesForLifecycle != null &&
      durationCyclesForLifecycle > 0
    ) {
      const { billingCyclesToDurationDays } = await import(
        '@/lib/promo-codes/platform-promo-duration'
      );
      const days = billingCyclesToDurationDays(durationCyclesForLifecycle) ?? 0;
      if (days > 0) {
        subscriptionData.cancel_at = Math.floor(Date.now() / 1000) + days * 24 * 60 * 60;
      }
    }

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: customPriceId || priceId, quantity: 1 }],
        ...(checkoutDiscounts ? { discounts: checkoutDiscounts } : {}),
        success_url: `${baseUrl}/sell?success=1&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/sell?canceled=1`,
        metadata: sessionMetadata,
        subscription_data: subscriptionData,
      });
    } catch (err) {
      if (paidRedemptionId) {
        await releasePromoRedemption({ redemptionId: paidRedemptionId }).catch(
          () => undefined,
        );
      }
      throw err;
    }

    if (paidRedemptionId && session.id) {
      await attachCheckoutSessionToRedemption({
        redemptionId: paidRedemptionId,
        stripeCheckoutSessionId: session.id,
      }).catch((attachErr) =>
        console.error('[subscribe] attachCheckoutSessionToRedemption', attachErr),
      );
    }

    return NextResponse.json({
      url: session.url,
      hasDiscount: discountCents > 0 || (trialPeriodDays != null && trialPeriodDays > 0),
      basePriceCents,
      discountCents,
      finalPriceCents: trialPeriodDays ? 0 : finalPriceCents,
      discountDurationCycles: durationCyclesForLifecycle,
      postPromotionAction,
      endsAutomatically: postPromotionAction === 'END',
      trialPeriodDays: trialPeriodDays ?? null,
      currency: 'eur',
      redemptionId: paidRedemptionId,
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
