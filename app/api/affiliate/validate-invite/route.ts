/**
 * Validate Sub-Affiliate Invite API
 * 
 * GET /api/affiliate/validate-invite?token=...
 * Validates an invite token and returns invite details
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: "Token is vereist" },
        { status: 400 }
      );
    }

    // Find invite
    const invite = await prisma.subAffiliateInvite.findUnique({
      where: { inviteToken: token },
      include: {
        parentAffiliate: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json(
        { valid: false, error: "Uitnodiging niet gevonden" },
        { status: 404 }
      );
    }

    // Check if invite is expired
    if (invite.expiresAt < new Date()) {
      return NextResponse.json(
        { valid: false, error: "Deze uitnodiging is verlopen" },
        { status: 400 }
      );
    }

    // Check if invite is already accepted
    if (invite.status === 'ACCEPTED') {
      return NextResponse.json(
        { valid: false, error: "Deze uitnodiging is al geaccepteerd" },
        { status: 400 }
      );
    }

    // Check if email already has user account
    const existingUser = await prisma.user.findUnique({
      where: { email: invite.email },
      include: { affiliate: true },
    });

    return NextResponse.json({
      valid: true,
      invite: {
        id: invite.id,
        email: invite.email,
        name: invite.name,
        parentAffiliateName: invite.parentAffiliate.user.name,
        parentAffiliateEmail: invite.parentAffiliate.user.email,
        expiresAt: invite.expiresAt,
      },
      existingUser: existingUser ? {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        hasAffiliate: !!existingUser.affiliate,
      } : null,
    });
  } catch (error: any) {
    console.error("Error validating invite:", error);
    return NextResponse.json(
      { error: "Failed to validate invite", details: error.message },
      { status: 500 }
    );
  }
}


