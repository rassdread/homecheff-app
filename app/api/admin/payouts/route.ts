import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { matchesCurrentMode } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};

    if (userId) {
      where.toUserId = userId;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    const [allPayouts, allPayoutsCount] = await Promise.all([
      prisma.payout.findMany({
        where,
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true
            }
          },
          Transaction: {
            include: {
              User: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            },
            select: { providerRef: true }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit * 2, // Get more to filter
        skip: offset
      }),
      prisma.payout.findMany({
        where,
        include: {
          Transaction: {
            select: { providerRef: true }
          }
        }
      })
    ]);

    // Get all providerRefs from transactions
    const allProviderRefs = [
      ...allPayouts.map(p => p.Transaction?.providerRef),
      ...allPayoutsCount.map(p => p.Transaction?.providerRef)
    ].filter(Boolean) as string[];
    
    // Get orders by stripeSessionId
    const orders = allProviderRefs.length > 0 ? await prisma.order.findMany({
      where: { stripeSessionId: { in: allProviderRefs } },
      select: { stripeSessionId: true }
    }) : [];
    
    const validSessionIds = new Set(
      orders
        .filter(o => o.stripeSessionId && matchesCurrentMode(o.stripeSessionId))
        .map(o => o.stripeSessionId!)
    );

    // Filter payouts to only include those matching current Stripe mode
    const payouts = allPayouts.filter(payout => {
      const providerRef = payout.Transaction?.providerRef;
      return providerRef && validSessionIds.has(providerRef);
    }).slice(0, limit);

    const total = allPayoutsCount.filter(payout => {
      const providerRef = payout.Transaction?.providerRef;
      return providerRef && validSessionIds.has(providerRef);
    }).length;

    // Calculate totals
    const totalAmount = payouts.reduce((sum, p) => sum + p.amountCents, 0);

    return NextResponse.json({
      payouts,
      total,
      totalAmount,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching payouts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payouts' },
      { status: 500 }
    );
  }
}




