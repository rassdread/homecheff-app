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

    // Get orders for this seller (Stripe source) to find related transactions
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
        {
          Transaction: {
            sellerId: user.id
          }
        },
        ...(stripeSessionIds.length > 0 ? [{
          Transaction: {
            providerRef: { in: stripeSessionIds }
          }
        }] : [])
      ]
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

    const [refunds, total] = await Promise.all([
      prisma.refund.findMany({
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
      prisma.refund.count({ where })
    ]);

    const totalAmount = refunds.reduce((sum, r) => sum + r.amountCents, 0);

    return NextResponse.json({
      refunds: refunds.map(refund => ({
        id: refund.id,
        amountCents: refund.amountCents,
        createdAt: refund.createdAt,
        providerRef: refund.providerRef,
        transaction: {
          id: refund.Transaction.id,
          amountCents: refund.Transaction.amountCents,
          productTitle: refund.Transaction.Reservation?.Listing?.title,
          buyer: refund.Transaction.Reservation?.User_Reservation_buyerIdToUser
        }
      })),
      total,
      totalAmount,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching seller refunds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch refunds' },
      { status: 500 }
    );
  }
}

