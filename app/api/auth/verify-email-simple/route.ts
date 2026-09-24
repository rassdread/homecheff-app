import { NextRequest, NextResponse } from "next/server";
import { completeEmailVerificationWithToken } from "@/lib/complete-email-verification";
import { maybeAcceptPartnerInviteFromRequest } from "@/lib/affiliates/accept-partner-invite";

export const dynamic = "force-dynamic";

/**
 * Zelfde gedrag als GET /api/auth/verify-email — gebruikt door /verify-email (client fetch verwacht JSON).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token") ?? "";
  const result = await completeEmailVerificationWithToken(token);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  await maybeAcceptPartnerInviteFromRequest({
    userId: result.user.id,
    cookieHeader: req.headers.get("cookie"),
  });
  return NextResponse.json({
    success: true,
    message: result.message,
    user: result.user,
  });
}
