import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sellerId = searchParams.get('sellerId');
    
    if (!sellerId) {
      return NextResponse.json({ error: 'Seller ID is required' }, { status: 400 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const followerId = user.id;

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

