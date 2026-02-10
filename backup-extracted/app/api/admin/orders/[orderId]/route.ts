import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { OrderMessagingService } from '@/lib/orderMessaging';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-08-27.basil' });

// Get order details
export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
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

    const { orderId } = params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            phoneNumber: true
          }
        },
        items: {
          include: {
            Product: {
              include: {
                seller: {
                  include: {
                    User: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                        username: true
                      }
                    }
                  }
                },
                Image: {
                  select: { fileUrl: true }
                }
              }
            }
          }
        },
        deliveryOrder: {
          include: {
            deliveryProfile: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phoneNumber: true
                  }
                }
              }
            }
          }
        },
        conversations: {
          include: {
            Message: {
              orderBy: { createdAt: 'desc' },
              take: 10,
              include: {
                User: {
                  select: {
                    id: true,
                    name: true,
                    username: true
                  }
                }
              }
            }
          },
          take: 1
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { providerRef: order.stripeSessionId || undefined },
          { reservationId: { contains: order.id } }
        ]
      },
      include: {
        Payout: true,
        Refund: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Get admin actions related to this order (for timeline)
    const adminActions = await prisma.adminAction.findMany({
      where: {
        OR: [
          { notes: { contains: order.orderNumber || order.id, mode: 'insensitive' } },
          { action: { contains: 'ORDER', mode: 'insensitive' } }
        ]
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get messages from order conversation (for timeline)
    const orderMessages = await prisma.message.findMany({
      where: {
        conversationId: order.conversations[0]?.id,
        messageType: 'ORDER_STATUS_UPDATE'
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      order: {
        ...order,
        transactions,
        timeline: [
          ...adminActions.map(action => ({
            type: 'admin_action',
            date: action.createdAt,
            user: action.User,
            action: action.action,
            notes: action.notes
          })),
          ...orderMessages.map(msg => ({
            type: 'status_update',
            date: msg.createdAt,
            user: msg.User,
            message: msg.text
          })),
          {
            type: 'order_created',
            date: order.createdAt,
            status: 'PENDING'
          },
          {
            type: 'order_updated',
            date: order.updatedAt,
            status: order.status
          }
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      }
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// Update order status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
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

    const { orderId } = params;
    const { status, notes, adminNotes } = await req.json();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        User: true,
        items: {
          include: {
            Product: {
              include: {
                seller: {
                  include: {
                    User: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const oldStatus = order.status;

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        ...(status && { status }),
        ...(notes && { notes }),
        ...(adminNotes && { notes: adminNotes })
      }
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        id: `admin_action_${Date.now()}`,
        adminId: user.id,
        action: `ORDER_STATUS_UPDATE`,
        notes: `Order ${order.orderNumber} status changed from ${oldStatus} to ${status || oldStatus}${adminNotes ? `. Notes: ${adminNotes}` : ''}`
      }
    });

    // Send notification if status changed
    if (status && status !== oldStatus) {
      try {
        const updateType = status === 'CONFIRMED' ? 'ORDER_CONFIRMED' :
                          status === 'PROCESSING' ? 'ORDER_PROCESSING' :
                          status === 'SHIPPED' ? 'ORDER_SHIPPED' :
                          status === 'DELIVERED' ? 'ORDER_DELIVERED' :
                          status === 'CANCELLED' ? 'ORDER_CANCELLED' :
                          'ORDER_STATUS_UPDATE';
        
        await OrderMessagingService.sendOrderUpdate({
          orderId: orderId,
          orderNumber: order.orderNumber || order.id,
          status: status
        }, updateType);
      } catch (error) {
        console.error('Error sending status update:', error);
      }
    }

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

// Cancel order and process refund
export async function DELETE(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
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

    const { orderId } = params;
    const { reason, refundAmount } = await req.json().catch(() => ({}));

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        User: true,
        items: {
          include: {
            Product: {
              include: {
                seller: {
                  include: {
                    User: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' }
    });

    // Process refund if Stripe session exists
    if (order.stripeSessionId && refundAmount) {
      try {
        const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
        if (session.payment_intent) {
          const paymentIntentId = typeof session.payment_intent === 'string' 
            ? session.payment_intent 
            : session.payment_intent.id;

          const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount: refundAmount || order.totalAmount,
            reason: 'requested_by_customer',
            metadata: {
              orderId: order.id,
              orderNumber: order.orderNumber || '',
              adminId: user.id,
              reason: reason || 'Admin cancellation'
            }
          });

          // Create refund record
          const transactions = await prisma.transaction.findMany({
            where: {
              providerRef: order.stripeSessionId
            }
          });

          for (const transaction of transactions) {
            await prisma.refund.create({
              data: {
                id: `refund_${order.id}_${Date.now()}`,
                transactionId: transaction.id,
                amountCents: refundAmount || order.totalAmount,
                providerRef: refund.id
              }
            });
          }
        }
      } catch (error: any) {
        console.error('Error processing refund:', error);
        // Continue even if refund fails
      }
    }

    // Log admin action
    await prisma.adminAction.create({
      data: {
        id: `admin_action_${Date.now()}`,
        adminId: user.id,
        action: `ORDER_CANCELLED`,
        notes: `Order ${order.orderNumber} cancelled by admin. Reason: ${reason || 'No reason provided'}. Refund: ${refundAmount ? `€${(refundAmount / 100).toFixed(2)}` : 'No refund'}`
      }
    });

    return NextResponse.json({ success: true, message: 'Order cancelled' });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { error: 'Failed to cancel order' },
      { status: 500 }
    );
  }
}

