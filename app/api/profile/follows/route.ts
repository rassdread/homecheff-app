import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    let targetUserId: string | null = null;
    
    if (userId) {
      // For public profile - get follows for specific user
      targetUserId = userId;
    } else if (session?.user) {
      // For private profile - get follows for current user
      const user = await prisma.user.findUnique({ 
        where: { email: session.user.email! }, 
        select: { id: true } 
      });
      if (!user) return NextResponse.json({ items: [] });
      targetUserId = user.id;
    } else {
      // No session and no userId provided
      return NextResponse.json({ items: [] });
    }

    if (!targetUserId) {
      return NextResponse.json({ items: [] });
    }

    const items = await prisma.follow.findMany({
      where: { followerId: targetUserId },
      orderBy: { createdAt: "desc" },
      include: { 
        Seller: { 
          select: { 
            id: true, 
            name: true, 
            username: true,
            image: true,
            profileImage: true,
            displayFullName: true,
            displayNameOption: true
          } 
        } 
      }
    });
    
    // Normalize the response - map Seller to seller for consistency
    const normalizedItems = items
      .filter(item => item.Seller) // Only include items with valid Seller data
      .map(item => ({
        id: item.id,
        createdAt: item.createdAt,
        seller: item.Seller  // Map Seller (capital) to seller (lowercase)
      }));
    
    return NextResponse.json({ items: normalizedItems });
  } catch (e) {
    console.error("Error in /api/profile/follows:", e);
    return NextResponse.json({ error: "Kon fan-lijst niet laden", details: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}
