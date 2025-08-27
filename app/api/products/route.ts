/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma, ProductCategory } from "@prisma/client";

export async function GET(req: Request) {
  try {
    console.log('GET /api/products called');
    const { searchParams } = new URL(req.url);
    const c = searchParams.get("category");

    const where: Prisma.ProductWhereInput = { isActive: true };
    if (c === "CHEFF" || c === "GROWN" || c === "DESIGNER") {
      where.category = c as ProductCategory;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        images: {
          select: { fileUrl: true, sortOrder: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    // Optionally, only return the first image for each product
    const items = products.map(product => ({
      ...product,
      images: product.images ? [product.images[0]] : [],
    }));

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch products", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
