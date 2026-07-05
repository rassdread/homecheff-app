import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCommsOperationsSummary } from '@/lib/communication/comms-operations-summary';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const summary = await getCommsOperationsSummary(user.id);
    return NextResponse.json(summary);
  } catch (error) {
    console.error('[communication-summary]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
