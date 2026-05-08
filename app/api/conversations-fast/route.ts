import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { getCorsHeaders } from '@/lib/apiCors';
import { loadConversationsForSessionUser } from '@/lib/chat/loadConversationsForSessionUser';

/** Zelfde payload als GET /api/conversations; bedoeld voor snelle lijst zonder extra logica. */
export async function GET(req: NextRequest) {
  const cors = getCorsHeaders(req);
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors });
    }

    const result = await loadConversationsForSessionUser(session.user.email);
    if (!result) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers: cors });
    }

    return NextResponse.json({ conversations: result.conversations }, { headers: cors });
  } catch (error) {
    console.error('[Conversations Fast API]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: getCorsHeaders(req) }
    );
  }
}
