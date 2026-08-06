import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import Stripe from "stripe";
import { findActiveCouponByCode } from "@/lib/promo-codes/coupon-service";

// Test mode - gebruik sandbox keys
const isTestMode = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('sk_test');

// Initialize Stripe for both test and live mode
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-08-27.basil',
    })
  : null;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const raw = (body?.code ?? "").toString();
    const code = raw.trim();

    if (!code) {
      return NextResponse.json(
        { valid: false, reason: "missing_code" },
        { status: 400 }
      );
    }

    // Platform admin coupons (Prisma) — gift / compensation / launch / testing
    const dbCoupon = await findActiveCouponByCode(code);
    if (dbCoupon) {
      const isAmount = dbCoupon.discountCents != null;
      return NextResponse.json({
        valid: true,
        source: "platform_coupon",
        discount: isAmount ? dbCoupon.discountCents! : dbCoupon.discountPercent!,
        discountType: isAmount ? "amount_off" : "percent_off",
        currency: isAmount ? "eur" : undefined,
        couponId: dbCoupon.id,
        name: dbCoupon.description ?? dbCoupon.code,
        expiresAt: dbCoupon.validUntil?.toISOString() ?? null,
        redeemBy: dbCoupon.validUntil
          ? Math.floor(dbCoupon.validUntil.getTime() / 1000)
          : null,
      });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { valid: false, reason: "missing_stripe_key" },
        { status: 500 }
      );
    }

    // In test mode, simuleer een succesvolle coupon validatie
    if (isTestMode) {
      if (code.toLowerCase() === 'test' || code.toLowerCase() === 'welcome') {
        return NextResponse.json({
          valid: true,
          source: "test_mode",
          discount: 10,
          discountType: "percent_off",
          currency: "eur",
          couponId: "test_coupon",
          promotionCodeId: "promo_test",
          name: "Test Coupon",
          expiresAt: null,
          redeemBy: null,
        });
      }

      return NextResponse.json({
        valid: false,
        reason: "invalid_code",
      });
    }

    if (!stripe) {
      return NextResponse.json(
        { valid: false, reason: "stripe_not_configured" },
        { status: 500 }
      );
    }

    // 1) Voorkeur: Promotion Codes (aanbevolen door Stripe)
    const promos = await stripe.promotionCodes.list({
      code,
      active: true,
      limit: 1,
      expand: ["data.coupon"],
    });

    const promo = promos.data[0];
    if (promo && promo.active && promo.coupon?.valid) {
      const c = promo.coupon;

      const isAmount = !!c.amount_off;
      const discount = isAmount ? c.amount_off! : c.percent_off!;

      return NextResponse.json({
        valid: true,
        source: "promotion_code",
        discount,
        discountType: isAmount ? "amount_off" : "percent_off",
        currency: isAmount ? c.currency : undefined,
        couponId: c.id,
        promotionCodeId: promo.id,
        name: c.name,
        expiresAt: promo.expires_at ?? null,
        redeemBy: c.redeem_by ?? null,
      });
    }

    // 2) Fallback: losse Coupons (legacy) op basis van naam of id
    const coupons = await stripe.coupons.list();
    const found = coupons.data.find(
      (c) =>
        c.valid &&
        (c.id.toLowerCase() === code.toLowerCase() ||
          (c.name?.toLowerCase?.() === code.toLowerCase()))
    );

    if (found) {
      const isAmount = !!found.amount_off;
      const discount = isAmount ? found.amount_off! : found.percent_off!;

      return NextResponse.json({
        valid: true,
        source: "coupon",
        discount,
        discountType: isAmount ? "amount_off" : "percent_off",
        currency: isAmount ? found.currency : undefined,
        couponId: found.id,
        name: found.name,
        redeemBy: found.redeem_by ?? null,
      });
    }

    return NextResponse.json({ valid: false, reason: "not_found" });
  } catch (err) {
    console.error("[coupon-validate] error", err);
    return NextResponse.json(
      { valid: false, reason: "server_error" },
      { status: 500 }
    );
  }
}
