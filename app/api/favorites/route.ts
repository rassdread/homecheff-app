import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";
import { getCorsHeaders } from "@/lib/apiCors";

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) });
}

export async function GET(req: NextRequest) {
  const cors = getCorsHeaders(req);
  try {
    const userId = req.nextUrl.searchParams.get("userId") || "anon";
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { Listing: true, User: true }
    });
    return NextResponse.json({ favorites }, { headers: cors });
  } catch (e) {
    console.error("favorites GET error", e);
    return NextResponse.json({ error: "Kon favorieten niet laden" }, { status: 500, headers: cors });
  }
}

// (optioneel) POST om toggle te doen
export async function POST(req: NextRequest) {
  const cors = getCorsHeaders(req);
  try {
    const { userId, productId } = await req.json();
    if (!userId || !productId) return NextResponse.json({ error: "userId/productId ontbreekt" }, { status: 400, headers: cors });

    const existing = await prisma.favorite.findFirst({ where: { userId, listingId: productId } });
    if (existing) {
      await prisma.favorite.delete({ where: { userId_productId: { userId, productId } } });
      return NextResponse.json({ ok: true, favorited: false }, { headers: cors });
    } else {
      await prisma.favorite.create({ data: { userId, listingId: productId } });
      return NextResponse.json({ ok: true, favorited: true }, { headers: cors });
    }
  } catch (e) {
    console.error("favorites POST error", e);
    return NextResponse.json({ error: "Kon favoriet toggle niet uitvoeren" }, { status: 500, headers: cors });
  }
}
