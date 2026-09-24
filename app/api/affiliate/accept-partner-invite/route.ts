/**
 * Accept a partner invite for the signed-in user.
 * POST /api/affiliate/accept-partner-invite
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { acceptPartnerInviteForUser } from "@/lib/affiliates/accept-partner-invite";
import {
  PARTNER_INVITE_COOKIE,
  resolvePartnerInviteToken,
} from "@/lib/affiliates/partner-hierarchy";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const token = resolvePartnerInviteToken({
    bodyToken: body?.token,
    cookieHeader: req.headers.get("cookie"),
  });
  if (!token) {
    return NextResponse.json(
      { error: "Uitnodiging ontbreekt", code: "INVITE_NOT_FOUND" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const result = await acceptPartnerInviteForUser({ userId: user.id, token });
  if (!result.ok) {
    const status =
      result.code === "ALREADY_AFFILIATE"
        ? 409
        : result.code === "PARENT_IS_PARTNER" || result.code === "SELF_PARENT"
          ? 422
          : result.code === "EMAIL_MISMATCH"
            ? 403
            : 400;
    return NextResponse.json({ error: result.code, code: result.code }, { status });
  }

  const response = NextResponse.json({
    ok: true,
    affiliateId: result.affiliateId,
    created: result.created,
    alreadyLinked: result.alreadyLinked,
  });
  response.cookies.set(PARTNER_INVITE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
