import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getEmail() {
  try {
    const mod: any = await import("@/lib/auth");
    const session = await mod.auth?.();
    if (session?.user?.email) return session.user.email as string;
  } catch {}
  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    const session = await getServerSession(authOptions as any);
    if ((session as any)?.user?.email) return (session as any).user.email as string;
  } catch {}
  return "test@homecheff.local";
}

export async function GET() {
  try {
    const email = await getEmail();
    const me = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!me) return NextResponse.json({ items: [] });

    const anyPrisma: any = prisma as any;
    if (!anyPrisma.follow?.findMany) return NextResponse.json({ items: [] });

    const items = await anyPrisma.follow.findMany({
      where: { followerId: me.id },
      orderBy: { createdAt: "desc" },
  include: { Seller: { select: { id: true, name: true, image: true } } }
    });
    return NextResponse.json({ items });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ items: [] });
  }
}
