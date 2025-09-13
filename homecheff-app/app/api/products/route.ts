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

    const listings = await prisma.listing.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(take, 1), 100),
      include: {
        User: {
          select: { id: true, name: true, image: true, username: true },
        },
        ListingMedia: {
          where: { order: 0 },
          take: 1,
        },
      },
    });

    const items = listings.map((l: any) => ({
      id: l.id,
      title: l.title,
      description: l.description,
      priceCents: l.priceCents,
      image: l.ListingMedia?.[0]?.url ?? null,
      createdAt: l.createdAt,
      category: l.category,
      subcategory: null, // Not available in listing table
      seller: {
        id: l.User?.id ?? null,
        name: l.User?.name ?? null,
        avatar: l.User?.image ?? null,
        username: l.User?.username ?? null,
        buyerTypes: [], // Not available in user model
      },
    }));

    return NextResponse.json({ items });
  } catch (err) {
    console.error("[GET /api/products]", err);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
