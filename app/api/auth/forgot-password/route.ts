import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { generateVerificationToken } from "@/lib/verification";

export const dynamic = "force-dynamic";

const RESET_PREFIX = "password-reset:";

/**
 * POST { email } — stuurt resetmail voor accounts met wachtwoord (niet alleen-Google).
 * Zelfde JSON bij onbekend e-mailadres (geen user enumeration).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const rawEmail = typeof body?.email === "string" ? body.email.trim() : "";
    if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      return NextResponse.json(
        { error: "Voer een geldig e-mailadres in." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: rawEmail, mode: "insensitive" } },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        passwordHash: true,
      },
    });

    const genericOk = NextResponse.json({
      ok: true,
      message:
        "Als dit e-mailadres bij ons bekend is en een wachtwoord heeft, ontvang je zo een e-mail met een link. Controleer ook je spammap.",
    });

    if (!user?.passwordHash) {
      return genericOk;
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("[forgot-password] RESEND_API_KEY ontbreekt — geen mail verstuurd");
      return NextResponse.json(
        {
          error:
            "E-mail kan momenteel niet worden verstuurd. Neem contact op met support@homecheff.eu of probeer het later opnieuw.",
        },
        { status: 503 }
      );
    }

    const identifier = `${RESET_PREFIX}${user.email}`;
    const token = generateVerificationToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.verificationToken.deleteMany({ where: { identifier } });

    await prisma.verificationToken.create({
      data: { identifier, token, expires },
    });

    const base = (process.env.NEXTAUTH_URL || "https://homecheff.eu").replace(
      /\/$/,
      ""
    );
    const resetUrl = `${base}/reset-password?token=${encodeURIComponent(token)}`;

    try {
      await sendPasswordResetEmail({
        email: user.email,
        name: user.name || user.username || "daar",
        resetUrl,
      });
    } catch (e) {
      console.error("[forgot-password] Resend failed:", e);
      await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
      return NextResponse.json(
        {
          error:
            "De reset-e-mail kon niet worden verstuurd. Probeer het later opnieuw of neem contact op met support@homecheff.eu.",
        },
        { status: 502 }
      );
    }

    return genericOk;
  } catch (e) {
    console.error("[forgot-password]", e);
    return NextResponse.json(
      { error: "Er ging iets mis. Probeer het later opnieuw." },
      { status: 500 }
    );
  }
}
