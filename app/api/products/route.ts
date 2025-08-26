import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") as any; // CHEFF | GROWN | DESIGNER | null

  const where: any = { isActive: true };
  if (category) where.category = category;

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, description: true,
      category: true, priceCents: true, unit: true, delivery: true, createdAt: true,
    },
  });

  return NextResponse.json({ items: products });
}
