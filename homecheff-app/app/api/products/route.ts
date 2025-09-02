import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const prisma = (globalThis as any).__prisma ?? new PrismaClient();
if (!(globalThis as any).__prisma) (globalThis as any).__prisma = prisma;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const take = Number(searchParams.get("take") ?? 24);

    const listings = await prisma.listing.findMany({
      where: { isPublished: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: Math.min(Math.max(take, 1), 100),
      include: {
        author: {
          select: { id: true, name: true, image: true, username: true },
        },
      },
    });

    const items = listings.map((l: any) => ({
      id: l.id,
      title: l.title,
      description: l.description,
      priceCents: l.priceCents,
      image: l.image ?? null,
      createdAt: l.publishedAt ?? l.createdAt,
      seller: {
        id: l.author?.id ?? null,
        name: l.author?.name ?? null,
        avatar: l.author?.image ?? null,
        username: l.author?.username ?? null,
      },
    }));

    return NextResponse.json({ items });
  } catch (err) {
    console.error("[GET /api/products]", err);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
