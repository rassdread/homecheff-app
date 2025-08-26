import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserWithSeller } from "@/lib/currentUser";

export async function POST(req: Request) {
  const user = await getCurrentUserWithSeller();
  if (!user) return NextResponse.json({ error: "Inloggen vereist" }, { status: 401 });

  // Voor nu: als je nog geen sellerProfile hebt, maak er snel één.
  const seller = user.sellerProfile ?? await prisma.sellerProfile.create({
    data: { userId: user.id, displayName: user.email?.split("@")[0] ?? "Seller" },
  });

  const body = await req.json();
  const { category, title, description, price, unit, delivery } = body;

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
    },
  });

  return NextResponse.json({ ok: true, id: product.id });
}
