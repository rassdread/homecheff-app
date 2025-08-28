import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { listingId } = await req.json();
  await prisma.favorite.create({ data: { userId: "demo-user", listingId } });
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const listingId = searchParams.get("listingId");
  if (!listingId) return NextResponse.json({ error: "listingId required" }, { status: 400 });
  await prisma.favorite.delete({ where: { userId_listingId: { userId: "demo-user", listingId } } });
  return NextResponse.json({ ok: true });
}
