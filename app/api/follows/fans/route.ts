export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    
    // If userId is provided (for public profiles), allow access without authentication
    // Otherwise, require authentication
    let targetUserId = userId;
    if (!targetUserId) {
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
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
            profileImage: true,
            displayFullName: true,
            displayNameOption: true,
            role: true 
          } 
        }
      },
      orderBy: { createdAt: "desc" },
    });

    // Normalize the response - ensure user data is present
    const normalizedFans = fans
      .filter(fan => fan.User) // Only include fans with valid User data
      .map(fan => ({
        id: fan.id,
        createdAt: fan.createdAt,
        user: fan.User  // User is already lowercase
      }));
    
    return NextResponse.json({ 
      fans: normalizedFans
    });
  } catch (error) {
    console.error("Error in /api/follows/fans:", error);
    return NextResponse.json({ 
      error: "Kon fans-lijst niet laden", 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
