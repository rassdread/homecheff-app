import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCorsHeaders } from '@/lib/apiCors';
import { findUserByCanonicalEmail } from '@/lib/auth/find-user-by-email';

export const dynamic = 'force-dynamic';

async function handleReadAll(req: NextRequest) {
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

    await prisma.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });

    return NextResponse.json({ success: true, unreadCount: 0 }, { headers });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false, unreadCount: 0 },
      { status: 500, headers },
    );
  }
}

export async function POST(req: NextRequest) {
  return handleReadAll(req);
}

export async function PUT(req: NextRequest) {
  return handleReadAll(req);
}

export async function PATCH(req: NextRequest) {
  return handleReadAll(req);
}
