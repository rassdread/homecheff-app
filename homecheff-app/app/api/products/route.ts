import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Cache voor 5 minuten voor betere performance
export const revalidate = 300;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const prisma = (globalThis as any).__prisma ?? new PrismaClient();
if (!(globalThis as any).__prisma) (globalThis as any).__prisma = prisma;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const take = Number(searchParams.get("take") ?? 24);

    const dishes = await prisma.dish.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(take, 1), 100),
      include: {
        user: {
          select: { id: true, name: true, image: true, username: true, buyerTypes: true },
        },
        photos: {
          where: { isMain: true },
          take: 1,
        },
      },
    });

    const items = dishes.map((d: any) => ({
      id: d.id,
      title: d.title,
      description: d.description,
      priceCents: d.priceCents,
      image: d.photos?.[0]?.url ?? null,
      createdAt: d.createdAt,
      category: d.category,
      subcategory: d.subcategory,
      seller: {
        id: d.user?.id ?? null,
        name: d.user?.name ?? null,
        avatar: d.user?.image ?? null,
        username: d.user?.username ?? null,
        buyerTypes: d.user?.buyerTypes ?? [],
      },
    }));

    return NextResponse.json({ items });
  } catch (err) {
    console.error("[GET /api/products]", err);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
