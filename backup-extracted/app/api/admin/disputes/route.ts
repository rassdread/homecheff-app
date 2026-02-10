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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // OPEN, RESOLVED, CLOSED
    const orderId = searchParams.get('orderId');

    const where: any = {};

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    // Get reports that are related to orders (disputes)
    const reports = await prisma.report.findMany({
      where: {
        ...where,
        reason: {
          contains: 'order',
          mode: 'insensitive'
        }
      },
      include: {
        User_Report_reporterIdToUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        User_Report_targetUserIdToUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        AdminAction: {
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get orders with issues (cancelled, refunded, or with reports)
    const problematicOrders = await prisma.order.findMany({
      where: {
        OR: [
          { status: 'CANCELLED' },
          { status: 'REFUNDED' },
          {
            conversations: {
              some: {
                Message: {
                  some: {
                    text: {
                      contains: 'probleem',
                      mode: 'insensitive'
                    }
                  }
                }
              }
            }
          }
        ],
        ...(orderId && { id: orderId })
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true
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
                        email: true
                      }
                    }
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
              take: 5,
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
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 50
    });

    return NextResponse.json({
      reports,
      problematicOrders,
      total: reports.length + problematicOrders.length
    });
  } catch (error) {
    console.error('Error fetching disputes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch disputes' },
      { status: 500 }
    );
  }
}

// Resolve dispute
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

    const { reportId, action, notes, resolution } = await req.json();

    if (!reportId || !action) {
      return NextResponse.json(
        { error: 'Report ID and action required' },
        { status: 400 }
      );
    }

    // Update report status
    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date()
      }
    });

    // Create admin action
    await prisma.adminAction.create({
      data: {
        id: `admin_action_${Date.now()}`,
        adminId: user.id,
        reportId,
        action: `DISPUTE_${action.toUpperCase()}`,
        notes: notes || resolution || 'Dispute resolved'
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error resolving dispute:', error);
    return NextResponse.json(
      { error: 'Failed to resolve dispute' },
      { status: 500 }
    );
  }
}

