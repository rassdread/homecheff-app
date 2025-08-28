import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const category = searchParams.get("category") ?? undefined;

  const data = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      ...(category ? { category } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 60,
    include: { media: true, owner: { select: { id: true, name: true, image: true, place: true } } },
  });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, description, priceCents, imageUrl, category = "HOMECHEFF", lat, lng, place } = body;

  if (!title || !priceCents || !imageUrl) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const listing = await prisma.$transaction(async (tx: typeof prisma) => {
    const l = await tx.listing.create({
      data: {
        ownerId: "demo-user", // vervang straks door echte user id
        title,
        description: description ?? "",
        priceCents: Number(priceCents),
        category,
        status: "ACTIVE",
        lat: lat ?? null,
        lng: lng ?? null,
        place: place ?? null,
      },
    });
    await tx.listingMedia.create({
      data: { listingId: l.id, url: imageUrl, order: 0 },
    });
    return l;
  });

  return NextResponse.json(listing, { status: 201 });
}
