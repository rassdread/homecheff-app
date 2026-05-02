import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MIN_LEN = 8;

/**
 * Wachtwoord wijzigen (bestaand hash) of koppelen (geen hash, o.a. alleen Google-login).
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const newPassword =
      typeof body?.newPassword === "string" ? body.newPassword : "";
    const currentPassword =
      typeof body?.currentPassword === "string" ? body.currentPassword : "";

    if (!newPassword || newPassword.length < MIN_LEN) {
      return NextResponse.json(
        {
          error: `Nieuw wachtwoord moet minimaal ${MIN_LEN} tekens zijn.`,
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Gebruiker niet gevonden" }, { status: 404 });
    }

    if (user.passwordHash) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Voer je huidige wachtwoord in." },
          { status: 400 }
        );
      }
      const ok = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!ok) {
        return NextResponse.json(
          { error: "Huidig wachtwoord is onjuist." },
          { status: 400 }
        );
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[profile/password]", e);
    return NextResponse.json(
      { error: "Er ging iets mis. Probeer het later opnieuw." },
      { status: 500 }
    );
  }
}
