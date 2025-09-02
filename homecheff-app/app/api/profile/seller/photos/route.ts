import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId, photos } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId ontbreekt" }, { status: 400 });
    if (!Array.isArray(photos)) return NextResponse.json({ error: "photos moet een array zijn" }, { status: 400 });
    if (photos.length < 1 || photos.length > 3) {
      return NextResponse.json({ error: "Minimaal 1 en maximaal 3 foto's" }, { status: 400 });
    }

  await prisma.business.update({
      where: { userId },
      data: { workplacePhotos: photos },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("seller photos error", e);
    return NextResponse.json({ error: "Kon werkplek-foto's niet opslaan" }, { status: 500 });
  }
}
