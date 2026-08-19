import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { rejectHcOnlyOrder } from '@/lib/hc/marketplace-hc-order-service';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest, { params }: { params: { orderId: string } }) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ ok: false, code: 'UNAUTHENTICATED' }, { status: 401 });

  const result = await rejectHcOnlyOrder(params.orderId, userId);
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  return NextResponse.json({ ok: true, status: 'CANCELLED', hcReleased: true });
}
