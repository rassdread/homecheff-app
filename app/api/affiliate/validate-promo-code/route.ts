/**
 * Validate Promo Code API
 *
 * POST /api/affiliate/validate-promo-code
 * Validates a promo code for use in subscription checkout
 * (affiliate commission-share OR admin platform full-price discount)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isPlatformPromo,
  parsePlatformFixedCents,
} from "@/lib/promo-codes/discount-policy";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: "Promo code is required" },
        { status: 400 }
      );
    }

    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase().trim() },
      include: {
        affiliate: {
          include: {
            parentAffiliate: true,
          },
        },
      },
    });

    if (!promoCode) {
      return NextResponse.json(
        { valid: false, error: "Promo code not found" },
        { status: 404 }
      );
    }

    if (promoCode.status !== 'ACTIVE') {
      return NextResponse.json({
        valid: false,
        error: "Promo code is disabled",
      });
    }

    const now = new Date();
    if (promoCode.startsAt > now) {
      return NextResponse.json({
        valid: false,
        error: "Promo code is not yet active",
      });
    }

    if (promoCode.endsAt && promoCode.endsAt < now) {
      return NextResponse.json({
        valid: false,
        error: "Promo code has expired",
      });
    }

    if (
      promoCode.maxRedemptions !== null &&
      promoCode.redemptionCount >= promoCode.maxRedemptions
    ) {
      return NextResponse.json({
        valid: false,
        error: "Promo code has reached maximum redemptions",
      });
    }

    const platform = isPlatformPromo(promoCode);
    const fixedCents = parsePlatformFixedCents(promoCode.appliesTo);

    return NextResponse.json({
      valid: true,
      promoCode: {
        id: promoCode.id,
        code: promoCode.code,
        discountSharePct: promoCode.discountSharePct,
        hasL2: !!promoCode.affiliate?.parentAffiliate,
        isPlatform: platform,
        discountMode: platform
          ? fixedCents != null
            ? 'platform_fixed'
            : 'platform_percent'
          : 'affiliate_commission_share',
        fixedDiscountCents: fixedCents,
      },
    });
  } catch (error) {
    console.error("Error validating promo code:", error);
    return NextResponse.json(
      { valid: false, error: "Failed to validate promo code" },
      { status: 500 }
    );
  }
}
