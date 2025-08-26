import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt"; // of "bcryptjs"
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password)
      return NextResponse.json({ error: "Email en wachtwoord vereist" }, { status: 400 });

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: "Bestaat al" }, { status: 409 });

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash: hash }, // role = BUYER by default (schema)
      select: { id: true, email: true },
    });
    return NextResponse.json({ ok: true, user });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
