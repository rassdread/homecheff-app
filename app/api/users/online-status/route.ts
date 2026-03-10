import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';
import { getCorsHeaders } from '@/lib/apiCors';

export const dynamic = 'force-dynamic';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) });
}

// Update user online status
export async function POST(req: NextRequest) {
  const cors = getCorsHeaders(req);
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors });
    }

    const { isOnline } = await req.json();
    const now = new Date();

    // Update user's last seen timestamp
    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        lastLocationUpdate: now,
      },
      select: {
        id: true,
        name: true,
        username: true,
        lastLocationUpdate: true
      }
    });

    // Broadcast online status to all conversations this user is in
    const conversations = await prisma.conversationParticipant.findMany({
      where: { userId: user.id },
      select: { conversationId: true }
    });

    // Send Pusher event to all conversation channels
    for (const participant of conversations) {
      try {
        await pusherServer.trigger(
          `conversation-${participant.conversationId}`,
          'user-online',
          {
            userId: user.id,
            online: isOnline,
            lastSeenAt: user.lastLocationUpdate
          }
        );
      } catch (error) {
        console.error('Error sending online status:', error);
      }
    }

    return NextResponse.json(
      {
        success: true,
        isOnline: true,
        lastSeenAt: user.lastLocationUpdate,
      },
      { headers: cors }
    );
  } catch (error) {
    console.error('Error updating online status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: cors });
  }
}

// Get user online status
export async function GET(req: NextRequest) {
  const cors = getCorsHeaders(req);
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400, headers: cors });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers: cors });
    }

    // 🔒 PRIVACY CHECK: Only return online status if user has it enabled
    if (!user.showOnlineStatus) {
      return NextResponse.json(
        {
          isOnline: false,
          lastSeenAt: null,
          privacyEnabled: false,
        },
        { headers: cors }
      );
    }

    return NextResponse.json(
      {
        isOnline: (user as any).isOnline || false,
        lastSeenAt: user.lastLocationUpdate,
      },
      { headers: cors }
    );
  } catch (error) {
    console.error('Error getting online status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: cors });
  }
}
