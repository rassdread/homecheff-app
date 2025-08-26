/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma, ProductCategory } from "@prisma/client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const c = searchParams.get("category");

  const where: Prisma.ProductWhereInput = { isActive: true };
  if (c === "CHEFF" || c === "GROWN" || c === "DESIGNER") {
    where.category = c as ProductCategory;
  }

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      priceCents: true,
      unit: true,
      delivery: true,
      createdAt: true,
      images: { select: { fileUrl: true, sortOrder: true }, take: 1, orderBy: { sortOrder: "asc" } },
    },
  });

  return NextResponse.json({ items: products });
}
