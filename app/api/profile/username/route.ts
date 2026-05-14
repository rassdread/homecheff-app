import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { needsDefinitiveUsername } from "@/lib/account-requirements";
import { validateUsernameCandidate } from "@/lib/username-validation";

/** JSON POST: { "username": "nieuweNaam" } — zelfde regels als profiel-update (eenmalig bij temp-naam). */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const nextUsername =
      typeof body?.username === "string" ? body.username.trim() : "";
    if (!nextUsername) {
      return NextResponse.json(
        { error: "Gebruikersnaam is verplicht" },
        { status: 400 }
      );
    }

    const me = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, username: true },
    });
    if (!me) {
      return NextResponse.json({ error: "Gebruiker niet gevonden" }, { status: 404 });
    }

    const oldName = me.username ?? "";
    if (oldName === nextUsername) {
      return NextResponse.json({ ok: true, username: nextUsername });
    }

    if (!needsDefinitiveUsername(oldName)) {
      return NextResponse.json(
        {
          error:
            "Gebruikersnaam kan niet worden gewijzigd, tenzij je nog een tijdelijke of voorlopige naam hebt. Dat mag maar één keer.",
        },
        { status: 400 }
      );
    }

    const v = await validateUsernameCandidate(nextUsername, {
      excludeUserId: me.id,
      forbidTempSubstring: true,
    });
    if (!v.available) {
      return NextResponse.json({ error: v.message }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: me.id },
      data: { username: nextUsername },
    });

    return NextResponse.json({ ok: true, username: nextUsername });
  } catch (e) {
    console.error("[profile/username]", e);
    return NextResponse.json(
      { error: "Er ging iets mis." },
      { status: 500 }
    );
  }
}
