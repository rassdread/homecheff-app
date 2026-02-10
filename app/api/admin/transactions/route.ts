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
    const status = searchParams.get('status');
    const sellerId = searchParams.get('sellerId');
    const buyerId = searchParams.get('buyerId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    if (sellerId) {
      where.sellerId = sellerId;
    }

    if (buyerId) {
      where.buyerId = buyerId;
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

    const [allTransactions, allTransactionsCount] = await Promise.all([
      prisma.transaction.findMany({
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
          Reservation: {
            include: {
              User_Reservation_buyerIdToUser: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          Payout: {
            include: {
              User: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          Refund: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit * 2, // Get more to filter
        skip: offset
      }),
    prisma.transaction.findMany({
      where,
      select: { providerRef: true }
    })
  ]);

  // Get all providerRefs from transactions
  const allProviderRefs = [
    ...allTransactions.map(tx => tx.providerRef),
    ...allTransactionsCount.map(tx => tx.providerRef)
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

  // Filter transactions to only include those matching current Stripe mode
  const transactions = allTransactions.filter(tx => {
    const providerRef = tx.providerRef;
    return providerRef && validSessionIds.has(providerRef);
  }).slice(0, limit);

  const total = allTransactionsCount.filter(tx => {
    const providerRef = tx.providerRef;
    return providerRef && validSessionIds.has(providerRef);
  }).length;

    return NextResponse.json({
      transactions,
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}




