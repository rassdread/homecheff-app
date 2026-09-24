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

export const dynamic = "force-dynamic";

function inviteUrl(token: string): string {
  return `${getPublicAppUrl()}/affiliate/sub-affiliate-signup?token=${encodeURIComponent(token)}`;
}

async function sendPartnerInviteEmail(input: {
  to: string;
  inviterName: string;
  inviteeName: string | null;
  url: string;
  inviteId: string;
  expiresAt: Date;
}): Promise<boolean> {
  const who = input.inviterName.trim() || "Een HomeCheff-partner";
  const greeting = input.inviteeName?.trim()
    ? `Hallo ${input.inviteeName.trim()},`
    : "Hallo,";
  const expires = input.expiresAt.toLocaleDateString("nl-NL");
  const text = [
    greeting,
    "",
    `${who} nodigt je uit voor het HomeCheff partnerprogramma.`,
    "Je krijgt een eigen partneraccount om HomeCheff te promoten in je eigen netwerk of regio.",
    "",
    `Open je uitnodiging: ${input.url}`,
    "",
    `De link is persoonlijk en geldig tot ${expires}.`,
    "HomeCheff vraagt nooit om je wachtwoord per e-mail.",
  ].join("\n");
  const html = `
    <p>${greeting}</p>
    <p><strong>${who}</strong> nodigt je uit voor het HomeCheff partnerprogramma.</p>
    <p>Je krijgt een eigen partneraccount om HomeCheff te promoten in je eigen netwerk of regio.</p>
    <p><a href="${input.url}">Uitnodiging openen</a></p>
    <p>De link is persoonlijk en geldig tot ${expires}. HomeCheff vraagt nooit om je wachtwoord per e-mail.</p>
  `;
  try {
    const result = await sendTransactionalEmail({
      to: input.to,
      subject: `${who} nodigt je uit als HomeCheff-partner`,
      text,
      html,
      eventType: "partner_invite",
      priority: EMAIL_PRIORITY.P1,
      route: "affiliate/create-sub",
      idempotencyKey: `partner-invite:${input.inviteId}`,
      businessEventId: input.inviteId,
    });
    return result.status === "sent";
  } catch (error) {
    console.error("[partner-invite] email failed");
    return false;
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

    const decision = decideMainCanInvite({
      parentAffiliateId: parentUser.affiliate.parentAffiliateId,
      status: parentUser.affiliate.status,
      email: parentUser.email,
      targetEmail: email,
    });
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
    const emailSent = await sendPartnerInviteEmail({
      to: email,
      inviterName: parentUser.name || parentUser.username || "Een HomeCheff-partner",
      inviteeName: name,
      url: link,
      inviteId: invite.id,
      expiresAt: invite.expiresAt,
    });

    return NextResponse.json({
      subAffiliate: null,
      invite: {
        id: invite.id,
        email: invite.email,
        name: invite.name,
        inviteLink: link,
        expiresAt: invite.expiresAt,
        emailSent,
        existingUser: Boolean(targetUser),
      },
      message: emailSent
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
