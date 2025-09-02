import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId ontbreekt" }, { status: 400 });
}
  try {
    const profile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
        bio: true,
        role: true,
      },
    });
    if (!profile) {
      return NextResponse.json({ error: "Profiel niet gevonden" }, { status: 404 });
    }
  return NextResponse.json({ user: profile });
  } catch (e) {
    return NextResponse.json({ error: "Kon profiel niet laden" }, { status: 500 });
  }
}

