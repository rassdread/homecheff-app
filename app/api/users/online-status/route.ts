import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';

export const dynamic = 'force-dynamic';

// Update user online status
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    return NextResponse.json({
      success: true,
      isOnline: true,
      lastSeenAt: user.lastLocationUpdate
    });

  } catch (error) {
    console.error('Error updating online status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get user online status
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 🔒 PRIVACY CHECK: Only return online status if user has it enabled
    if (!user.showOnlineStatus) {
      return NextResponse.json({
        isOnline: false, // Always return false if privacy is disabled
        lastSeenAt: null, // Don't show last seen either
        privacyEnabled: false
      });
    }

    return NextResponse.json({
      isOnline: (user as any).isOnline || false,
      lastSeenAt: user.lastLocationUpdate
    });

  } catch (error) {
    console.error('Error getting online status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
