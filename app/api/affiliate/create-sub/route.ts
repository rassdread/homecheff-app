/**
 * Create a partner invite under the signed-in MAIN affiliate.
 *
 * POST /api/affiliate/create-sub
 * Reuses SubAffiliateInvite + Affiliate.parentAffiliateId.
 * Does not create a second hierarchy, User, or Stripe account.
 */

import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tryNormalizeEmail } from "@/lib/auth/normalize-email";
import { getPublicAppUrl } from "@/lib/public-app-url";
import { sendTransactionalEmail } from "@/lib/email/idempotent-send";
import { EMAIL_PRIORITY } from "@/lib/email/priority";
import {
  decideMainCanInvite,
  forgedParentRejected,
} from "@/lib/affiliates/partner-hierarchy";
import {
  partnerInviteEmailCopy,
  type PartnerInviteLocale,
} from "@/lib/affiliates/partner-invite-email-copy";

export const dynamic = "force-dynamic";

function inviteUrl(token: string): string {
  return `${getPublicAppUrl()}/affiliate/sub-affiliate-signup?token=${encodeURIComponent(token)}`;
}

function inviteLocale(value: unknown): PartnerInviteLocale {
  return value === "en" ? "en" : "nl";
}

async function sendPartnerInviteEmail(input: {
  to: string;
  inviterName: string;
  inviteeName: string | null;
  url: string;
  inviteId: string;
  expiresAt: Date;
  locale: PartnerInviteLocale;
}): Promise<{ sent: boolean; subject: string; text: string }> {
  const expires = input.expiresAt.toLocaleDateString(input.locale === "en" ? "en-GB" : "nl-NL");
  const copy = partnerInviteEmailCopy({
    locale: input.locale,
    inviterName: input.inviterName,
    url: input.url,
    expiresLabel: expires,
  });
  const greeting = input.inviteeName?.trim()
    ? input.locale === "en"
      ? `Hello ${input.inviteeName.trim()},`
      : `Hallo ${input.inviteeName.trim()},`
    : input.locale === "en"
      ? "Hello,"
      : "Hallo,";
  const safeGreeting = greeting
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const text = [greeting, "", copy.text].join("\n");
  const html = `<p>${safeGreeting}</p>${copy.html}`;
  try {
    const result = await sendTransactionalEmail({
      to: input.to,
      subject: copy.subject,
      text,
      html,
      eventType: "partner_invite",
      priority: EMAIL_PRIORITY.P1,
      route: "affiliate/create-sub",
      idempotencyKey: `partner-invite:${input.inviteId}`,
      businessEventId: input.inviteId,
    });
    return { sent: result.status === "sent", subject: copy.subject, text };
  } catch (error) {
    console.error("[partner-invite] email failed");
    return { sent: false, subject: copy.subject, text };
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const email = tryNormalizeEmail(body?.email);
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email en naam zijn verplicht" },
        { status: 400 },
      );
    }

    const parentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { affiliate: true },
    });

    if (!parentUser?.affiliate) {
      return NextResponse.json(
        { error: "Je moet zelf affiliate zijn om een partner uit te nodigen" },
        { status: 403 },
      );
    }

    if (forgedParentRejected(body?.parentAffiliateId, parentUser.affiliate.id)) {
      return NextResponse.json(
        { error: "Ongeldige partnerrelatie", code: "FORGED_PARENT" },
        { status: 403 },
      );
    }

    const { resolveStoredAffiliateCapabilities } = await import("@/lib/affiliate/program-store");
    const { decideSubInvite } = await import("@/lib/affiliate/program-control");
    const resolved = await resolveStoredAffiliateCapabilities(parentUser.affiliate.id);
    const decision = decideMainCanInvite({
      parentAffiliateId: parentUser.affiliate.parentAffiliateId,
      status: parentUser.affiliate.status,
      email: parentUser.email,
      targetEmail: email,
      canInviteSubs: resolved.capabilities.CAN_INVITE_SUB_AFFILIATES.value,
    });
    const [childCount, pendingInvites] = await Promise.all([
      prisma.affiliate.count({ where: { parentAffiliateId: parentUser.affiliate.id } }),
      prisma.subAffiliateInvite.count({
        where: {
          parentAffiliateId: parentUser.affiliate.id,
          status: "PENDING",
          expiresAt: { gt: new Date() },
        },
      }),
    ]);
    const limitDecision = decideSubInvite({
      resolved,
      hasParent: Boolean(parentUser.affiliate.parentAffiliateId),
      childCount,
      pendingInvites,
      adminForce: false,
    });
    if (!limitDecision.ok) {
      return NextResponse.json(
        {
          error:
            limitDecision.code === "SUB_LIMIT"
              ? "Je hebt het aantal partners bereikt dat bij jouw programma hoort."
              : "Je affiliate-account kan nu geen partners uitnodigen.",
          code: limitDecision.code,
        },
        { status: 422 },
      );
    }

    if (!decision.ok) {
      const message =
        decision.code === "PARENT_IS_PARTNER"
          ? "Als partner kun je geen verdere partners aanmaken. Alleen een MAIN affiliate kan partners uitnodigen."
          : decision.code === "SELF_PARENT"
            ? "Je kunt jezelf niet als partner uitnodigen."
            : "Je affiliate-account kan nu geen partners uitnodigen.";
      return NextResponse.json(
        { error: message, code: decision.code },
        { status: 422 },
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { email },
      include: { affiliate: { select: { id: true, parentAffiliateId: true } } },
    });

    if (targetUser?.affiliate) {
      return NextResponse.json(
        {
          error:
            "Deze gebruiker heeft al een affiliate-account. Er wordt geen tweede account of Stripe-koppeling gemaakt.",
          code: "ALREADY_AFFILIATE",
        },
        { status: 409 },
      );
    }

    const existingInvite = await prisma.subAffiliateInvite.findFirst({
      where: {
        email,
        parentAffiliateId: parentUser.affiliate.id,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    const invite =
      existingInvite ??
      (await prisma.subAffiliateInvite.create({
        data: {
          parentAffiliateId: parentUser.affiliate.id,
          email,
          name: name || null,
          inviteToken: randomBytes(32).toString("hex"),
          status: "PENDING",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      }));

    const link = inviteUrl(invite.inviteToken);
    const emailResult = await sendPartnerInviteEmail({
      to: email,
      inviterName: parentUser.name || parentUser.username || "Een HomeCheff-partner",
      inviteeName: name,
      url: link,
      inviteId: invite.id,
      expiresAt: invite.expiresAt,
      locale: inviteLocale(body?.locale),
    });

    return NextResponse.json({
      subAffiliate: null,
      invite: {
        id: invite.id,
        email: invite.email,
        name: invite.name,
        inviteLink: link,
        expiresAt: invite.expiresAt,
        emailSent: emailResult.sent,
        emailSubject: emailResult.subject,
        emailText: emailResult.text,
        existingUser: Boolean(targetUser),
      },
      message: emailResult.sent
        ? "Uitnodiging klaar. We hebben ook een e-mail gestuurd."
        : "Uitnodiging klaar. Deel de link; de e-mail kon niet worden verstuurd.",
    });
  } catch (error) {
    console.error("Error creating partner invite:", error);
    return NextResponse.json(
      { error: "Failed to create partner invite" },
      { status: 500 },
    );
  }
}
