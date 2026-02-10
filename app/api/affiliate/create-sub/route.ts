/**
 * Create Sub-Affiliate API
 * 
 * POST /api/affiliate/create-sub
 * Allows an affiliate to create a sub-affiliate account for another user
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { email, name } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email en naam zijn verplicht" },
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
        { error: "Je moet zelf affiliate zijn om een sub-affiliate aan te maken" },
        { status: 403 }
      );
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { email },
      include: { affiliate: true },
    });

    // If user exists and already has affiliate account, return error
    if (targetUser?.affiliate) {
      return NextResponse.json(
        { error: "Deze gebruiker heeft al een affiliate account" },
        { status: 409 }
      );
    }

    // If user exists but doesn't have affiliate account, create it directly
    if (targetUser && !targetUser.affiliate) {
      // Create sub-affiliate account with parent relationship
      const subAffiliate = await prisma.affiliate.create({
        data: {
          userId: targetUser.id,
          parentAffiliateId: parentUser.affiliate.id,
          status: 'ACTIVE',
        },
      });

      // Generate referral link code
      const referralCode = `REF${targetUser.id.slice(0, 8).toUpperCase()}${randomBytes(2).toString('hex').toUpperCase()}`;
      
      await prisma.referralLink.create({
        data: {
          affiliateId: subAffiliate.id,
          code: referralCode,
        },
      });

      return NextResponse.json({
        subAffiliate: {
          id: subAffiliate.id,
          userId: targetUser.id,
          email: targetUser.email,
          name: targetUser.name,
          referralCode,
        },
        inviteLink: null, // No invite needed, account created directly
        message: "Sub-affiliate account succesvol aangemaakt",
      });
    }

    // User doesn't exist - create invite
    // Check if invite already exists for this email
    const existingInvite = await prisma.subAffiliateInvite.findFirst({
      where: {
        email: email.toLowerCase(),
        parentAffiliateId: parentUser.affiliate.id,
        status: 'PENDING',
        expiresAt: {
          gt: new Date(), // Not expired
        },
      },
    });

    if (existingInvite) {
      const inviteLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://homecheff.nl'}/affiliate/sub-affiliate-signup?token=${existingInvite.inviteToken}`;
      return NextResponse.json({
        subAffiliate: null,
        invite: {
          id: existingInvite.id,
          email: existingInvite.email,
          inviteToken: existingInvite.inviteToken,
          inviteLink,
        },
        message: "Er bestaat al een actieve uitnodiging voor dit e-mailadres",
      });
    }

    // Create new invite
    const inviteToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const invite = await prisma.subAffiliateInvite.create({
      data: {
        parentAffiliateId: parentUser.affiliate.id,
        email: email.toLowerCase(),
        name: name || null,
        inviteToken,
        status: 'PENDING',
        expiresAt,
      },
    });

    const inviteLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://homecheff.nl'}/affiliate/sub-affiliate-signup?token=${inviteToken}`;

    return NextResponse.json({
      subAffiliate: null,
      invite: {
        id: invite.id,
        email: invite.email,
        name: invite.name,
        inviteToken: invite.inviteToken,
        inviteLink,
      },
      message: "Uitnodiging verstuurd. De persoon ontvangt een link om zich aan te melden.",
    });
  } catch (error: any) {
    console.error("Error creating sub-affiliate account:", error);
    return NextResponse.json(
      { error: "Failed to create sub-affiliate account", details: error.message },
      { status: 500 }
    );
  }
}

