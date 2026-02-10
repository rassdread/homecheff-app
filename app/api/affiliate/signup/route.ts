/**
 * Affiliate Signup API
 * 
 * POST /api/affiliate/signup
 * Creates a new affiliate account for the authenticated user
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
    const {
      acceptPrivacyPolicy,
      acceptTerms,
      acceptAffiliateAgreement,
    } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { affiliate: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user already has an ACTIVE affiliate account
    // Only ACTIVE affiliates are considered as "already having an account"
    // SUSPENDED affiliates can sign up again (we'll update their existing record)
    if (user.affiliate && user.affiliate.status === 'ACTIVE') {
      return NextResponse.json(
        { error: "User already has an active affiliate account" },
        { status: 409 }
      );
    }
    
    // If user has a SUSPENDED affiliate account, reactivate it instead of creating a new one
    // This preserves historical data (commissions, attributions, etc.)
    if (user.affiliate && user.affiliate.status === 'SUSPENDED') {
      // Reactivate the existing affiliate account
      const reactivatedAffiliate = await prisma.affiliate.update({
        where: { id: user.affiliate.id },
        data: { 
          status: 'ACTIVE',
          // Reset any fields if needed
        },
      });

      // Check if they have a referral link, if not create one
      const existingLink = await prisma.referralLink.findFirst({
        where: { affiliateId: reactivatedAffiliate.id },
      });

      let referralCode = existingLink?.code;
      
      if (!existingLink) {
        // Generate new referral link code
        referralCode = `REF${user.id.slice(0, 8).toUpperCase()}${randomBytes(2).toString('hex').toUpperCase()}`;
        
        await prisma.referralLink.create({
          data: {
            affiliateId: reactivatedAffiliate.id,
            code: referralCode,
          },
        });
      }

      return NextResponse.json({
        affiliate: {
          id: reactivatedAffiliate.id,
          referralCode: referralCode || 'N/A',
        },
        message: "Affiliate account succesvol gereactiveerd",
        reactivated: true,
      });
    }

    // Validate required acceptances
    // For existing users, check if they already accepted, otherwise require new acceptance
    const needsPrivacyAcceptance = !user.privacyPolicyAccepted && !acceptPrivacyPolicy;
    const needsTermsAcceptance = !user.termsAccepted && !acceptTerms;

    if (needsPrivacyAcceptance) {
      return NextResponse.json(
        { error: "Je moet de privacyverklaring accepteren om door te gaan" },
        { status: 400 }
      );
    }

    if (needsTermsAcceptance) {
      return NextResponse.json(
        { error: "Je moet de algemene voorwaarden accepteren om door te gaan" },
        { status: 400 }
      );
    }

    if (!acceptAffiliateAgreement) {
      return NextResponse.json(
        { error: "Je moet het affiliate programma overeenkomst accepteren om door te gaan" },
        { status: 400 }
      );
    }

    // Update user acceptances if provided (for existing users who haven't accepted yet)
    const updateData: any = {};
    if (acceptPrivacyPolicy && !user.privacyPolicyAccepted) {
      updateData.privacyPolicyAccepted = true;
      updateData.privacyPolicyAcceptedAt = new Date();
    }
    if (acceptTerms && !user.termsAccepted) {
      updateData.termsAccepted = true;
      updateData.termsAcceptedAt = new Date();
    }

    // Update user if needed
    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
    }

    // Create affiliate account
    const affiliate = await prisma.affiliate.create({
      data: {
        userId: user.id,
        status: 'ACTIVE',
      },
    });

    // Generate referral link code
    const referralCode = `REF${user.id.slice(0, 8).toUpperCase()}${randomBytes(2).toString('hex').toUpperCase()}`;
    
    await prisma.referralLink.create({
      data: {
        affiliateId: affiliate.id,
        code: referralCode,
      },
    });

    // Update session to include affiliate flag
    // This will be picked up on next session refresh
    // For immediate update, we could trigger a session update, but NextAuth handles this automatically
    
    return NextResponse.json({
      affiliate: {
        id: affiliate.id,
        referralCode,
      },
      message: "Affiliate account successfully created",
    });
  } catch (error: any) {
    console.error("Error creating affiliate account:", error);
    return NextResponse.json(
      { error: "Failed to create affiliate account" },
      { status: 500 }
    );
  }
}

