import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Count unread messages for this user
    const unreadCount = await prisma.message.count({
      where: {
        Conversation: {
          ConversationParticipant: {
            some: {
              userId: user.id
            }
          }
        },
        readAt: null,
        NOT: { senderId: user.id } // Exclude messages sent by the current user
      }
    });

    return NextResponse.json({ count: unreadCount });

  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json({ error: 'Failed to fetch unread count' }, { status: 500 });
  }
}
