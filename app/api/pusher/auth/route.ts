import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';

export const dynamic = 'force-dynamic';

const ALLOWED_PRIVATE_PREFIX = 'private-delivery-';

/**
 * Authorize Pusher private channels for the authenticated user only.
 * @see lib/pusher.ts authEndpoint
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const rawBody = await req.text();
    const params = new URLSearchParams(rawBody);
    const socketId = params.get('socket_id')?.trim();
    const channelName = params.get('channel_name')?.trim();

    if (!socketId || !channelName) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    if (!channelName.startsWith(ALLOWED_PRIVATE_PREFIX)) {
      return NextResponse.json({ error: 'Forbidden channel' }, { status: 403 });
    }

    const channelUserId = channelName.slice(ALLOWED_PRIVATE_PREFIX.length);
    if (!channelUserId || channelUserId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: channel user mismatch' },
        { status: 403 },
      );
    }

    const authResponse = pusherServer.authorizeChannel(socketId, channelName);
    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('[Pusher Auth] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
