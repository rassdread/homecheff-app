import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { assignDriverToDeliveryOrder } from '@/lib/delivery/company-dispatch';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  try {
    const result = await assignDriverToDeliveryOrder({
      deliveryOrderId: String(body.deliveryOrderId || ''),
      companyProfileId: String(body.companyProfileId || ''),
      actorUserId: session.user.id,
      driverUserId: String(body.driverUserId || ''),
      reason: body.reason ? String(body.reason) : undefined,
    });
    return NextResponse.json({
      ok: true,
      assignedDriverUserId: result.deliveryOrder.assignedDriverUserId,
      quotedFeeCents: result.quotedFeeCents,
      priceChanged: false,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, code: e.code || 'ERROR', message: e.message },
      { status: e.status || 500 },
    );
  }
}
