/**
 * Delete Sub-Affiliate API
 * 
 * DELETE /api/affiliate/delete-sub
 * Allows a parent affiliate to delete/remove their sub-affiliates
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subAffiliateId = searchParams.get('subAffiliateId');

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
        { error: "MUST_BE_AFFILIATE_TO_DELETE" },
        { status: 403 }
      );
    }

    // Get sub-affiliate and verify it belongs to this parent
    const subAffiliate = await prisma.affiliate.findUnique({
      where: { id: subAffiliateId },
      include: { 
        parentAffiliate: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!subAffiliate) {
      return NextResponse.json(
        { error: "Sub-affiliate niet gevonden" },
        { status: 404 }
      );
    }

    if (subAffiliate.parentAffiliateId !== parentUser.affiliate.id) {
      return NextResponse.json(
        { error: "NO_PERMISSION_TO_DELETE" },
        { status: 403 }
      );
    }

    // Delete the sub-affiliate (this will cascade delete related data)
    // Note: Historical commissions and attributions are preserved via foreign keys
    await prisma.affiliate.delete({
      where: { id: subAffiliateId },
    });

    return NextResponse.json({
      success: true,
      message: `Sub-affiliate ${subAffiliate.user.name} (${subAffiliate.user.email}) succesvol verwijderd`,
    });
  } catch (error: any) {
    console.error("Error deleting sub-affiliate:", error);
    return NextResponse.json(
      { error: "Failed to delete sub-affiliate", details: error.message },
      { status: 500 }
    );
  }
}




