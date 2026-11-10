import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { listBroadcastHistory, readBroadcastHistory } from '@/lib/admin/load-broadcast-history';
import type { DeliveryChannel } from '@/lib/admin/broadcast-history';

export const dynamic = 'force-dynamic';

function dayParam(value: string | null): string | null {
  const day = value?.trim() || '';
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
}

function channelParam(value: string | null): 'all' | DeliveryChannel {
  if (value === 'inApp' || value === 'push' || value === 'email') return value;
  return 'all';
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) return null;
  const adminUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });
  if (adminUser?.role !== 'ADMIN' && adminUser?.role !== 'SUPERADMIN') return null;
  return session;
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Alleen een beheerder kan de verzendgeschiedenis bekijken.' }, { status: 401 });
  }
  const id = req.nextUrl.searchParams.get('id')?.trim() || '';
  if (id) {
    const detail = await readBroadcastHistory(prisma, id);
    if (!detail) {
      return NextResponse.json({ error: 'Deze verzending staat niet in de registratie.' }, { status: 404 });
    }
    return NextResponse.json(detail);
  }
  const q = req.nextUrl.searchParams.get('q') || '';
  const from = dayParam(req.nextUrl.searchParams.get('from'));
  const to = dayParam(req.nextUrl.searchParams.get('to'));
  const channel = channelParam(req.nextUrl.searchParams.get('channel'));
  const sends = await listBroadcastHistory(prisma, { query: q, from, to, channel });
  return NextResponse.json({
    sends,
    note: 'Alleen geregistreerde verzendingen uit Groei en Community staan hier. Oudere berichten zonder registratie kunnen ontbreken.',
  });
}
