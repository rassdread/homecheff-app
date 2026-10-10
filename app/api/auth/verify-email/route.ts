import { NextRequest, NextResponse } from "next/server";
import {
  completeEmailVerificationWithToken,
  verificationHttpBody,
} from "@/lib/complete-email-verification";
import { maybeAcceptPartnerInviteFromRequest } from "@/lib/affiliates/accept-partner-invite";
import { verificationClientIp } from "@/lib/verification-attempt-limit";

export const dynamic = "force-dynamic";

async function verify(req: NextRequest, token: string, email: string | null) {
  const result = await completeEmailVerificationWithToken(token, {
    email,
    ip: verificationClientIp(req.headers.get("x-forwarded-for")),
  });
  const http = verificationHttpBody(result);
  if (result.ok) {
    await maybeAcceptPartnerInviteFromRequest({
      userId: result.user.id,
      cookieHeader: req.headers.get("cookie"),
    });
  }
  return NextResponse.json(http.body, { status: http.status });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const token = typeof body?.token === "string" ? body.token : "";
    const email = typeof body?.email === "string" ? body.email : null;
    return await verify(req, token, email);
  } catch (error) {
    console.error("Email verification error:", error instanceof Error ? error.name : "error");
    return NextResponse.json(
      {
        success: false,
        code: "SERVER",
        error: "Er is een fout opgetreden bij het verifiëren van je e-mailadres",
      },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token") ?? "";
    const email = searchParams.get("email");
    return await verify(req, token, email);
  } catch (error) {
    console.error("Email verification error:", error instanceof Error ? error.name : "error");
    return NextResponse.json(
      {
        success: false,
        code: "SERVER",
        error: "Er is een fout opgetreden bij het verifiëren van je e-mailadres",
      },
      { status: 500 },
    );
  }
}
