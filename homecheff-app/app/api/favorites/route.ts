import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId") || "anon";
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { Listing: true, User: true }
    });
    return NextResponse.json({ favorites });
  } catch (e) {
    console.error("favorites GET error", e);
    return NextResponse.json({ error: "Kon favorieten niet laden" }, { status: 500 });
  }
}

// (optioneel) POST om toggle te doen
export async function POST(req: NextRequest) {
  try {
    const { userId, productId } = await req.json();
    if (!userId || !productId) return NextResponse.json({ error: "userId/productId ontbreekt" }, { status: 400 });

    const existing = await prisma.favorite.findFirst({ where: { userId, listingId: productId } });
    if (existing) {
      await prisma.favorite.delete({ where: { userId_productId: { userId, productId } } });
      return NextResponse.json({ ok: true, favorited: false });
    } else {
      await prisma.favorite.create({ data: { userId, listingId: productId } });
      return NextResponse.json({ ok: true, favorited: true });
    }
  } catch (e) {
    console.error("favorites POST error", e);
    return NextResponse.json({ error: "Kon favoriet toggle niet uitvoeren" }, { status: 500 });
  }
}
