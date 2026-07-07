import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { loadCommunityOrderCheckoutContext } from '@/lib/marketplace/commerce/community-order-checkout';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const buyer = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!buyer) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const result = await loadCommunityOrderCheckoutContext(params.id, buyer.id);
    if (!result.ok) {
      return NextResponse.json(
        { errorKey: result.errorKey },
        { status: result.status },
      );
    }

    return NextResponse.json({
      communityOrderId: result.communityOrderId,
      item: result.item,
    });
  } catch (error) {
    console.error('[community-order checkout-context]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
