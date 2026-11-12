import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const VISIBLE_STATUSES = [
  'BOOKING_REQUESTED',
  'AWAITING_PAYMENT',
  'CHECKOUT',
  'PROPOSAL',
  'PAID',
  'EXPIRED',
  'REJECTED',
  'PAYMENT_REVIEW',
  'CANCELLED',
  'CANCELLED_AFTER_PAYMENT',
];

export async function GET() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  }
  const rows = await prisma.standaloneDeliveryRequest.findMany({
    where: { requesterUserId: userId, status: { in: VISIBLE_STATUSES } },
    orderBy: { updatedAt: 'desc' },
    take: 20,
    select: {
      id: true,
      jobKind: true,
      status: true,
      paymentStatus: true,
      itemDescription: true,
      buyerTotalCents: true,
      quotedFeeCents: true,
      updatedAt: true,
    },
  });
  return NextResponse.json({
    requests: rows.map((row) => ({
      id: row.id,
      jobKind: row.jobKind,
      status: row.status,
      paymentStatus: row.paymentStatus,
      itemDescription: row.itemDescription,
      buyerTotalCents: row.buyerTotalCents,
      quotedFeeCents: row.quotedFeeCents,
      updatedAt: row.updatedAt.toISOString(),
    })),
  });
}
