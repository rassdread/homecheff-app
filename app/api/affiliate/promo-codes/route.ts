/**
 * Promo Codes CRUD API
 * 
 * GET /api/affiliate/promo-codes - List all promo codes for authenticated affiliate
 * POST /api/affiliate/promo-codes - Create new promo code
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET - List all promo codes for affiliate
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        affiliate: {
          include: {
            promoCodes: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!user?.affiliate) {
      return NextResponse.json({ error: "Affiliate account not found" }, { status: 404 });
    }

    return NextResponse.json({
      promoCodes: user.affiliate.promoCodes,
    });
  } catch (error) {
    console.error("Error fetching promo codes:", error);
    return NextResponse.json(
      { error: "Failed to fetch promo codes" },
      { status: 500 }
    );
  }
}

// POST - Create new promo code
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      code,
      discountSharePct,
      startsAt,
      endsAt,
      maxRedemptions,
    } = body;

    // Validation
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    if (discountSharePct === undefined || discountSharePct < 0 || discountSharePct > 100) {
      return NextResponse.json(
        { error: "discountSharePct must be between 0 and 100" },
        { status: 400 }
      );
    }

    // Get affiliate
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { 
        affiliate: {
          include: {
            parentAffiliate: true,
          },
        },
      },
    });

    if (!user?.affiliate) {
      return NextResponse.json({ error: "Affiliate account not found" }, { status: 404 });
    }

    // Check if this is a sub-affiliate
    const isSubAffiliate = !!user.affiliate.parentAffiliateId;
    
    // Import config constants for max discounts
    const { 
      SUB_AFFILIATE_MAX_DISCOUNT_PCT,
      MAIN_AFFILIATE_MAX_DISCOUNT_PCT
    } = await import('@/lib/affiliate-config');
    
    // Enforce maximum discount based on affiliate type
    // Main affiliates: max 80% (20% minimum behouden = 10% van totaal)
    // Sub-affiliates: max 75% (25% minimum behouden = 10% van totaal)
    // Sub krijgt 40% commissie, kan max €30 korting geven van €40 (75%), blijft €10 over (25% = 10% van totaal)
    const maxAllowedDiscountPct = isSubAffiliate 
      ? SUB_AFFILIATE_MAX_DISCOUNT_PCT
      : MAIN_AFFILIATE_MAX_DISCOUNT_PCT;
    
    if (discountSharePct > maxAllowedDiscountPct) {
      const minCommissionPct = isSubAffiliate ? 25 : 20; // Sub moet 25% behouden, main 20%
      return NextResponse.json(
        { error: `Je moet altijd minimaal ${minCommissionPct}% van je commissie behouden. Maximum korting is ${maxAllowedDiscountPct}%` },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (existing) {
      return NextResponse.json({ error: "Promo code already exists" }, { status: 409 });
    }

    // Create promo code
    const promoCode = await prisma.promoCode.create({
      data: {
        affiliateId: user.affiliate.id,
        code: code.toUpperCase().trim(),
        discountSharePct: Math.round(discountSharePct),
        startsAt: startsAt ? new Date(startsAt) : new Date(),
        endsAt: endsAt ? new Date(endsAt) : null,
        maxRedemptions: maxRedemptions || null,
        redemptionCount: 0,
        status: 'ACTIVE',
        appliesTo: 'SUBSCRIPTION_ONLY',
      },
    });

    return NextResponse.json({ promoCode }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating promo code:", error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Promo code already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create promo code" },
      { status: 500 }
    );
  }
}

