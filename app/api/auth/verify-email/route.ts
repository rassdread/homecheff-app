import { NextRequest, NextResponse } from "next/server";
import { completeEmailVerificationWithToken } from "@/lib/complete-email-verification";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const token = typeof body?.token === "string" ? body.token : "";
    const result = await completeEmailVerificationWithToken(token);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({
      success: true,
      message: result.message,
      user: result.user,
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      {
        error:
          "Er is een fout opgetreden bij het verifiëren van je e-mailadres",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token") ?? "";
    const result = await completeEmailVerificationWithToken(token);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({
      success: true,
      message: result.message,
      user: result.user,
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      {
        error:
          "Er is een fout opgetreden bij het verifiëren van je e-mailadres",
      },
      { status: 500 }
    );
  }
}
