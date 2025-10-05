import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    let targetUserId: string;
    
    if (userId) {
      // For public profile - get follows for specific user
      targetUserId = userId;
    } else {
      // For private profile - get follows for current user
      const email = await getEmail();
      const me = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (!me) return NextResponse.json({ items: [] });
      targetUserId = me.id;
    }

    const anyPrisma: any = prisma as any;
    if (!anyPrisma.follow?.findMany) return NextResponse.json({ items: [] });

    const items = await anyPrisma.follow.findMany({
      where: { followerId: targetUserId },
      orderBy: { createdAt: "desc" },
      include: { 
        seller: { 
          select: { 
            id: true, 
            name: true, 
            username: true,
            profileImage: true,
            displayFullName: true,
            displayNameOption: true
          } 
        } 
      }
    });
    return NextResponse.json({ items });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Kon fan-lijst niet laden" }, { status: 500 });
  }
}
