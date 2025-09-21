import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sellerId = searchParams.get('sellerId');
    
    if (!sellerId) {
      return NextResponse.json({ error: 'Seller ID is required' }, { status: 400 });
    }

    const followerId = session.user.id;

    // Check if user follows this seller
    const follow = await prisma.follow.findFirst({
      where: {
        followerId,
        sellerId,
      },
    });

    return NextResponse.json({ 
      following: !!follow,
      followerId,
      sellerId
    });
  } catch (error) {
    console.error('Follow status error:', error);
    return NextResponse.json({ error: 'Failed to check follow status' }, { status: 500 });
  }
}


