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

    // Get seller profile to ensure we're working with seller data
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true }
    });

    if (!sellerProfile) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {
      toUserId: user.id
    };

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        include: {
          Transaction: {
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
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      }),
      prisma.payout.count({ where })
    ]);

    const totalAmount = payouts.reduce((sum, p) => sum + p.amountCents, 0);

    return NextResponse.json({
      payouts: payouts.map(payout => ({
        id: payout.id,
        amountCents: payout.amountCents,
        createdAt: payout.createdAt,
        providerRef: payout.providerRef,
        transaction: {
          id: payout.Transaction.id,
          amountCents: payout.Transaction.amountCents,
          productTitle: payout.Transaction.Reservation?.Listing?.title,
          buyer: payout.Transaction.Reservation?.User_Reservation_buyerIdToUser
        }
      })),
      total,
      totalAmount,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching seller payouts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payouts' },
      { status: 500 }
    );
  }
}

