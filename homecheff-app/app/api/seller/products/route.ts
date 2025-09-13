import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserWithSeller } from "@/lib/currentUser";
import { randomUUID } from "crypto";

export async function GET() {
  const user = await getCurrentUserWithSeller() as any;
  if (!user) return NextResponse.json({ error: "Inloggen vereist" }, { status: 401 });

  // Get seller profile
  const seller = user.sellerProfile;
  if (!seller) return NextResponse.json({ error: "Geen verkoper profiel" }, { status: 403 });

  try {
    const products = await prisma.product.findMany({
      where: {
        sellerId: seller.id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        priceCents: true,
        stock: true,
        maxStock: true,
        isActive: true,
        category: true,
        unit: true,
        delivery: true,
        createdAt: true,
        Image: {
          select: {
            fileUrl: true,
            sortOrder: true,
          },
          orderBy: { sortOrder: 'asc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error fetching seller products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUserWithSeller() as any;
  if (!user) return NextResponse.json({ error: "Inloggen vereist" }, { status: 401 });

  // Voor nu: als je nog geen sellerProfile hebt, maak er snel één.
  const seller = user.sellerProfile ?? await prisma.sellerProfile.create({
    data: {
      id: randomUUID(),
      userId: user.id,
      displayName: user.email?.split("@")[0] ?? "Seller",
    },
  });

  const body = await req.json();
  const { category, title, description, price, unit, delivery, stock, maxStock } = body;

  if (!category || !title || !price || !unit || !delivery) {
    return NextResponse.json({ error: "Verplichte velden missen" }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      sellerId: seller.id,
      category,
      title,
      description: description ?? "",
      priceCents: Math.round(Number(price) * 100),
      unit,
      delivery,
      stock: stock ? parseInt(stock) : 0,
      maxStock: maxStock ? parseInt(maxStock) : null,
    },
  });

  return NextResponse.json({ ok: true, id: product.id });
}
