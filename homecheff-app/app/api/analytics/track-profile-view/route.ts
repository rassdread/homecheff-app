import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const { profileUserId } = await req.json();

    if (!profileUserId) {
      return NextResponse.json(
        { error: 'Profile user ID is required' },
        { status: 400 }
      );
    }

    // Get viewer's user ID if logged in (optional)
    let viewerId: string | null = null;
    if (session?.user?.email) {
      const viewer = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      });
      viewerId = viewer?.id || null;
    }

    // Don't count views from the profile owner
    if (viewerId && viewerId === profileUserId) {
      return NextResponse.json({ success: true, selfView: true });
    }

    // Increment profile views
    await prisma.user.update({
      where: { id: profileUserId },
      data: {
        profileViews: {
          increment: 1
        }
      }
    });

    console.log(`[Profile View] Profile ${profileUserId} viewed by ${viewerId || 'anonymous'}`);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error tracking profile view:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

