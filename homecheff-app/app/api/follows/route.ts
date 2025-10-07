export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || "anon";
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        Seller: { 
          select: { 
            id: true, 
            name: true, 
            image: true, 
            profileImage: true,
            username: true,
            role: true 
          } 
        }
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ following });
  } catch (e) {
    console.error("follows GET error", e);
    return NextResponse.json({ error: "Kon fan-lijst niet laden" }, { status: 500 });
  }
}
