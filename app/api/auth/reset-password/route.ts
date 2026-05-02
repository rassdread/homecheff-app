import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const RESET_PREFIX = "password-reset:";

const MIN_LEN = 6;

/**
 * POST { token, password } — nieuw wachtwoord na geldige reset-token (1 uur).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!token) {
      return NextResponse.json(
        { error: "Ongeldige of ontbrekende link." },
        { status: 400 }
      );
    }
    if (password.length < MIN_LEN) {
      return NextResponse.json(
        { error: `Wachtwoord moet minimaal ${MIN_LEN} tekens zijn.` },
        { status: 400 }
      );
    }

    const vt = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (
      !vt ||
      !vt.identifier.startsWith(RESET_PREFIX) ||
      vt.expires < new Date()
    ) {
      return NextResponse.json(
        {
          error:
            "Deze link is ongeldig of verlopen. Vraag opnieuw een wachtwoord-reset aan.",
        },
        { status: 400 }
      );
    }

    const email = vt.identifier.slice(RESET_PREFIX.length);
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (!user) {
      await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
      return NextResponse.json(
        { error: "Account niet gevonden." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.verificationToken.delete({ where: { token } }),
    ]);

    return NextResponse.json({
      ok: true,
      message: "Je wachtwoord is bijgewerkt. Je kunt nu inloggen.",
    });
  } catch (e) {
    console.error("[reset-password]", e);
    return NextResponse.json(
      { error: "Er ging iets mis. Probeer het opnieuw." },
      { status: 500 }
    );
  }
}
