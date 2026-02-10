import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-08-27.basil' });

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
    const orderId = searchParams.get('orderId');
    const transactionId = searchParams.get('transactionId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};

    if (transactionId) {
      where.transactionId = transactionId;
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

    const refunds = await prisma.refund.findMany({
      where,
      include: {
        Transaction: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            Reservation: {
              include: {
                Listing: {
                  include: {
                    User: {
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
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Filter by orderId if provided
    let filteredRefunds = refunds;
    if (orderId) {
      // Find transactions related to this order
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { stripeSessionId: true }
      });

      if (order?.stripeSessionId) {
        filteredRefunds = refunds.filter(r => 
          r.Transaction.providerRef === order.stripeSessionId
        );
      }
    }

    const total = filteredRefunds.length;
    const totalAmount = filteredRefunds.reduce((sum, r) => sum + r.amountCents, 0);

    return NextResponse.json({
      refunds: filteredRefunds,
      total,
      totalAmount,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching refunds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch refunds' },
      { status: 500 }
    );
  }
}

// Create refund
export async function POST(req: NextRequest) {
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

    const { transactionId, amountCents, reason } = await req.json();

    if (!transactionId || !amountCents) {
      return NextResponse.json(
        { error: 'Transaction ID and amount required' },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        Reservation: {
          include: {
            Listing: true
          }
        }
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Process Stripe refund if providerRef exists
    let stripeRefundId: string | null = null;
    if (transaction.providerRef) {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: transaction.providerRef,
          amount: amountCents,
          reason: 'requested_by_customer',
          metadata: {
            transactionId: transaction.id,
            adminId: user.id,
            reason: reason || 'Admin refund'
          }
        });
        stripeRefundId = refund.id;
      } catch (error: any) {
        console.error('Stripe refund error:', error);
        // Continue even if Stripe refund fails
      }
    }

    // Create refund record
    const refund = await prisma.refund.create({
      data: {
        id: `refund_${transactionId}_${Date.now()}`,
        transactionId: transaction.id,
        amountCents,
        providerRef: stripeRefundId
      }
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        id: `admin_action_${Date.now()}`,
        adminId: user.id,
        action: 'REFUND_CREATED',
        notes: `Refund created for transaction ${transactionId}. Amount: €${(amountCents / 100).toFixed(2)}. Reason: ${reason || 'No reason provided'}`
      }
    });

    return NextResponse.json({ refund });
  } catch (error) {
    console.error('Error creating refund:', error);
    return NextResponse.json(
      { error: 'Failed to create refund' },
      { status: 500 }
    );
  }
}

