import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getOutboxStats,
  replayOutboxRows,
} from '@/lib/notifications/push-outbox';
import { processDuePushOutbox } from '@/lib/notifications/push-outbox-delivery';

export const dynamic = 'force-dynamic';

async function assertAdmin(): Promise<boolean> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return false;
  const user = await prisma.user.findUnique({
    where: { email },
    select: { role: true },
  });
  return user?.role === 'ADMIN';
}

function authorizeCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

/** Replay failed/expired outbox rows (admin session or CRON_SECRET). */
export async function POST(req: NextRequest) {
  const ok = authorizeCron(req) || (await assertAdmin());
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    ids?: string[];
    status?: 'FAILED' | 'EXPIRED';
    limit?: number;
    processNow?: boolean;
  } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    body = {};
  }

  const replayed = await replayOutboxRows({
    ids: Array.isArray(body.ids) ? body.ids.slice(0, 100) : undefined,
    status: body.status === 'EXPIRED' ? 'EXPIRED' : 'FAILED',
    limit: typeof body.limit === 'number' ? Math.min(body.limit, 200) : 50,
  });

  let processResult = null;
  if (body.processNow !== false) {
    processResult = await processDuePushOutbox(50);
  }

  const stats = await getOutboxStats();
  return NextResponse.json({
    success: true,
    replayed,
    processResult,
    stats,
  });
}

export async function GET(req: NextRequest) {
  const ok = authorizeCron(req) || (await assertAdmin());
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const stats = await getOutboxStats();
  return NextResponse.json({ success: true, stats });
}
