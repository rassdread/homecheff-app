import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  let userId = req.nextUrl.searchParams.get("userId");
  if (userId === "me") {
    // NextAuth v5
    try {
      const mod: any = await import("@/lib/auth");
      const session = await mod.auth?.();
      const email: string | undefined = session?.user?.email;
      if (email) {
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, name: true, username: true, email: true, image: true,  bio: true, role: true },
        });
        return NextResponse.json({ user });
      }
    } catch {}
    // NextAuth v4
    try {
      const { getServerSession } = await import("next-auth");
      const { authOptions } = await import("@/lib/auth");
      const session = await getServerSession(authOptions as any);
      const email: string | undefined = (session as any)?.user?.email;
      if (email) {
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, name: true, username: true, email: true, image: true,  bio: true, role: true },
        });
        return NextResponse.json({ user });
      }
    } catch {}
    return NextResponse.json({ user: null });
  }
  if (!userId) {
    return NextResponse.json({ error: "userId ontbreekt" }, { status: 400 });
  }
  try {
    const profile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
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

