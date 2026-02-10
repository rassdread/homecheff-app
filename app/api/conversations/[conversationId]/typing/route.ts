import { NextRequest, NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const { conversationId } = params;
    const { userId, isTyping } = await req.json();

    // Trigger Pusher event for typing indicator
    await pusherServer.trigger(
      `conversation-${conversationId}`,
      'user-typing',
      {
        userId,
        isTyping
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Typing API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

