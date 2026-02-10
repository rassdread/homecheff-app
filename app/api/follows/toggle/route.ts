import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sellerId } = await req.json();
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

    // Check if user is trying to follow themselves
    if (followerId === sellerId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // Check if follow relationship already exists
    const existingFollow = await prisma.follow.findFirst({
      where: {
        followerId,
        sellerId,
      },
    });

    if (existingFollow) {
      // Unfollow
      await prisma.follow.delete({
        where: {
          id: existingFollow.id,
        },
      });

      return NextResponse.json({ 
        success: true, 
        following: false,
        message: 'Unfollowed successfully'
      });
    } else {
      // Follow
      await prisma.follow.create({
        data: {
          followerId,
          sellerId,
        },
      });

      return NextResponse.json({ 
        success: true, 
        following: true,
        message: 'Followed successfully'
      });
    }
  } catch (error) {
    console.error('Follow toggle error:', error);
    return NextResponse.json({ error: 'Failed to toggle follow' }, { status: 500 });
  }
}

