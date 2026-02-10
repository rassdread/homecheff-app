/**
 * Promo Code Detail API
 * 
 * GET /api/affiliate/promo-codes/[id] - Get promo code details
 * PUT /api/affiliate/promo-codes/[id] - Update promo code
 * DELETE /api/affiliate/promo-codes/[id] - Delete/disable promo code
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET - Get promo code details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { affiliate: true },
    });

    if (!user?.affiliate) {
      return NextResponse.json({ error: "Affiliate account not found" }, { status: 404 });
    }

    const promoCode = await prisma.promoCode.findFirst({
      where: {
        id: params.id,
        affiliateId: user.affiliate.id,
      },
      include: {
        businessSubscriptions: {
          select: {
            id: true,
            createdAt: true,
            priceCents: true,
          },
        },
      },
    });

    if (!promoCode) {
      return NextResponse.json({ error: "Promo code not found" }, { status: 404 });
    }

    // Calculate stats
    const totalRevenue = promoCode.businessSubscriptions.reduce(
      (sum, sub) => sum + sub.priceCents,
      0
    );

    return NextResponse.json({
      promoCode,
      stats: {
        totalRedemptions: promoCode.redemptionCount,
        totalRevenue,
        activeSubscriptions: promoCode.businessSubscriptions.length,
      },
    });
  } catch (error) {
    console.error("Error fetching promo code:", error);
    return NextResponse.json(
      { error: "Failed to fetch promo code" },
      { status: 500 }
    );
  }
}

// PUT - Update promo code
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      discountSharePct,
      startsAt,
      endsAt,
      maxRedemptions,
      status,
    } = body;

    // Get affiliate
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { affiliate: true },
    });

    if (!user?.affiliate) {
      return NextResponse.json({ error: "Affiliate account not found" }, { status: 404 });
    }

    // Check ownership
    const existing = await prisma.promoCode.findFirst({
      where: {
        id: params.id,
        affiliateId: user.affiliate.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Promo code not found" }, { status: 404 });
    }

    // Build update data
    const updateData: any = {};
    if (discountSharePct !== undefined) {
      if (discountSharePct < 0 || discountSharePct > 100) {
        return NextResponse.json(
          { error: "discountSharePct must be between 0 and 100" },
          { status: 400 }
        );
      }

      // Import config constants
      const { 
        SUB_AFFILIATE_MAX_DISCOUNT_PCT,
        MAIN_AFFILIATE_MAX_DISCOUNT_PCT
      } = await import('@/lib/affiliate-config');

      // Check if this is a sub-affiliate
      const isSubAffiliate = !!user.affiliate.parentAffiliateId;
      
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

      updateData.discountSharePct = Math.round(discountSharePct);
    }
    if (startsAt !== undefined) updateData.startsAt = new Date(startsAt);
    if (endsAt !== undefined) updateData.endsAt = endsAt ? new Date(endsAt) : null;
    if (maxRedemptions !== undefined) updateData.maxRedemptions = maxRedemptions || null;
    if (status !== undefined) {
      if (status !== 'ACTIVE' && status !== 'DISABLED') {
        return NextResponse.json(
          { error: "Invalid status" },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    const promoCode = await prisma.promoCode.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ promoCode });
  } catch (error) {
    console.error("Error updating promo code:", error);
    return NextResponse.json(
      { error: "Failed to update promo code" },
      { status: 500 }
    );
  }
}

// DELETE - Delete or disable promo code
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { affiliate: true },
    });

    if (!user?.affiliate) {
      return NextResponse.json({ error: "Affiliate account not found" }, { status: 404 });
    }

    // Check ownership
    const existing = await prisma.promoCode.findFirst({
      where: {
        id: params.id,
        affiliateId: user.affiliate.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Promo code not found" }, { status: 404 });
    }

    // Check if promo code has been used (redemptionCount > 0)
    if (existing.redemptionCount > 0) {
      // If used, only disable it (soft delete)
      const promoCode = await prisma.promoCode.update({
        where: { id: params.id },
        data: { status: 'DISABLED' },
      });

      return NextResponse.json({ 
        promoCode,
        action: 'disabled',
      });
    } else {
      // If not used, fully delete it
      await prisma.promoCode.delete({
        where: { id: params.id },
      });

      return NextResponse.json({ 
        action: 'deleted',
      });
    }
  } catch (error) {
    console.error("Error deleting promo code:", error);
    return NextResponse.json(
      { error: "Failed to delete promo code" },
      { status: 500 }
    );
  }
}

