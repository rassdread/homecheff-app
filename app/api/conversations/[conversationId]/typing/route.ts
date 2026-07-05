import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { pusherServer } from '@/lib/pusher';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { conversationId } = params;
    const body = await req.json();
    const isTyping =
      typeof body.isTyping === 'boolean'
        ? body.isTyping
        : typeof body.typing === 'boolean'
          ? body.typing
          : false;

    await pusherServer.trigger(
      `conversation-${conversationId}`,
      'user-typing',
      {
        userId: user.id,
        isTyping,
        typing: isTyping,
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Typing API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

