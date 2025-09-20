import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Cache voor 5 minuten voor betere performance
export const revalidate = 300;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const take = Number(searchParams.get("take") ?? 24);

    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(take, 1), 100),
      include: {
        seller: {
          include: {
            User: {
              select: { 
                id: true, 
                name: true, 
                profileImage: true, 
                username: true,
                buyerRoles: true
              },
            }
          }
        },
        Image: {
          where: { sortOrder: 0 },
          take: 1,
        },
      },
    });

    const items = products.map((p: any) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      priceCents: p.priceCents,
      image: p.Image?.[0]?.fileUrl ?? null,
      createdAt: p.createdAt,
      category: p.category,
      subcategory: null, // Could be added to Product schema if needed
      seller: {
        id: p.seller?.User?.id ?? null,
        name: p.seller?.User?.name ?? null,
        avatar: p.seller?.User?.profileImage ?? null,
        username: p.seller?.User?.username ?? null,
        buyerTypes: p.seller?.User?.buyerRoles ?? [],
      },
    }));

    return NextResponse.json({ items });
  } catch (err) {
    console.error("[GET /api/products]", err);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
