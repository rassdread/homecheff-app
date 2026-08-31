import { NextRequest, NextResponse } from "next/server";
import {
  markTicketRedeemed,
  mintCanonicalSessionCookies,
  verifyLegacyMigrateTicket,
} from "@/lib/identity/legacy-product-migrate";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Browser redeem: set canonical NextAuth + ecoEpoch cookies, then continue product SSO.
 * GET /auth/legacy-migrate?ticket=...
 */
export async function GET(req: NextRequest) {
  const ticket = req.nextUrl.searchParams.get("ticket")?.trim() ?? "";
  const verified = ticket ? verifyLegacyMigrateTicket(ticket) : null;
  if (!verified) {
    return NextResponse.redirect(
      new URL("/login?error=legacy_migrate_expired", req.url),
      303,
    );
  }

  const firstRedeem = await markTicketRedeemed(verified.nonce, verified.centralUserId);
  if (!firstRedeem) {
    return NextResponse.redirect(
      new URL("/login?error=legacy_migrate_used", req.url),
      303,
    );
  }

  const cookies = await mintCanonicalSessionCookies(verified.centralUserId);
  if (!cookies) {
    return NextResponse.redirect(
      new URL("/login?error=legacy_migrate_session", req.url),
      303,
    );
  }

  await prisma.ssoAuditEvent.create({
    data: {
      action: "LEGACY_MIGRATE_SESSION_MINTED",
      product: verified.returnProduct,
      centralUserId: verified.centralUserId,
      metadata: {
        sourceProduct: verified.sourceProduct,
        sourceUserIdPrefix: verified.sourceUserId.slice(0, 8),
      },
    },
  });

  const productOrigin =
    verified.returnProduct === "studio"
      ? process.env.NEXT_PUBLIC_STUDIO_ORIGIN?.trim() || "https://studio.homecheff.eu"
      : process.env.NEXT_PUBLIC_GROWTH_ORIGIN?.trim() || "https://growth.homecheff.eu";

  const returnTo = verified.returnTo.startsWith("/") ? verified.returnTo : "/growth";
  const continueUrl = new URL("/auth/sso/start", productOrigin);
  continueUrl.searchParams.set("intent", "password");
  continueUrl.searchParams.set("returnTo", returnTo);
  continueUrl.searchParams.set("email", verified.email);

  const res = NextResponse.redirect(continueUrl.toString(), 303);
  res.headers.append("Set-Cookie", cookies.sessionCookie);
  res.headers.append("Set-Cookie", cookies.epochCookie);
  return res;
}
