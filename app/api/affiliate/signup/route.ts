/**
 * Affiliate Signup API
 *
 * POST /api/affiliate/signup
 * Creates a personal affiliate for the authenticated user after explicit agreement.
 * Does not grant seller, delivery, admin, or other roles.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { activatePersonalAffiliate } from "@/lib/affiliate/activate-affiliate";
import { enrollAffiliate, loadPublicPresentation } from "@/lib/affiliate/program-store";
import { maybeAcceptPartnerInviteFromRequest } from "@/lib/affiliates/accept-partner-invite";

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

    if (!acceptAffiliateAgreement && user.affiliate?.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: "Je moet het affiliate programma overeenkomst accepteren om door te gaan" },
        { status: 400 }
      );
    }

    const updateData: {
      privacyPolicyAccepted?: boolean;
      privacyPolicyAcceptedAt?: Date;
      termsAccepted?: boolean;
      termsAcceptedAt?: Date;
    } = {};
    if (acceptPrivacyPolicy && !user.privacyPolicyAccepted) {
      updateData.privacyPolicyAccepted = true;
      updateData.privacyPolicyAcceptedAt = new Date();
    }
    if (acceptTerms && !user.termsAccepted) {
      updateData.termsAccepted = true;
      updateData.termsAcceptedAt = new Date();
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
    }

    await maybeAcceptPartnerInviteFromRequest({
      userId: user.id,
      cookieHeader: req.headers.get("cookie"),
    });
    const existingAffiliate = await prisma.affiliate.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!existingAffiliate) {
      const presentation = await loadPublicPresentation("NL");
      if (presentation.signup.allow !== "ENROLL") {
        return NextResponse.json(
          { error: presentation.copy.lead, code: presentation.signup.allow },
          { status: 403 },
        );
      }
    }
    const activated = await activatePersonalAffiliate(user.id);
    await enrollAffiliate({
      affiliateId: activated.affiliateId,
      source: "PUBLIC_SIGNUP",
      acceptedTerms: true,
      countryCode: "NL",
    });

    if (activated.created) {
      await import('@/lib/analytics/record-acquisition-event.server')
        .then(({ recordAcquisitionEvent }) =>
          recordAcquisitionEvent({
            eventName: 'affiliate_activated',
            dedupeKey: `affiliate:${activated.affiliateId}`,
            userId: user.id,
            properties: { affiliate_id: activated.affiliateId },
          }),
        )
        .catch((e) => console.warn('[acquisition] affiliate_activated', e));
    }

    return NextResponse.json({
      affiliate: {
        id: activated.affiliateId,
        referralCode: activated.referralCode,
      },
      alreadyActive: activated.alreadyActive,
      reactivated: activated.reactivated,
      needsEmailVerification: !user.emailVerified,
      message: activated.created
        ? "Affiliate account successfully created"
        : activated.reactivated
          ? "Affiliate account succesvol gereactiveerd"
          : "Affiliate account bestaat al",
    });
  } catch (error) {
    console.error("Error creating affiliate account:", error);
    return NextResponse.json(
      { error: "Failed to create affiliate account" },
      { status: 500 }
    );
  }
}
