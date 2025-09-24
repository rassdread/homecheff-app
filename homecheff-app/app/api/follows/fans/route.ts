export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    
    // If no userId provided, use current user's ID
    let targetUserId = userId;
    if (!targetUserId) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true }
      });
      targetUserId = user?.id || null;
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all followers (fans) of the user
    const fans = await prisma.follow.findMany({
      where: { sellerId: targetUserId },
      include: {
        User: { 
          select: { 
            id: true, 
            name: true, 
            username: true,
            image: true,
            role: true 
          } 
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ 
      fans: fans.map(fan => ({
        id: fan.id,
        createdAt: fan.createdAt,
        user: fan.User
      }))
    });
  } catch (error) {
    console.error("fans GET error", error);
    return NextResponse.json({ error: "Kon fans-lijst niet laden" }, { status: 500 });
  }
}
