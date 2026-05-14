import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCorsHeaders } from '@/lib/apiCors';
import { findUserByCanonicalEmail } from '@/lib/auth/find-user-by-email';
import { markChatNotificationsReadForConversation } from '@/lib/notifications/markChatNotificationsRead';
import { countEffectiveUnreadNotifications } from '@/lib/notifications/effectiveUnreadCount';

export const dynamic = 'force-dynamic';

function isAllowedRelatedType(raw: unknown): boolean {
  if (typeof raw !== 'string') return false;
  const u = raw.trim().toUpperCase();
  return (
    u === 'NEW_MESSAGE' ||
    u === 'MESSAGE_RECEIVED' ||
    u === 'NEW_CONVERSATION'
  );
}

/**
 * POST body: { type: "NEW_MESSAGE" | "MESSAGE_RECEIVED" | "NEW_CONVERSATION", conversationId: string }
 * Idempotent: marks chat-related notifications read for that conversation.
 */
export async function POST(req: NextRequest) {
  const cors = getCorsHeaders(req);
  const headers = {
    ...cors,
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  };
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    }

    const user = await findUserByCanonicalEmail(prisma, session.user.email, {
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400, headers });
    }

    const { type, conversationId } = body as {
      type?: unknown;
      conversationId?: unknown;
    };

    if (!isAllowedRelatedType(type)) {
      return NextResponse.json(
        { error: 'Unsupported type' },
        { status: 400, headers },
      );
    }

    const cid =
      typeof conversationId === 'string' ? conversationId.trim() : '';
    if (!cid || cid.length > 200) {
      return NextResponse.json(
        { error: 'conversationId required' },
        { status: 400, headers },
      );
    }

    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId: cid, userId: user.id },
      select: { id: true },
    });
    if (!participant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers });
    }

    const marked = await markChatNotificationsReadForConversation(user.id, cid);

    const sellerProfile = await prisma.sellerProfile
      .findUnique({
        where: { userId: user.id },
        select: { id: true },
      })
      .catch(() => null);
    const isSeller = !!sellerProfile;
    const unreadCount = await countEffectiveUnreadNotifications(user.id, isSeller);

    return NextResponse.json(
      { success: true, marked, unreadCount },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { error: 'Server error', success: false, unreadCount: 0 },
      { status: 500, headers },
    );
  }
}
