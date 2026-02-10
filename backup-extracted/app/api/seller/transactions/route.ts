import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get seller profile
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true }
    });

    if (!sellerProfile) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    // Get orders for this seller (Stripe source)
    const orders = await prisma.order.findMany({
      where: {
        stripeSessionId: { not: null },
        NOT: { orderNumber: { startsWith: 'SUB-' } },
        items: {
          some: {
            Product: {
              sellerId: sellerProfile.id
            }
          }
        }
      },
      select: { stripeSessionId: true }
    });

    const stripeSessionIds = orders.map(o => o.stripeSessionId).filter(Boolean) as string[];

    const where: any = {
      OR: [
        { sellerId: user.id },
        ...(stripeSessionIds.length > 0 ? [{ providerRef: { in: stripeSessionIds } }] : [])
      ]
    };

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
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

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          Reservation: {
            include: {
              Listing: {
                select: {
                  title: true
                }
              },
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
            orderBy: {
              createdAt: 'desc'
            }
          },
          Refund: {
            orderBy: {
              createdAt: 'desc'
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      }),
      prisma.transaction.count({ where })
    ]);

    return NextResponse.json({
      transactions: transactions.map(tx => ({
        id: tx.id,
        amountCents: tx.amountCents,
        platformFeeBps: tx.platformFeeBps,
        platformFee: Math.round((tx.amountCents * tx.platformFeeBps) / 10000),
        netAmount: tx.amountCents - Math.round((tx.amountCents * tx.platformFeeBps) / 10000),
        status: tx.status,
        provider: tx.provider,
        providerRef: tx.providerRef,
        createdAt: tx.createdAt,
        buyer: tx.Reservation?.User_Reservation_buyerIdToUser,
        productTitle: tx.Reservation?.Listing?.title,
        payouts: tx.Payout.map(p => ({
          id: p.id,
          amountCents: p.amountCents,
          createdAt: p.createdAt,
          providerRef: p.providerRef
        })),
        refunds: tx.Refund.map(r => ({
          id: r.id,
          amountCents: r.amountCents,
          createdAt: r.createdAt,
          providerRef: r.providerRef
        }))
      })),
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching seller transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

