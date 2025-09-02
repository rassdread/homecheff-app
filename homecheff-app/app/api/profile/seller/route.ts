import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId, bio, profileImage, workplacePhotos } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId ontbreekt" }, { status: 400 });
    if (!workplacePhotos || !Array.isArray(workplacePhotos) || workplacePhotos.length < 1) {
      return NextResponse.json({ error: "Minimaal één werkplek-foto vereist" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { bio, profileImage }
    });

  await prisma.business.update({
      where: { userId },
      data: { workplacePhotos }
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("seller profile error", e);
    return NextResponse.json({ error: "Kon verkopersprofiel niet opslaan" }, { status: 500 });
  }
}
