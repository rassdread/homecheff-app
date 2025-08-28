import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const item = await prisma.listing.findUnique({
    where: { id: params.id },
    include: { media: true, owner: { select: { id: true, name: true, image: true, place: true } } },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const data = await req.json();
  const updated = await prisma.listing.update({ where: { id: params.id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.listing.update({ where: { id: params.id }, data: { status: "REMOVED" } });
  return NextResponse.json({ ok: true });
}
