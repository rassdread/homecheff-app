import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { confirmCargoFit } from '@/lib/delivery/standalone-delivery';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  const body = await req.json().catch(() => null);
  const requestId = body && typeof body === 'object' ? String((body as { requestId?: unknown }).requestId || '') : '';
  if (!requestId) return NextResponse.json({ error: 'Aanvraag ontbreekt.' }, { status: 400 });
  const result = await confirmCargoFit({ actorUserId: userId, requestId });
  if (!result.ok) return NextResponse.json({ error: result.error, code: result.code }, { status: result.status });
  return NextResponse.json({ success: true, paymentAvailable: result.paymentAvailable });
}
