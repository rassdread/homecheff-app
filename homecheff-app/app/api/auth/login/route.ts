// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Ongeldige body" }, { status: 400 });

    const { emailOrUsername, password } = body as { emailOrUsername: string; password: string };
    if (!emailOrUsername || !password) {
      return NextResponse.json({ error: "E-mail/gebruikersnaam en wachtwoord vereist" }, { status: 400 });
    }

    // Check if it's an email or username
    const isEmail = emailOrUsername.includes('@');
    const user = await prisma.user.findUnique({ 
      where: isEmail ? { email: emailOrUsername } : { username: emailOrUsername }
    });
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Onjuiste gegevens" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return NextResponse.json({ error: "Onjuiste gegevens" }, { status: 401 });

    // TODO: zet echte sessie/JWT
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Fout bij inloggen" }, { status: 500 });
  }
}
