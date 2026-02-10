/**
 * Update Sub-Affiliate Commission Percentages API
 * 
 * PUT /api/affiliate/update-sub-commission
 * Allows a parent affiliate to update commission percentages for their sub-affiliates
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { 
      subAffiliateId, 
      customUserCommissionPct, 
      customBusinessCommissionPct,
      customParentUserCommissionPct,
      customParentBusinessCommissionPct 
    } = body;

    if (!subAffiliateId) {
      return NextResponse.json(
        { error: "Sub-affiliate ID is required" },
        { status: 400 }
      );
    }

    // Get the current affiliate (parent)
    const parentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { affiliate: true },
    });

    if (!parentUser || !parentUser.affiliate) {
      return NextResponse.json(
        { error: "Je moet zelf affiliate zijn om commissie percentages aan te passen" },
        { status: 403 }
      );
    }

    // Get sub-affiliate and verify it belongs to this parent
    const subAffiliate = await prisma.affiliate.findUnique({
      where: { id: subAffiliateId },
      include: { parentAffiliate: true },
    });

    if (!subAffiliate) {
      return NextResponse.json(
        { error: "Sub-affiliate niet gevonden" },
        { status: 404 }
      );
    }

    if (subAffiliate.parentAffiliateId !== parentUser.affiliate.id) {
      return NextResponse.json(
        { error: "Je hebt geen toestemming om deze sub-affiliate aan te passen" },
        { status: 403 }
      );
    }

    // Validate percentages (0-1 range, and ensure HomeCheff share is protected)
    const updateData: any = {};

    if (customUserCommissionPct !== undefined) {
      if (customUserCommissionPct < 0 || customUserCommissionPct > 0.5) {
        return NextResponse.json(
          { error: "User commission percentage moet tussen 0% en 50% zijn" },
          { status: 400 }
        );
      }
      updateData.customUserCommissionPct = customUserCommissionPct;
    }

    if (customBusinessCommissionPct !== undefined) {
      if (customBusinessCommissionPct < 0 || customBusinessCommissionPct > 0.5) {
        return NextResponse.json(
          { error: "Business commission percentage moet tussen 0% en 50% zijn" },
          { status: 400 }
        );
      }
      updateData.customBusinessCommissionPct = customBusinessCommissionPct;
    }

    if (customParentUserCommissionPct !== undefined) {
      if (customParentUserCommissionPct < 0 || customParentUserCommissionPct > 0.2) {
        return NextResponse.json(
          { error: "Parent user commission percentage moet tussen 0% en 20% zijn" },
          { status: 400 }
        );
      }
      updateData.customParentUserCommissionPct = customParentUserCommissionPct;
    }

    if (customParentBusinessCommissionPct !== undefined) {
      if (customParentBusinessCommissionPct < 0 || customParentBusinessCommissionPct > 0.2) {
        return NextResponse.json(
          { error: "Parent business commission percentage moet tussen 0% en 20% zijn" },
          { status: 400 }
        );
      }
      updateData.customParentBusinessCommissionPct = customParentBusinessCommissionPct;
    }

    // Update sub-affiliate
    const updatedSubAffiliate = await prisma.affiliate.update({
      where: { id: subAffiliateId },
      data: updateData,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      subAffiliate: {
        id: updatedSubAffiliate.id,
        name: updatedSubAffiliate.user.name,
        email: updatedSubAffiliate.user.email,
        customUserCommissionPct: updatedSubAffiliate.customUserCommissionPct,
        customBusinessCommissionPct: updatedSubAffiliate.customBusinessCommissionPct,
        customParentUserCommissionPct: updatedSubAffiliate.customParentUserCommissionPct,
        customParentBusinessCommissionPct: updatedSubAffiliate.customParentBusinessCommissionPct,
      },
      message: "Commissie percentages succesvol bijgewerkt",
    });
  } catch (error: any) {
    console.error("Error updating sub-affiliate commission:", error);
    return NextResponse.json(
      { error: "Failed to update commission percentages", details: error.message },
      { status: 500 }
    );
  }
}








