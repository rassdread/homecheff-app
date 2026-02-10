export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseIntOr(d: any, fallback: number) {
  const n = parseInt(String(d), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseIntOr(searchParams.get("page"), 1);
    const perPage = parseIntOr(searchParams.get("perPage"), 10);

    const email = await getEmail();
    const me = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!me) return NextResponse.json({ items: [], meta: { page, perPage, totalPages: 1, total: 0 } });

    const anyPrisma: any = prisma as any;
    if (!anyPrisma.order?.findMany) {
      return NextResponse.json({ items: [], meta: { page, perPage, totalPages: 1, total: 0 } });
    }

    const where = { userId: me.id };
    const total = await anyPrisma.order.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const items = await anyPrisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        items: {
          select: {
            id: true,
            quantity: true,
            priceCents: true,
            productId: true,
            Product: {
              select: {
                id: true,
                title: true,
                priceCents: true,
                description: true,
                category: true,
                sellerId: true,
                createdAt: true,
                isActive: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ items, meta: { page, perPage, totalPages, total } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ items: [], meta: { page: 1, perPage: 10, totalPages: 1, total: 0 } }, { status: 200 });
  }
}
