import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getCorsHeaders } from "@/lib/apiCors";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const cors = getCorsHeaders(req);
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors });
    }

    const { searchParams } = new URL(req.url);
    const sellerId = searchParams.get('sellerId');
    
    if (!sellerId) {
      return NextResponse.json({ error: 'Seller ID is required' }, { status: 400, headers: cors });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers: cors });
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
    }, { headers: cors });
  } catch (error) {
    console.error('Follow status error:', error);
    return NextResponse.json({ error: 'Failed to check follow status' }, { status: 500, headers: cors });
  }
}

