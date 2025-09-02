import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId, bio, interests } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId ontbreekt" }, { status: 400 });

    await prisma.user.update({
      where: { id: userId },
      data: { bio, interests }
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("buyer profile error", e);
    return NextResponse.json({ error: "Kon profiel niet opslaan" }, { status: 500 });
  }
}
